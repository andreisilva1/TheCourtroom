import json
import os
import re
from langchain_ollama import OllamaLLM
from backend.utils import (
    PERSONALITY_QUESTIONS,
    get_persona_embeddings,
    build_persona_response_prompt,
)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
llm = OllamaLLM(model="mistral", base_url=OLLAMA_HOST)


def run_personality_quiz(persona_name: str) -> dict:
    """Run personality quiz for a persona using LLM."""
    questions_text = "\n".join(
        [
            f"{i + 1}. {q['question']} (respond with a number 1-10, where 1 is '{q['low']}' and 10 is '{q['high']}')"
            for i, q in enumerate(PERSONALITY_QUESTIONS)
        ]
    )

    prompt = f"""You are {persona_name}. Answer the following personality questions honestly based on your character, values, and worldview.

{questions_text}

Respond ONLY with a JSON object like this (no other text):
{{"responses": [<number>, <number>, ...] }}

where each number is 1-10 for each question."""

    response = llm.invoke(prompt)
    response_text = response.strip()

    # Extract JSON from response
    try:
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        json_str = response_text[start:end]
        data = json.loads(json_str)
        responses = data.get("responses", [])

        # Convert responses to trait scores (1-10 → 0.0-1.0)
        traits = {}
        for i, question in enumerate(PERSONALITY_QUESTIONS):
            if i < len(responses):
                score = responses[i]
                # Clamp between 1-10
                score = max(1, min(10, score))
                # Convert to 0.0-1.0
                traits[question["id"]] = (score - 1) / 9.0
            else:
                traits[question["id"]] = 0.5

        return traits
    except (json.JSONDecodeError, IndexError) as e:
        print(f"Error parsing personality quiz: {e}")
        # Return neutral traits on error
        return {q["id"]: 0.5 for q in PERSONALITY_QUESTIONS}


def generate_persona_response_to_user(
    persona_name: str,
    persona_id: str,
    traits: dict[str, float],
    fallacy_theme: str,
    user_argument: str,
    voice: str | None = None,
) -> str:
    context_chunks = get_persona_embeddings(
        persona_id,
        traits,
        fallacy_theme,
        limit=3,
    )

    prompt = build_persona_response_prompt(
        persona_name,
        traits,
        context_chunks,
        fallacy_theme,
        user_argument,
        voice=voice,
    )

    raw = llm.invoke(prompt).strip()

    if not raw:
        return f"I maintain my position on {fallacy_theme}."

    try:
        match = re.search(r'\{.*?\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group()).get("response", raw).strip()
    except (json.JSONDecodeError, AttributeError):
        pass

    return raw
