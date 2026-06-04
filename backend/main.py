import base64
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from backend.database.session import init_db
from backend.dependencies import PersonaServiceDep, DebateServiceDep
from backend.pipeline import (
    show_possible_options_of_personas_based_on_a_commom_name_or_description,
)
from backend.worker.tasks import build_persona
from backend.agents.debate_agent import run_personality_quiz, generate_persona_response_to_user
from backend.agents.objection_evaluator import evaluate_objection
from backend.agents.persona_fallacy_generator import generate_fallacy_for_persona

qdrant = QdrantClient(host="qdrant", port=6333)


@asynccontextmanager
async def lifespan_handler(app: FastAPI):
    await init_db()
    if not qdrant.collection_exists("personas"):
        qdrant.create_collection(
            collection_name="personas",
            vectors_config=VectorParams(size=768, distance=Distance.COSINE),
        )
    yield


app = FastAPI(lifespan=lifespan_handler)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5176",
        "http://localhost:3000",
        "http://127.0.0.1:5176",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/create_persona")
async def create_persona_and_embedding(
    persona_name: str,
    service: PersonaServiceDep,
    max_references: int = 20,
):
    possible_options = (
        show_possible_options_of_personas_based_on_a_commom_name_or_description(
            persona_name
        )
    )

    if possible_options and all(
        option["name"].lower() != persona_name.lower() for option in possible_options
    ):
        return {
            "needs_selection": True,
            "options": possible_options,
        }

    new_persona = await service.add(
        persona_name,
        max_references=max_references,
    )

    task = build_persona.delay(
        persona_id=str(new_persona.id),
        persona_name=new_persona.name,
        max_references=max_references,
    )

    return {
        "needs_selection": False,
        "task_id": task.id,
        "persona_id": str(new_persona.id),
        "persona_name": new_persona.name,
        "status": "building",
    }


@app.get("/health")
async def health_check():
    """Check if all required services are ready"""
    # Simple health check - if this endpoint responds, we're ready
    # Ollama models are loaded asynchronously in the entrypoint
    return {
        "status": "ready",
        "message": "All systems ready",
        "ready": True,
    }


@app.get("/load_personas")
async def load_personas(service: PersonaServiceDep):
    personas = await service.get_all()

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "image": base64.b64encode(p.image).decode() if p.image else None,
            "loaded": p.loaded,
        }
        for p in personas
    ]


@app.get("/task/{task_id}")
def get_task_status(task_id: str):
    task = build_persona.AsyncResult(task_id)

    if task.state == "PENDING":
        return {"state": "PENDING", "current": 0, "total": 0}

    if task.state == "PROGRESS":
        return {
            "state": "PROGRESS",
            "current": task.info.get("current", 0),
            "total": task.info.get("total", 0),
            "persona_id": task.info.get("persona_id"),
        }

    if task.state == "SUCCESS":
        return {"state": "SUCCESS", **task.result}

    return {"state": task.state}


# ===== ACE ATTORNEY MODE (User vs Persona) =====


class AceAttorneyStartRequest(BaseModel):
    persona_id: str


class AceAttorneyArgueRequest(BaseModel):
    debate_id: str
    user_argument: str


class AceAttorneyObjectionRequest(BaseModel):
    debate_id: str
    user_arguments: list[str]


@app.post("/ace-attorney/start")
async def ace_attorney_start(
    request: AceAttorneyStartRequest,
    persona_service: PersonaServiceDep,
    debate_service: DebateServiceDep,
):
    """
    Start an Ace Attorney style debate.
    Persona chooses a fallacious theme based on their personality.
    User must prove it wrong.
    """
    try:
        # Fetch persona
        persona = await persona_service.get_by_id(request.persona_id)
        if not persona:
            return {"error": "Persona not found"}

        # Get or run personality quiz
        traits = await debate_service.get_traits(request.persona_id)
        if not traits:
            print(f"Running personality quiz for {persona.name}")
            traits = run_personality_quiz(persona.name)
            await debate_service.save_traits(request.persona_id, traits)

        # Generate personalized fallacy based on persona traits
        print(f"Generating personalized fallacy for {persona.name}")
        try:
            fallacy = generate_fallacy_for_persona(persona.name, traits)
            print(f"Generated fallacy type: {fallacy['type']}")
        except Exception as e:
            # If LLM is not ready, return error
            if "Name or service not known" in str(e) or "Connection" in str(e):
                return {
                    "error": "LLM is still initializing. Please wait a moment and try again.",
                    "status": "initializing"
                }
            raise

        # Create debate with fallacious theme as opening
        debate = await debate_service.add(
            debate_id=None,
            attacker_id=request.persona_id,
            defender_id="user",
            topic=fallacy["theme"],
            attacker_message={
                "role": "opening",
                "message": fallacy["theme"],
            },
        )

        # Save fallacy info to debate
        debate.fallacy_theme = fallacy["theme"]
        debate.fallacy_type = fallacy["type"]
        debate.fallacy_hidden_flaw = fallacy.get("hidden_flaw", "")
        await debate_service.session.commit()

        return {
            "debate_id": str(debate.id),
            "persona_name": persona.name,
            "persona_id": request.persona_id,
            "theme": fallacy["theme"],
            "fallacy_type": fallacy["type"],
            "opening": f"I believe: {fallacy['theme']}",
        }

    except Exception as e:
        print(f"Ace Attorney start error: {e}")
        import traceback

        traceback.print_exc()
        return {"error": f"Failed to start Ace Attorney debate: {str(e)}"}


@app.post("/ace-attorney/argue")
async def ace_attorney_argue(
    request: AceAttorneyArgueRequest,
    persona_service: PersonaServiceDep,
    debate_service: DebateServiceDep,
):
    """
    User argues against persona's fallacy.
    Counts user messages and returns if OBJECTION button can be used.
    Auto-triggers OBJECTION at 10 user messages.
    """
    try:
        import json

        # Fetch debate
        debate = await debate_service.get_by_id(request.debate_id)
        if not debate:
            return {"error": "Debate not found"}

        # Fetch persona
        persona = await persona_service.get_by_id(str(debate.attacker_id))
        if not persona:
            return {"error": "Persona not found"}

        # Get debate history and count user messages
        debate_history = await debate_service.get_messages(request.debate_id)
        user_message_count = sum(
            1 for msg in debate_history if msg.get("is_user_message", False)
        )
        user_message_count += 1  # Include current message

        # Parse and update messages
        messages = json.loads(debate.messages) if debate.messages else []
        messages.append(
            {
                "persona_id": "user",
                "is_user_message": True,
                "role": "argument",
                "message": request.user_argument,
            }
        )

        # Get persona traits for personalized response
        traits = await debate_service.get_traits(str(debate.attacker_id))
        if not traits:
            # If no traits cached, run quiz
            traits = run_personality_quiz(persona.name)
            await debate_service.save_traits(str(debate.attacker_id), traits)

        # Generate persona's response using RAG + personality
        persona_response = generate_persona_response_to_user(
            persona_name=persona.name,
            persona_id=str(debate.attacker_id),
            personality_scores=traits,
            fallacy_theme=debate.fallacy_theme or debate.topic,
            user_argument=request.user_argument,
        )

        # Save messages
        messages.append(
            {
                "persona_id": str(debate.attacker_id),
                "is_user_message": False,
                "role": "response",
                "message": persona_response,
            }
        )

        debate.messages = json.dumps(messages)
        debate.user_message_count = user_message_count
        await debate_service.session.commit()

        print(
            f"User message {user_message_count}: can_object={user_message_count >= 3}"
        )

        # Check if should auto-trigger OBJECTION at 10 messages
        if user_message_count >= 10:
            print(f"Auto-triggering OBJECTION at message {user_message_count}")
            return {
                "debate_id": request.debate_id,
                "message_count": user_message_count,
                "can_object": True,
                "auto_objection_triggered": True,
                "persona_response": persona_response,
                "persona_name": persona.name,
            }

        return {
            "debate_id": request.debate_id,
            "message_count": user_message_count,
            "can_object": user_message_count >= 3,
            "auto_objection_triggered": False,
            "persona_response": persona_response,
            "persona_name": persona.name,
        }

    except Exception as e:
        print(f"Ace Attorney argue error: {e}")
        import traceback

        traceback.print_exc()
        return {"error": f"Failed to process argument: {str(e)}"}


@app.post("/ace-attorney/objection")
async def ace_attorney_objection(
    request: AceAttorneyObjectionRequest,
    debate_service: DebateServiceDep,
):
    """
    Evaluate user's OBJECTION against the fallacy.
    Determines if user has sufficiently refuted the argument.
    """
    try:
        # Fetch debate
        debate = await debate_service.get_by_id(request.debate_id)
        if not debate:
            return {"error": "Debate not found"}

        # Get debate history to count user messages
        debate_history = await debate_service.get_messages(request.debate_id)
        user_message_count = sum(
            1 for msg in debate_history if msg.get("is_user_message", False)
        )

        # Evaluate OBJECTION
        print(f"Evaluating objection with {len(request.user_arguments)} arguments")
        objection_result = evaluate_objection(
            fallacy_theme=debate.fallacy_theme or debate.topic,
            fallacy_hidden_flaw=debate.fallacy_hidden_flaw or "Unknown flaw",
            user_arguments=request.user_arguments,
        )

        # Update debate status
        if objection_result["won"]:
            debate.status = "won_manual"
            debate.objection_message_number = user_message_count
            print(f"User WON via manual objection at message {user_message_count}")
        else:
            debate.status = "lost"
            debate.objection_message_number = user_message_count
            debate.fallacy_example_refutation = objection_result["example_refutation"]
            print(f"User LOST objection at message {user_message_count}")

        await debate_service.session.commit()

        return {
            "debate_id": request.debate_id,
            "won": objection_result["won"],
            "reason": objection_result["reason"],
            "example_refutation": objection_result["example_refutation"],
            "fallacy_theme": debate.fallacy_theme or debate.topic,
            "fallacy_type": debate.fallacy_type,
        }

    except Exception as e:
        print(f"Ace Attorney objection error: {e}")
        import traceback

        traceback.print_exc()
        return {"error": f"Failed to evaluate objection: {str(e)}"}


@app.get("/debates/history")
async def get_debates_history(
    debate_service: DebateServiceDep,
):
    """
    Get history of all debates for this session.
    Returns summary of each debate with status and results.
    """
    try:
        # This would need a query to get all debates
        # For now, returning empty list
        # TODO: Implement full debate history retrieval
        return {"debates": []}

    except Exception as e:
        print(f"Get debates history error: {e}")
        return {"error": f"Failed to retrieve debate history: {str(e)}"}


@app.get("/debates/{debate_id}/details")
async def get_debate_details(
    debate_id: str,
    debate_service: DebateServiceDep,
):
    """
    Get full details of a specific debate including messages and results.
    """
    try:
        debate = await debate_service.get_by_id(debate_id)
        if not debate:
            return {"error": "Debate not found"}

        import json

        messages = json.loads(debate.messages) if debate.messages else []

        return {
            "debate_id": str(debate.id),
            "status": debate.status,
            "topic": debate.topic,
            "fallacy_theme": debate.fallacy_theme,
            "fallacy_type": debate.fallacy_type,
            "fallacy_hidden_flaw": debate.fallacy_hidden_flaw,
            "example_refutation": debate.fallacy_example_refutation,
            "messages": messages,
            "objection_message_number": debate.objection_message_number,
            "user_message_count": debate.user_message_count,
        }

    except Exception as e:
        print(f"Get debate details error: {e}")
        import traceback

        traceback.print_exc()
        return {"error": f"Failed to retrieve debate details: {str(e)}"}
