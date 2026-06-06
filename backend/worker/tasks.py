import os
from uuid import UUID

from langchain_ollama import OllamaLLM
from sqlalchemy import create_engine
from sqlmodel import Session

from backend.database.models import Persona
from backend.pipeline import (
    wikipedia_resolver,
    wikidata_resolver,
    dbpedia_resolver,
    wikiquote_resolver,
)
from backend.utils import (
    embed_and_store_text,
    get_wiki_image,
)
from backend.worker.celery import celery_app

_llm = OllamaLLM(
    model="mistral",
    base_url=os.getenv("OLLAMA_HOST", "http://localhost:11434"),
)


def get_sync_engine():
    url = (
        os.getenv("DATABASE_URL", "sqlite:///./thecourtroom.db")
        .replace("sqlite+aiosqlite", "sqlite")
        .replace("+asyncpg", "")
    )

    return create_engine(
        url,
        connect_args={"check_same_thread": False} if "sqlite" in url else {},
    )


engine = get_sync_engine()


@celery_app.task()
def build_persona(persona_id: str, persona_name: str):
    try:
        image_bytes = get_wiki_image(persona_name)
        if image_bytes:
            update_persona_image(persona_id, image_bytes)

        # Gather every source; each is resilient (None/"" on failure) so a
        # single flaky endpoint never breaks the build.
        sources = [
            ("wikipedia", wikipedia_resolver(persona_name)),
            ("wikidata", wikidata_resolver(persona_name)),
            ("dbpedia", dbpedia_resolver(persona_name)),
            ("wikiquote", wikiquote_resolver(persona_name)),
        ]

        sources_indexed = []
        for source_type, text in sources:
            if not text:
                continue
            embed_and_store_text(
                persona_id=persona_id,
                text=text,
                source_type=source_type,
                source_url=None,
            )
            sources_indexed.append(source_type)

        voice = _generate_voice(persona_name)
        mark_persona_loaded(persona_id, voice=voice)

        return {
            "persona_id": persona_id,
            "persona_name": persona_name,
            "sources_indexed": sources_indexed,
        }

    except Exception as exc:
        mark_persona_failed(persona_id, str(exc))
        raise


def _generate_voice(persona_name: str) -> str | None:
    prompt = (
        f"Describe {persona_name}'s speaking style in ONE sentence. "
        "Cover: personality, temperament, vocabulary or slang, cultural/regional background if notable, and their role or field. "
        "Reply with only the sentence — no preamble, no quotes.\n"
        'Example: "A visionary Serbian-American inventor who speaks with formal precision and intense passion, '
        'blending scientific terminology with poetic declarations about electricity and the future."'
    )
    try:
        result = _llm.invoke(prompt).strip()
        # keep it to one sentence and a sane length
        sentence = result.split("\n")[0].strip()
        return sentence[:300] if sentence else None
    except Exception as exc:
        print(f"[voice] failed to generate voice for {persona_name}: {exc}")
        return None


def update_persona_image(persona_id: str, image_bytes: bytes):
    with Session(engine) as session:
        persona = session.get(Persona, UUID(persona_id))

        if not persona:
            return

        persona.image = image_bytes
        session.add(persona)
        session.commit()


def mark_persona_loaded(persona_id: str, voice: str | None = None):
    with Session(engine) as session:
        persona = session.get(Persona, UUID(persona_id))

        if not persona:
            return

        persona.loaded = True
        persona.failed = False
        persona.error_message = None
        if voice:
            persona.voice = voice

        session.add(persona)
        session.commit()


def mark_persona_failed(persona_id: str, error_message: str):
    with Session(engine) as session:
        persona = session.get(Persona, UUID(persona_id))

        if not persona:
            return

        persona.loaded = False
        persona.failed = True
        persona.error_message = error_message[:1000]

        session.add(persona)
        session.commit()
