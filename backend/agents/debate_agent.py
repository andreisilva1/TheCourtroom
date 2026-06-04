import json
from langchain_ollama import OllamaLLM
from backend.utils import (
    PERSONALITY_QUESTIONS,
    get_persona_embeddings,
    build_persona_response_prompt,
)

llm = OllamaLLM(model="phi", base_url="http://ollama:11434")


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
    personality_scores: dict[str, float],
    fallacy_theme: str,
    user_argument: str,
) -> str:
    """Generate persona's response using RAG (embeddings) + personality traits."""

    # Get relevant context from persona's knowledge base
    context_chunks = get_persona_embeddings(
        persona_id,
        personality_scores,
        fallacy_theme,
        limit=3,
    )

    # Build personalized prompt based on traits
    prompt = build_persona_response_prompt(
        persona_name,
        personality_scores,
        context_chunks,
        fallacy_theme,
        user_argument,
    )

    # Generate response
    response = llm.invoke(prompt).strip()

    if not response:
        return f"I maintain my position on {fallacy_theme}."

    return response
