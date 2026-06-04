"""
Generate personalized fallacious arguments based on persona traits.
"""

from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="phi", base_url="http://ollama:11434")


def generate_fallacy_for_persona(persona_name: str, traits: dict | None) -> dict:
    """
    Generate a fallacy that matches the persona's personality traits.

    Returns: {
        "theme": "Complete hot take argument",
        "type": "fallacy_type",
        "hidden_flaw": "The logical flaw",
        "explanation": "Why this is a fallacy"
    }
    """

    if not traits:
        traits = {}

    # Extremely simple - just ask for a hot take in plain English
    # IMPORTANT: Enforce first-person perspective
    prompt = f"""You are {persona_name}. Write a controversial hot take in FIRST PERSON (use I, me, my).

CRITICAL: Always speak as {persona_name} directly. NEVER use third person like "{persona_name} believes" or "He thinks".

Correct examples:
- "I believe that..."
- "In my opinion..."
- "I think the truth is..."

Write a 2-3 sentence controversial statement that YOU ({persona_name}) would argue:"""

    response = llm.invoke(prompt)
    response_text = response.strip()

    # Validate response is substantial
    if len(response_text) < 25:
        raise ValueError(f"Response too short: {response_text}")

    # Clean up obvious prefixes
    import re
    theme = re.sub(r'^(Response:|Output:|Answer:|I believe that |)[:\s]*', '', response_text, flags=re.IGNORECASE).strip()

    if len(theme) < 25 or len(theme) > 500:
        raise ValueError(f"Theme length invalid: {len(theme)}")

    return {
        "theme": theme,
        "type": "false_dichotomy",
        "hidden_flaw": "Oversimplifies complex issues into black-and-white thinking.",
        "explanation": f"Most situations are nuanced, not binary like {persona_name} suggests.",
    }
