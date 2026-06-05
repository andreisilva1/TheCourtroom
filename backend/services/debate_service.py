import json
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database.models import Debate, Persona


class DebateService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(
        self,
        debate_id: str | None,
        persona_id: str,
        challenger_id: str | None,
        topic: str,
        persona_message: dict | None = None,
        challenger_message: dict | None = None,
    ) -> Debate:
        """
        Add or update a debate.
        If debate_id is None, creates a new debate.
        If debate_id exists, appends messages to existing debate.

        persona_message: {"role": "opening", "message": "..."}
        challenger_message: {"role": "argument", "message": "..."}
        """

        if debate_id is None:
            # Create new debate
            messages = []
            if persona_message:
                messages.append({
                    "persona_id": persona_id,
                    "role": persona_message.get("role"),
                    "message": persona_message.get("message"),
                })
            if challenger_message:
                messages.append({
                    "persona_id": challenger_id,
                    "role": challenger_message.get("role"),
                    "message": challenger_message.get("message"),
                })

            debate = Debate(
                persona_id=persona_id,
                challenger_id=challenger_id,
                topic=topic,
                messages=json.dumps(messages),
            )
            self.session.add(debate)
            await self.session.commit()
            await self.session.refresh(debate)
            return debate

        else:
            # Update existing debate
            result = await self.session.execute(
                select(Debate).where(Debate.id == UUID(debate_id))
            )
            debate = result.scalar_one_or_none()

            if not debate:
                raise ValueError(f"Debate {debate_id} not found")

            # Parse existing messages
            messages = json.loads(debate.messages)

            # Append new messages
            if persona_message:
                messages.append({
                    "persona_id": persona_id,
                    "role": persona_message.get("role"),
                    "message": persona_message.get("message"),
                })
            if challenger_message:
                messages.append({
                    "persona_id": challenger_id,
                    "role": challenger_message.get("role"),
                    "message": challenger_message.get("message"),
                })

            # Update debate
            debate.messages = json.dumps(messages)
            self.session.add(debate)
            await self.session.commit()
            await self.session.refresh(debate)
            return debate

    async def get_by_id(self, debate_id: str) -> Debate | None:
        """Fetch debate by ID."""
        result = await self.session.execute(
            select(Debate).where(Debate.id == UUID(debate_id))
        )
        return result.scalar_one_or_none()

    async def get_messages(self, debate_id: str) -> list:
        """Get parsed messages from a debate."""
        debate = await self.get_by_id(debate_id)
        if not debate:
            return []
        return json.loads(debate.messages)

    async def save_traits(self, persona_id: str, traits: dict) -> None:
        """Save personality traits to a persona."""
        result = await self.session.execute(
            select(Persona).where(Persona.id == UUID(persona_id))
        )
        persona = result.scalar_one_or_none()

        if not persona:
            return

        persona.traits = json.dumps(traits)
        self.session.add(persona)
        await self.session.commit()

    async def get_traits(self, persona_id: str) -> dict | None:
        """Get personality traits from a persona."""
        result = await self.session.execute(
            select(Persona).where(Persona.id == UUID(persona_id))
        )
        persona = result.scalar_one_or_none()

        if not persona or not persona.traits:
            return None

        return json.loads(persona.traits)

    def get_last_message_by(self, messages: list, persona_id: str) -> str | None:
        """Extract the last message authored by the given participant id."""
        for msg in reversed(messages):
            if msg.get("persona_id") == persona_id:
                return msg.get("message")
        return None
