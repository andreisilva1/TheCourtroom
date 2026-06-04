# ArgumentAI ⚖️

**An Agentic AI Debate Platform** where users challenge AI personas on fallacious arguments using semantic search, RAG, and LLM-powered reasoning.

## 🎯 Overview

ArgumentAI is a full-stack application that generates dynamic AI personas from Wikipedia, Wikidata and DBPedia data and engages users in structured debates. The system identifies fallacious arguments, evaluates user refutations, and delivers real-time feedback through an intuitive Ace Attorney-style interface.

**Core Mechanic**: User vs. AI persona debate where the AI proposes a fallacy, the user argues against it, and the LLM judge evaluates who wins.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 19)                      │
│  TypeScript + Vite + Tailwind | Real-time State Management  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/JSON
┌──────────────────────▼──────────────────────────────────────┐
│              Backend (FastAPI + SQLModel)                    │
│  ├─ /ace-attorney/start (RAG-powered persona generation)    │
│  ├─ /ace-attorney/argue (LLM debate turn processing)        │
│  ├─ /ace-attorney/objection (Fallacy evaluation agent)      │
│  └─ /create_persona (Async Wikipedia data pipeline)         │
└──────────────┬────────────────┬────────────────┬────────────┘
               │                │                │
        ┌──────▼────────┐  ┌────▼──────┐  ┌─────▼─────┐
        │   Qdrant      │  │   Redis   │  │  Celery   │
        │ (Vector DB)   │  │  (Cache)  │  │ (Workers) │
        └──────┬────────┘  └───────────┘  └─────┬─────┘
               │                                 │
        ┌──────▼──────────────────────────────────▼─────┐
        │         Ollama (LLM Inference Engine)         │
        │  ├─ phi-3 (Debate reasoning & evaluation)     │
        │  └─ nomic-embed-text (Semantic embeddings)    │
        └─────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.10+ (for local backend dev)

### Installation

```bash
# Clone repository
git clone https://github.com/andreisilva1/ArgumentAI.git
cd ArgumentAI

# Start all services
docker-compose up -d

# Wait for Ollama to initialize (check logs)
docker logs argumentai-ollama-1

# Frontend available at: http://localhost:5176
# Backend API at: http://localhost:8001
```

### Development (Local)

```bash
# Backend
cd backend
pip install -e .
uvicorn main:app --reload --port 8001

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## 🤖 AI/ML Components

### Retrieval-Augmented Generation (RAG)

**Persona Generation Pipeline:**
1. **Data Ingestion**: Wikipedia API + Wikidata + DBPedia scraping
2. **Chunking & Embedding**: Text segmentation with nomic-embed-text embeddings
3. **Vector Storage**: Qdrant collection per persona for semantic search
4. **Augmented Generation**: LLM prompts enriched with retrieved persona knowledge

```python
# Example RAG flow
retrieved_docs = qdrant.search(query_embedding, top_k=3)
augmented_prompt = f"Context: {retrieved_docs}\n\nGenerate persona response..."
response = llm.invoke(augmented_prompt)
```

### Agentic AI Workflows

**Ace Attorney Debate Loop:**
```
User vs Persona: User Input → Argument Processing → LLM Evaluation → Persona Response
                      ↓              ↓                     ↓                ↓
                 (user types)  (semantics match)  (fallacy detection)  (persona defends)
```

**Objection Evaluation Agent:**
- Receives: fallacy_theme, fallacy_hidden_flaw, user_arguments (accumulated)
- Returns: {won: bool, reason: str, example_refutation: str}
- Uses chain-of-thought prompting for logical reasoning
- Determines if user successfully refuted the persona's fallacious argument

### Embeddings & Semantic Search

- **Embedding Model**: nomic-embed-text (768-dim vectors)
- **Vector Database**: Qdrant with cosine similarity
- **Use Cases**:
  - Persona knowledge retrieval
  - Argument semantic matching
  - Fallacy pattern detection

---

## 📋 Features

### ✅ Implemented

- **Dynamic Persona Generation**
  - Auto-scrape Wikipedia/Wikidata/DBPedia
  - Personality quiz (14 questions) → trait scoring (0.0-1.0)
  - LLM-generated hot take fallacies per persona

- **Ace Attorney Debate Mode**
  - VS-style intro animation (~3 sec) before persona's opening statement
  - Real-time typing indicators during argument processing
  - Message counter (0-10 user arguments)
  - OBJECTION! button (manual at msg 3+, auto at msg 10)

- **Fallacy Evaluation**
  - LLM judge determines if user refuted the argument
  - Returns explanation + example alternative refutation
  - Persistent debate history with transcripts

- **UI/UX Polish**
  - Glow pulse effect on active speaker
  - Dark theme with accent red (#E8001A) and blue
  - Responsive design with Vite dev server + production build

### 🔄 Distributed Processing

- **Async Backend**: FastAPI with asyncio, 100+ concurrent requests
- **Task Queue**: Celery + Redis for long-running persona generation
- **Non-blocking I/O**: aiosqlite for database operations

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | FastAPI, SQLModel, async Python |
| **Database** | SQLite (SQLModel), Qdrant (vectors) |
| **Cache/Queue** | Redis, Celery |
| **LLM** | Ollama (phi-3 + nomic-embed-text) |
| **Containerization** | Docker, Docker Compose |
| **API** | REST, JSON |

---

## 📁 Project Structure

```
ArgumentAI/
├── backend/
│   ├── agents/                 # AI agent implementations
│   │   ├── persona_fallacy_generator.py   # LLM-powered fallacy generation for personas
│   │   ├── objection_evaluator.py          # LLM-powered fallacy refutation evaluation
│   │   ├── debate_agent.py                 # Personality quiz + debate response generation
│   │   └── fallacies_database.py           # Pre-written fallacy database (legacy)
│   ├── database/
│   │   ├── models.py          # SQLModel schemas (Persona, Debate)
│   │   └── session.py         # Async SQLAlchemy session factory
│   ├── services/
│   │   └── debate_service.py  # Debate CRUD + message management
│   ├── worker/
│   │   ├── tasks.py           # Celery tasks (persona generation)
│   │   └── celery.py          # Celery app config
│   ├── pipeline.py            # Wikipedia data fetching
│   ├── utils.py               # Embedding + vector storage
│   ├── main.py                # FastAPI app + all endpoints
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile             # Container image
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx             # Persona selection + history
│   │   │   ├── AceAttorneyArena.tsx     # Main debate interface
│   │   │   └── DebateDetails.tsx        # Debate transcript viewer
│   │   ├── components/
│   │   │   ├── PersonaCard.tsx          # Persona grid item
│   │   │   ├── PersonaAvatar.tsx        # Avatar image renderer
│   │   │   └── CreatePersonaModal.tsx   # Persona creation form
│   │   ├── api/
│   │   │   └── client.ts                # Axios instance + API calls
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript interfaces
│   │   ├── App.tsx                      # Router setup
│   │   └── main.tsx                     # Entry point
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml          # Service orchestration
└── README.md
```

---

## 🔌 API Endpoints

### Persona Management
```
POST   /create_persona?persona_name=X        # Async creation task
GET    /load_personas                        # List all personas
GET    /task/{task_id}                       # Celery task status
```

### Ace Attorney Debate
```
POST   /ace-attorney/start                   # Initialize debate (RAG + LLM)
POST   /ace-attorney/argue                   # User argument + persona response
POST   /ace-attorney/objection               # Evaluate user refutation
```

### History & Analytics
```
GET    /debates/history                      # All debate summaries
GET    /debates/{debate_id}/details          # Full transcript + evaluation
```

---

## 🎮 Usage Flow

### 1. Create Persona
```
User → "Create Persona" modal → Backend validates Wikipedia exists → 
Celery task extracts data → Embeddings stored in Qdrant → 
Persona appears in grid
```

### 2. Start Debate
```
User clicks "Challenge" → Frontend navigates with loading state → 
Backend calls /ace-attorney/start (generates fallacy) → 
Frontend displays VS-style intro animation (~3 sec) → 
Shows persona's opening fallacy → Debate begins
```

### 3. Argue & Evaluate
```
User types argument → Sent to /ace-attorney/argue → 
Persona response generated (with typing animation) → 
Message counter increments → At msg 3+, OBJECTION! button enabled
```

### 4. Objection & Verdict
```
User clicks OBJECTION! → Sends all arguments to /ace-attorney/objection → 
LLM evaluates refutation quality → 
Result screen shows WIN (green) or LOSS (red) with example refutation
```

---

## 🐛 Known Issues & TODOs

- [ ] Improve LLM fallacy generation for edge cases (currently falls back to generic)
- [ ] Add debate timeout (currently open-ended)
- [ ] Implement persona-specific debate responses (currently generic response)
- [ ] Implement leaderboard/statistics dashboard
- [ ] Support multi-language personas
- [ ] Add debate export (PDF/JSON)
- [ ] Optimize Qdrant queries for large document sets

---

## 🤝 Contributing

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, commit with clear messages
git commit -m "feat: add debunking score tracking"

# Submit PR with description
git push origin feature/your-feature
```

**Code Standards:**
- Backend: Black formatting, type hints required
- Frontend: ESLint + Prettier, TypeScript strict mode
- Tests: pytest for backend, Vitest for frontend (TBD)

---

## 📊 Performance Metrics

- **Persona Generation**: ~45-60 sec (Wikipedia scrape + embedding + Qdrant indexing)
- **Debate Initialization**: ~2-5 sec (RAG retrieval + LLM fallacy generation)
- **Argument Processing**: ~500ms-2s (LLM inference + response generation)
- **Objection Evaluation**: ~3-8 sec (LLM reasoning + judgment)
- **Concurrent Users**: 100+ (async FastAPI + Celery workers)

---

## 📝 License

MIT License - See LICENSE file

---

## 👨‍💻 Author

Built as a full-stack AI engineering project demonstrating RAG, agentic AI, LLM orchestration, async distributed systems, and modern web development.

**Key Technologies Demonstrated:**
- LLM prompt engineering & evaluation
- Vector databases & semantic search
- Async Python & distributed task processing
- Real-time web interfaces
- Containerized microservices
- Multi-agent reasoning loops

---

## 🔗 Links

- **API Docs**: http://localhost:8001/docs (Swagger)
- **Vector DB**: http://localhost:6333 (Qdrant dashboard)
- **Frontend**: http://localhost:5176

---

**Questions?** Open an issue or check the code comments for implementation details.
