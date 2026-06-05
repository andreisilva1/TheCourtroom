import os
from uuid import UUID

from sqlalchemy import create_engine
from sqlmodel import Session

from backend.database.models import Persona
from backend.pipeline import wikipedia_resolver
from backend.utils import (
    embed_and_store_text,
    fetch_reference_text,
    get_wiki_image,
)
from backend.worker.celery import celery_app


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
def build_persona(persona_id: str, persona_name: str, max_references: int = 20):
    try:
        information_found = wikipedia_resolver(persona_name)

        wiki_text = information_found.get("wiki") or ""
        references = information_found.get("references") or []

        image_bytes = get_wiki_image(persona_name)
        if image_bytes:
            update_persona_image(persona_id, image_bytes)

        if wiki_text:
            embed_and_store_text(
                persona_id=persona_id,
                text=wiki_text,
                source_type="wikipedia",
                source_url=None,
            )

        successful_refs = 0

        for reference in references[:max_references]:
            text = fetch_reference_text(reference)

            if not text:
                continue

            embed_and_store_text(
                persona_id=persona_id,
                text=text,
                source_type="reference",
                source_url=reference,
            )

            successful_refs += 1

        mark_persona_loaded(persona_id)

        return {
            "persona_id": persona_id,
            "persona_name": persona_name,
            "references_indexed": successful_refs,
        }

    except Exception as exc:
        mark_persona_failed(persona_id, str(exc))
        raise


def update_persona_image(persona_id: str, image_bytes: bytes):
    with Session(engine) as session:
        persona = session.get(Persona, UUID(persona_id))

        if not persona:
            return

        persona.image = image_bytes
        session.add(persona)
        session.commit()


def mark_persona_loaded(persona_id: str):
    with Session(engine) as session:
        persona = session.get(Persona, UUID(persona_id))

        if not persona:
            return

        persona.loaded = True
        persona.failed = False
        persona.error_message = None

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
