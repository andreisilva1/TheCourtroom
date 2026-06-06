import json
import os
import re

from langchain_ollama import OllamaLLM
from pydantic import BaseModel, field_validator

llm = OllamaLLM(model="mistral", base_url=os.getenv("OLLAMA_HOST", "http://localhost:11434"))

_BROKEN_CHARACTER_MARKERS = (
    "i am an ai",
    "as an ai",
    "i'm an ai",
    "language model",
    "artificial intelligence assistant",
    "i am a computer",
    "i cannot",
    "i don't have",
)


class FallacyOutput(BaseModel):
    theme: str

    @field_validator("theme")
    @classmethod
    def validate_theme(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 25:
            raise ValueError("theme too short")
        lower = v.lower()
        if any(m in lower for m in _BROKEN_CHARACTER_MARKERS):
            raise ValueError("model broke character")
        return v


def _extract_json(text: str) -> dict:
    """Pull the first {...} block out of a response that may have extra text."""
    match = re.search(r'\{.*?\}', text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in response: {text!r}")
    return json.loads(match.group())


def generate_fallacy_for_persona(persona_name: str, traits: dict | None, voice: str | None = None) -> dict:
    if not traits:
        traits = {}

    voice_line = f" {voice}" if voice else ""

    prompt = f"""Write a controversial hot take that {persona_name} would personally argue.{voice_line}

Rules:
- First person only (I, me, my) — do not use the name "{persona_name}" inside the text
- Strong and one-sided — no "however", no balance, no caveats
- Specific to {persona_name}'s actual field or life, not a generic opinion
- 2-3 sentences, under 500 characters

Respond with ONLY a JSON object in this exact format (no other text):
{{"theme": "<the hot take here>"}}"""

    response = llm.invoke(prompt).strip()

    raw = _extract_json(response)
    output = FallacyOutput.model_validate(raw)

    return {
        "theme": output.theme,
        "type": "false_dichotomy",
        "hidden_flaw": "Oversimplifies a complex issue into an absolute claim.",
        "explanation": f"{persona_name} presents a one-sided extreme without acknowledging counterevidence.",
    }
