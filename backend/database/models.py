from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Persona(SQLModel, table=True):
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    name: str
    image: Optional[bytes] = Field(default=None, nullable=True)
    loaded: bool = Field(default=False)
    failed: bool = Field(default=False)
    error_message: Optional[str] = Field(default=None, nullable=True)
    traits: Optional[str] = Field(default=None, nullable=True)
    voice: Optional[str] = Field(default=None, nullable=True)


class Debate(SQLModel, table=True):
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    persona_id: str
    challenger_id: Optional[str] = Field(default=None, nullable=True)
    topic: str
    messages: Optional[str] = Field(default=None, nullable=True)
    fallacy_theme: Optional[str] = Field(default=None, nullable=True)
    fallacy_type: Optional[str] = Field(default=None, nullable=True)
    fallacy_hidden_flaw: Optional[str] = Field(default=None, nullable=True)
    fallacy_example_refutation: Optional[str] = Field(default=None, nullable=True)
    user_message_count: int = Field(default=0)
    objection_message_number: Optional[int] = Field(default=None, nullable=True)
    status: Optional[str] = Field(default="active", nullable=True)
