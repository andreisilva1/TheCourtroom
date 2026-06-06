import os
import re
from urllib.parse import quote
from uuid import uuid4

import ollama
import requests
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue


QDRANT_COLLECTION = "persona_chunks"
EMBED_MODEL = "nomic-embed-text"

HEADERS = {"User-Agent": "TheCourtroom/1.0 (local-ai-project)"}

qdrant = QdrantClient(
    host=os.getenv("QDRANT_HOST", "qdrant"),
    port=int(os.getenv("QDRANT_PORT", "6333")),
)


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def chunk_text(text: str, size: int = 3000, overlap: int = 300) -> list[str]:
    text = clean_text(text)

    if not text:
        return []

    # A short source (already validated as meaningful by its resolver) is kept
    # whole, instead of being discarded by the long-document fragment filter.
    if len(text) <= size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        chunk = text[start : start + size].strip()

        if len(chunk) > 200:
            chunks.append(chunk)

        start += size - overlap

    return chunks


def embed_text(text: str) -> list[float]:
    response = ollama.embeddings(
        model=EMBED_MODEL,
        prompt=text,
    )

    return response["embedding"]


def add_to_qdrant(
    persona_id: str,
    vector: list[float],
    text: str,
    source_type: str,
    source_url: str | None = None,
) -> None:
    qdrant.upsert(
        collection_name=QDRANT_COLLECTION,
        points=[
            PointStruct(
                id=str(uuid4()),
                vector=vector,
                payload={
                    "persona_id": persona_id,
                    "text": text,
                    "source_type": source_type,
                    "source_url": source_url,
                },
            )
        ],
    )


def embed_and_store_text(
    persona_id: str,
    text: str,
    source_type: str,
    source_url: str | None = None,
) -> None:
    for chunk in chunk_text(text):
        add_to_qdrant(
            persona_id=persona_id,
            vector=embed_text(chunk),
            text=chunk,
            source_type=source_type,
            source_url=source_url,
        )


def get_wiki_image(persona_name: str) -> bytes | None:
    try:
        response = requests.get(
            f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(persona_name)}",
            timeout=5,
            headers=HEADERS,
        )
        response.raise_for_status()

        image_url = response.json().get("thumbnail", {}).get("source")
        if not image_url:
            return None

        image_response = requests.get(
            image_url,
            timeout=10,
            headers=HEADERS,
        )
        image_response.raise_for_status()

        return image_response.content

    except requests.RequestException:
        return None


def search_persona_context(
    persona_id: str,
    query: str,
    limit: int = 8,
) -> list[str]:
    query_vector = embed_text(query)

    results = qdrant.query_points(
        collection_name=QDRANT_COLLECTION,
        query=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="persona_id",
                    match=MatchValue(value=persona_id),
                )
            ]
        ),
        limit=limit,
    ).points

    return [
        item.payload["text"]
        for item in results
        if item.payload and "text" in item.payload
    ]


# Personality questions for trait-based generation
PERSONALITY_QUESTIONS = [
    {
        "id": "rational",
        "question": "Do you prefer logic and facts or intuition and feelings?",
        "low": "Intuitive and emotional",
        "high": "Logical and analytical",
    },
    {
        "id": "progressive",
        "question": "Do you prefer tradition or innovation?",
        "low": "Traditional and established",
        "high": "Progressive and innovative",
    },
    {
        "id": "aggressive",
        "question": "In conflicts, are you more passive or assertive?",
        "low": "Passive and accommodating",
        "high": "Assertive and aggressive",
    },
    {
        "id": "optimistic",
        "question": "Are you generally optimistic or pessimistic about the future?",
        "low": "Pessimistic",
        "high": "Optimistic",
    },
    {
        "id": "practical",
        "question": "Do you focus on practical results or theoretical concepts?",
        "low": "Theoretical and abstract",
        "high": "Practical and concrete",
    },
]


def get_persona_embeddings(
    persona_id: str,
    traits: dict[str, float],
    topic: str,
    limit: int = 3,
) -> list[str]:
    """Fetch relevant embeddings based on personality traits and topic."""
    trait_keywords = {
        "rational": "logic science reason fact evidence",
        "progressive": "innovation future change advance progress",
        "aggressive": "power strength conflict challenge",
        "optimistic": "hope success possibility potential",
        "practical": "effective efficient result action",
    }

    # Build query based on dominant traits + topic
    keywords = []
    for trait_id, score in traits.items():
        if score > 0.6 and trait_id in trait_keywords:
            keywords.append(trait_keywords[trait_id])

    query = f"{topic} " + " ".join(keywords) if keywords else topic

    # Fetch relevant embeddings
    results = search_persona_context(persona_id, query, limit=limit)
    return results


def build_persona_response_prompt(
    persona_name: str,
    traits: dict[str, float],
    context_chunks: list[str],
    fallacy_theme: str,
    user_argument: str,
    voice: str | None = None,
) -> str:
    rational_score = traits.get("rational", 0.5)
    aggressive_score = traits.get("aggressive", 0.5)
    optimistic_score = traits.get("optimistic", 0.5)

    style = []
    if rational_score > 0.6:
        style.append("cite facts and logic")
    if aggressive_score > 0.6:
        style.append("be confrontational")
    if optimistic_score > 0.6:
        style.append("emphasize positive possibilities")

    style_str = ", ".join(style) if style else "be balanced"
    context_str = " ".join(chunk[:100] for chunk in context_chunks[:2]) if context_chunks else ""
    voice_line = f"\nSpeak exactly like this: {voice}" if voice else ""

    prompt = f"""Write a debate response from {persona_name}'s perspective.{voice_line}

Context about {persona_name}: {context_str}

The debate topic is: "{fallacy_theme}"
The user just argued: "{user_argument}"

Rules:
- First person only (I, me, my) — do not use the name "{persona_name}" in the response
- {style_str}
- Acknowledge their point but firmly defend the original position
- 2-3 sentences, under 500 characters

Respond with ONLY a JSON object in this exact format (no other text):
{{"response": "<the reply here>"}}"""

    return prompt
