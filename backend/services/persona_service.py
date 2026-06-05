from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException

from backend.database.models import Persona


class PersonaService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self) -> list[Persona]:
        result = await self.session.execute(select(Persona))
        return result.scalars().all()

    async def get_by_id(self, persona_id: str) -> Optional[Persona]:
        result = await self.session.execute(
            select(Persona).where(Persona.id == UUID(persona_id))
        )
        return result.scalar_one_or_none()

    async def add(
        self,
        persona_name: str,
        max_references: int = 100,
        image: Optional[bytes] = None,
    ) -> Persona:
        existing = await self.session.execute(
            select(Persona).where(Persona.name == persona_name)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="This persona already exists.")

        persona = Persona(name=persona_name, image=image, max_references=max_references)
        self.session.add(persona)
        await self.session.commit()
        await self.session.refresh(persona)
        return persona
