from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import Persona


class PersonaService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(self, persona_name: str) -> Persona:
        persona = Persona(name=persona_name)
        self.session.add(persona)
        await self.session.commit()
        await self.session.refresh(persona)
        return persona
