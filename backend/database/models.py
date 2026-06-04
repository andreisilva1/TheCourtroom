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
    max_references: int = Field(default=20)
