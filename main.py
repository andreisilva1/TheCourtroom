from contextlib import asynccontextmanager

from bs4 import BeautifulSoup
import ollama
from fastapi import FastAPI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
import requests

from backend.database.session import init_db
from backend.dependencies import PersonaServiceDep
from backend.pipeline import (
    show_possible_options_of_personas_based_on_a_commom_name_or_description,
    wikipedia_resolver,
)

qdrant = QdrantClient(host="localhost", port=6333)


@asynccontextmanager
async def lifespan_handler(app: FastAPI):
    await init_db()
    if not qdrant.collection_exists("personas"):
        qdrant.create_collection(
            collection_name="personas",
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )
    yield


app = FastAPI(lifespan=lifespan_handler)


@app.post("/create_persona")
async def create_persona_and_embedding(
    persona_name: str,
    service: PersonaServiceDep,
    default_number_of_references: int = 100,
):
    possible_options = (
        show_possible_options_of_personas_based_on_a_commom_name_or_description(
            persona_name
        )
    )
    if possible_options and all(
        [option["name"] != persona_name for option in possible_options]
    ):
        return possible_options

    information_found = wikipedia_resolver(persona_name)

    wiki_chunks = []
    embed_chunks = []
    if len(information_found) > 3000:
        x = 0
        while x < len(information_found):
            wiki_chunks.append(information_found[x : x + 3000])
            x += 3000

    for chunk in wiki_chunks:
        embed_chunks.append(
            ollama.embeddings(model="nomic-embed-text", prompt=str(chunk))
        )
        wiki_chunks.pop(0)

    new_persona = await service.add(persona_name)
    print(len(information_found["references"]))
    i = 0
    number_of_references_requested_by_user = 50
    if len(information_found["references"]) >= 1:
        for reference in information_found["references"]:
            if i == (
                number_of_references_requested_by_user
                if number_of_references_requested_by_user
                else default_number_of_references
            ):
                break
            i += 1
            print(i)
            reference_chunks = []
            embed_chunks = []
            try:
                reference_scrapped = requests.get(reference).text
            except Exception:
                continue
            reference_scrapped = BeautifulSoup(reference_scrapped, "html.parser")
            if reference_scrapped:
                if len(reference_scrapped) > 3000:
                    x = 0
                    while x < len(reference_scrapped):
                        reference_chunks.append(reference_scrapped[x : x + 3000])
                        x += 3000

                for chunk in reference_chunks:
                    reference_embed = ollama.embeddings(
                        model="nomic-embed-text", prompt=str(chunk)
                    )
                    reference_chunks.pop(0)
                    add_to_qdrant(new_persona.id, reference_embed)

    for chunk in embed_chunks:
        add_to_qdrant(new_persona.id, str(chunk))

    return new_persona


def add_to_qdrant(persona_id, embed):
    qdrant.upsert(
        collection_name="personas",
        points=[
            PointStruct(
                id=str(persona_id),
                vector=embed.embedding,
                payload={"persona_id": str(persona_id)},
            )
        ],
    )
