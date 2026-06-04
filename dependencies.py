from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.session import get_session
from backend.services.persona_service import PersonaService


SessionDep = Annotated[AsyncSession, Depends(get_session)]


def create_persona_service(session: SessionDep):
    return PersonaService(session)


PersonaServiceDep = Annotated[PersonaService, Depends(create_persona_service)]
