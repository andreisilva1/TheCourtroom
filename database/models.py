from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Persona(SQLModel, table=True):
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    name: str
