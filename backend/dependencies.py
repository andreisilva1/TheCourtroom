from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.session import get_session
from backend.services.persona_service import PersonaService
from backend.services.debate_service import DebateService


SessionDep = Annotated[AsyncSession, Depends(get_session)]


def create_persona_service(session: SessionDep):
    return PersonaService(session)


def create_debate_service(session: SessionDep):
    return DebateService(session)


PersonaServiceDep = Annotated[PersonaService, Depends(create_persona_service)]
DebateServiceDep = Annotated[DebateService, Depends(create_debate_service)]
