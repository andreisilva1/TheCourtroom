import json
import os

from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="mistral", base_url=os.getenv("OLLAMA_HOST", "http://localhost:11434"))


def evaluate_objection(
    fallacy_theme: str,
    fallacy_hidden_flaw: str,
    user_arguments: list[str],
) -> dict:
    user_args_text = "\n".join(f"- {arg}" for arg in user_arguments)

    prompt = f"""You are a strict debate judge evaluating whether a user has genuinely refuted a fallacious argument.

FALLACY ON TRIAL: "{fallacy_theme}"
LOGICAL FLAW IN THAT ARGUMENT: {fallacy_hidden_flaw}

USER'S ARGUMENTS:
{user_args_text}

YOUR STANDARD IS HIGH. The user wins ONLY if they meet ALL of the following:
1. At least one argument directly addresses the LOGICAL structure of the fallacy — not just disagrees with it.
2. They provide a concrete reason, evidence, or counter-example that exposes WHY the reasoning is flawed.
3. The arguments are substantive — coherent sentences with actual content.

The user AUTOMATICALLY LOSES if their arguments consist only of:
- Insults, slang, or informal dismissals ("you're lying", "cap", "no way", "bruh", etc.)
- Bare assertions with no reasoning ("that's wrong", "I disagree", "not true")
- Off-topic or irrelevant statements
- Very short phrases with no logical content

Be strict. A clever insult is not a refutation. Repetition of the same weak point does not compound into a strong argument.

Respond ONLY with valid JSON (no other text):
{{
    "won": true/false,
    "reason": "One sentence explaining the verdict, referencing the actual quality of the arguments",
    "example_refutation": "A strong refutation that WOULD have worked (required if won=false, null if won=true)"
}}"""

    response = llm.invoke(prompt).strip()

    try:
        start = response.find("{")
        end = response.rfind("}") + 1
        result = json.loads(response[start:end])
        return {
            "won": bool(result.get("won", False)),
            "reason": result.get("reason", "Unable to evaluate"),
            "example_refutation": result.get("example_refutation"),
        }
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing objection evaluation: {e}")
        return {
            "won": False,
            "reason": "Error evaluating objection",
            "example_refutation": None,
        }
