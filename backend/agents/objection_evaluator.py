"""
Evaluate user's objection against a fallacy.
Determine if user has sufficiently refuted the fallacious argument.
"""

from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="phi", base_url="http://ollama:11434")


def evaluate_objection(
    fallacy_theme: str,
    fallacy_hidden_flaw: str,
    user_arguments: list[str],
) -> dict:
    """
    Evaluate if user's arguments sufficiently refute the fallacy.

    Returns: {
        "won": bool,
        "reason": "Why they won/lost",
        "example_refutation": "A strong refutation (only if lost)"
    }
    """

    user_args_text = "\n".join([f"- {arg}" for arg in user_arguments])

    prompt = f"""You are judging a debate where the user must refute a fallacious argument.

FALLACY CLAIMED: {fallacy_theme}

THE FLAW IN THIS ARGUMENT: {fallacy_hidden_flaw}

USER'S ARGUMENTS TO REFUTE IT:
{user_args_text}

Your task: Determine if the user has successfully refuted the fallacy.

To successfully refute, the user should:
1. Identify or imply the logical flaw
2. Provide evidence, examples, or reasoning that contradicts the fallacy
3. Show why the original claim is wrong

Respond ONLY with valid JSON (no other text):
{{
    "won": true/false,
    "reason": "Brief explanation of why they won or lost",
    "example_refutation": "A strong refutation that would have worked (only if won=false, otherwise null)"
}}

Example responses:
- If they won: {{"won": true, "reason": "User correctly identified that technology cannot solve existential problems", "example_refutation": null}}
- If they lost: {{"won": false, "reason": "Arguments too vague and don't address the core flaw", "example_refutation": "Technology didn't solve: meaning, purpose, human connection, existential dread"}}
"""

    response = llm.invoke(prompt)
    response_text = response.strip()

    # Extract JSON
    import json

    try:
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        json_str = response_text[start:end]
        result = json.loads(json_str)

        return {
            "won": result.get("won", False),
            "reason": result.get("reason", "Unable to evaluate"),
            "example_refutation": result.get("example_refutation"),
        }
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing objection evaluation: {e}")
        return {
            "won": False,
            "reason": "Error evaluating objection",
            "example_refutation": "Unable to generate refutation example",
        }
