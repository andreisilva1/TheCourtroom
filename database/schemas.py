from pydantic import BaseModel


class PersonaCreate(BaseModel):
    name: str
