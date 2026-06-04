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
        attacker_id: str,
        defender_id: str | None,
        topic: str,
        attacker_message: dict | None = None,
        defender_message: dict | None = None,
    ) -> Debate:
        """
        Add or update a debate.
        If debate_id is None, creates a new debate.
        If debate_id exists, appends messages to existing debate.

        attacker_message: {"role": "attacker", "message": "..."}
        defender_message: {"role": "defender", "message": "..."}
        """

        if debate_id is None:
            # Create new debate
            messages = []
            if attacker_message:
                messages.append({
                    "persona_id": attacker_id,
                    "role": attacker_message.get("role"),
                    "message": attacker_message.get("message"),
                })
            if defender_message:
                messages.append({
                    "persona_id": defender_id,
                    "role": defender_message.get("role"),
                    "message": defender_message.get("message"),
                })

            debate = Debate(
                attacker_id=UUID(attacker_id),
                defender_id=UUID(defender_id) if defender_id else None,
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
            if attacker_message:
                messages.append({
                    "persona_id": attacker_id,
                    "role": attacker_message.get("role"),
                    "message": attacker_message.get("message"),
                })
            if defender_message:
                messages.append({
                    "persona_id": defender_id,
                    "role": defender_message.get("role"),
                    "message": defender_message.get("message"),
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

    def get_opponent_last_message(self, messages: list, opponent_persona_id: str) -> str | None:
        """Extract the last message from opponent in the debate history."""
        for msg in reversed(messages):
            if msg.get("persona_id") == opponent_persona_id:
                return msg.get("message")
        return None
