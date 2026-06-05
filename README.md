# The Courtroom ⚖️

**Argue your case against the machine.** A courtroom-style debate game where an
AI persona takes a controversial (and quietly fallacious) stance, and *you* — the
prosecutor — must dismantle it before time runs out. Built on RAG, an LLM jury,
and dynamically generated personas scraped from Wikipedia.

> Inspired by the drama of Ace Attorney: the persona is the **defendant**, you are
> the **prosecutor**, and an LLM is the **judge** who decides whether your
> objection holds.

---

## 🎯 The core loop

1. **Summon a defendant** — type a name, and a persona is built from Wikipedia
   (text + references → embeddings in Qdrant).
2. **Open the trial** — the persona answers a personality quiz, then states a
   hot take rooted in a hidden logical fallacy.
3. **Argue** — you present arguments; the persona defends its position using
   **RAG (its own knowledge)** + **its personality traits**.
4. **OBJECTION!** — once you've made enough arguments, slam the objection button.
   An LLM jury rules **CASE WON** or **NOT PROVEN**, and reveals the fallacy plus
   a model refutation.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React 19 + Vite)                  │
│   Courtroom UI · TypeScript · Tailwind · health-gated grid  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON (:8001)
┌──────────────────────────▼──────────────────────────────────┐
│                  Backend (FastAPI + SQLModel)                │
│  /create_persona        → async Wikipedia → Qdrant pipeline  │
│  /ace-attorney/start    → personality quiz + fallacy gen     │
│  /ace-attorney/argue    → RAG + traits → persona rebuttal    │
│  /ace-attorney/objection→ LLM jury verdict                   │
└──────────────┬────────────────┬────────────────┬────────────┘
               │                │                │
        ┌──────▼──────┐  ┌──────▼─────┐  ┌───────▼──────┐
        │   Qdrant    │  │   Redis    │  │    Celery    │
        │ (vectors)   │  │  (broker)  │  │  (workers)   │
        └──────┬──────┘  └────────────┘  └───────┬──────┘
               │                                  │
        ┌──────▼──────────────────────────────────▼─────┐
        │            Ollama (local LLM engine)          │
        │  ├─ phi              (debate + jury reasoning) │
        │  └─ nomic-embed-text (768-dim embeddings)     │
        └───────────────────────────────────────────────┘
```

---

## 🚀 Quick start

Everything runs in Docker — including Ollama and the model downloads. No local
Ollama required.

```bash
docker compose up -d

# Frontend → http://localhost:5176
# API      → http://localhost:8001  (Swagger at /docs)
# Qdrant   → http://localhost:6333
```

On first boot, the `the-courtroom-ollama-1` container pulls `phi` and
`nomic-embed-text` **in the background**. The frontend polls `/health` and keeps
defendants locked (dimmed) until inference is ready — watch progress with:

```bash
docker compose logs -f ollama
```

---

## 🤖 Where the RAG actually lives

**Ingestion (building a persona)** — `backend/worker/tasks.py` + `backend/utils.py`
1. `wikipedia_resolver` fetches the page text + external references
2. `chunk_text` segments it; `nomic-embed-text` embeds each chunk
3. chunks land in Qdrant, filtered per `persona_id`

**Generation (persona's rebuttal)** — `backend/agents/debate_agent.py` + `utils.py`
1. `get_persona_embeddings` queries Qdrant using the persona's dominant **traits**
   + the fallacy theme
2. `build_persona_response_prompt` fuses retrieved context + traits + your argument
3. `phi` generates an in-character defense

The personality system (a 14-question quiz → trait scores `0.0–1.0`) is what
makes each persona argue differently — that difference is now aimed **at you**.

---

## 🔌 API endpoints

```
POST  /create_persona?persona_name=X     # kick off async build (Celery)
GET   /load_personas                     # list personas (+ loaded flag)
GET   /task/{task_id}                     # build task status
GET   /health                            # readiness probe

POST  /ace-attorney/start                # quiz + fallacy + new debate
POST  /ace-attorney/argue                # your argument → persona rebuttal
POST  /ace-attorney/objection            # jury verdict on your objection

GET   /debates/{debate_id}/details       # full transcript + result
```

---

## 📁 Project structure

```
the-courtroom/
├── backend/
│   ├── agents/
│   │   ├── persona_fallacy_generator.py   # persona's hot take (fallacy)
│   │   ├── debate_agent.py                # personality quiz + RAG rebuttal
│   │   └── objection_evaluator.py         # LLM jury verdict
│   ├── database/
│   │   ├── models.py                      # Persona, Debate (SQLModel)
│   │   └── session.py                     # async session factory
│   ├── services/
│   │   ├── persona_service.py             # persona CRUD
│   │   └── debate_service.py              # debate + traits persistence
│   ├── worker/
│   │   ├── tasks.py                       # Celery persona build pipeline
│   │   └── celery.py                      # Celery app
│   ├── pipeline.py                        # Wikipedia scraping
│   ├── utils.py                           # embeddings, Qdrant, RAG helpers
│   └── main.py                            # FastAPI app + endpoints
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── HomePage.tsx               # courtroom grid + summon modal
│       │   └── AceAttorneyArena.tsx       # VS intro → trial → verdict
│       ├── components/
│       │   ├── PersonaCard.tsx            # "case file" card
│       │   └── PersonaAvatar.tsx          # portrait / initials
│       ├── api/client.ts                  # typed API client
│       └── types/index.ts                 # shared interfaces
│
├── docker-compose.yml                     # project name: the-courtroom
├── design-mock.html                       # standalone design preview
├── LICENSE                                # CC BY-NC 4.0
└── README.md
```

---

## 🛠️ Tech stack

| Layer            | Tech                                          |
|------------------|-----------------------------------------------|
| Frontend         | React 19, TypeScript, Vite, Tailwind CSS      |
| Backend          | FastAPI, SQLModel, async Python               |
| Vector DB        | Qdrant (cosine, 768-dim)                       |
| Cache / Queue    | Redis + Celery                                 |
| LLM              | Ollama — `phi` + `nomic-embed-text`           |
| Containerization | Docker Compose                                 |

---

## 📝 License

**Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0).**

You may look at, study, share, and build upon this project — but **not for
commercial purposes** without explicit written permission. See [LICENSE](LICENSE)
for the full terms. Third-party dependencies retain their own licenses.

---

⚖️ *The defendant has stated their case. The floor is yours, counselor.*
