import os
import re
from urllib.parse import quote
from uuid import uuid4

import ollama
import requests
from bs4 import BeautifulSoup
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct


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


def fetch_reference_text(url: str) -> str | None:
    try:
        response = requests.get(
            url,
            timeout=10,
            headers=HEADERS,
        )

        if response.status_code >= 400:
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        for tag in soup(
            ["script", "style", "noscript", "svg", "header", "footer", "nav"]
        ):
            tag.decompose()

        text = clean_text(soup.get_text(separator=" ", strip=True))

        return text if len(text) >= 500 else None

    except requests.RequestException:
        return None


def search_persona_context(
    persona_id: str,
    query: str,
    limit: int = 8,
) -> list[str]:
    query_vector = embed_text(query)

    results = qdrant.search(
        collection_name=QDRANT_COLLECTION,
        query_vector=query_vector,
        query_filter={
            "must": [
                {
                    "key": "persona_id",
                    "match": {
                        "value": persona_id,
                    },
                }
            ]
        },
        limit=limit,
    )

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
) -> str:
    """Build prompt for persona to defend their fallacious position with personality and context."""

    # Determine personality traits
    rational_score = traits.get("rational", 0.5)
    aggressive_score = traits.get("aggressive", 0.5)
    optimistic_score = traits.get("optimistic", 0.5)

    # Build persona style
    style = []
    if rational_score > 0.6:
        style.append("cite facts and logic")
    if aggressive_score > 0.6:
        style.append("be confrontational")
    if optimistic_score > 0.6:
        style.append("emphasize positive possibilities")

    style_str = ", ".join(style) if style else "be balanced"
    context_str = " ".join(chunk[:100] for chunk in context_chunks[:2]) if context_chunks else ""

    prompt = f"""You are {persona_name}. A user is challenging your position on: "{fallacy_theme}"

User's argument: {user_argument}

Context about you: {context_str}

Your goal is to DEFEND your original position. You should:
- Stay committed to your position
- Acknowledge their point but explain why you disagree
- {style_str}
- Use specific examples or reasoning to support your view
- Keep it concise (2-3 sentences)

Respond as {persona_name}, speaking in first person:"""

    return prompt
