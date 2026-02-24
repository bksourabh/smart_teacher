# Soul AI

An AI assistant modeled on Hindu spiritual philosophy where consciousness operates through three faculties: **Mind (Manas)**, **Intellect (Buddhi)**, and **Habits (Sanskaras)**.

Every input is processed by all three modules in parallel, then a synthesizer combines their outputs into a unified response — just as the Atman (true self) integrates all aspects of inner experience.

Soul AI features a **Learning Mode** where the soul starts with pure, child-like qualities and grows through trainer guidance — like a child learning from a teacher. Learnings persist in the database and shape future responses.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Learning Mode](#learning-mode)
- [User Guide](#user-guide)
  - [Chat Mode](#chat-mode)
  - [Trainer Mode](#trainer-mode)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Documentation](#documentation)

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- An Anthropic API key

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure
cp ../.env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run (delete soul.db for fresh start with child-like essence habits)
rm -f soul.db
uvicorn app.main:app --reload
```

The backend starts at `http://localhost:8000`. Seven child-like essence habits are seeded automatically on first startup.

### Frontend Setup — CLI

```bash
cd frontend
npm install
npm start           # Start chat mode
npm start -- train  # Start trainer mode
```

### Frontend Setup — Web UI

A Vite + Lit web interface that streams faculty outputs progressively as each module completes.

```bash
cd frontend/web
npm install
npm run dev         # Start dev server at http://localhost:5173
```

Or build for production (served by the FastAPI backend at `/`):

```bash
cd frontend/web
npm run build       # Outputs to frontend/web/dist/
```

### Verify

```bash
# Health check
curl http://localhost:8000/api/v1/health

# List habits — should show 7 essence habits
curl http://localhost:8000/api/v1/habits

# Check config
curl http://localhost:8000/api/v1/config
```

---

## Architecture Overview

```
                            ┌──────────────┐
                            │  Node.js CLI │
                            │  (Chat/Train)│
                            └──────┬───────┘
                                   │
                            ┌──────▼───────┐
                            │ FastAPI      │
                            │ Backend      │
                            └──────┬───────┘
                                   │
                            ┌──────▼───────┐
                            │ Soul Engine  │
                            └──────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼──────┐
              │  MANAS    │ │  BUDDHI   │ │ SANSKARAS  │
              │  (Mind)   │ │(Intellect)│ │  (Habits)  │
              └─────┬─────┘ └─────┬─────┘ └─────┬──────┘
                    │              │              │
                    │      (each checks Learnings DB)
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                         ┌─────────▼──────────┐
                         │ Confidence Check   │
                         │ (learning mode)    │
                         └─────────┬──────────┘
                                   │
                    ┌──────YES─────┤ confidence >= threshold?
                    │              │
              ┌─────▼─────┐       NO
              │Synthesizer│  ┌────▼──────────────┐
              │  (Atman)  │  │Create pending     │
              └─────┬─────┘  │learning + question│
                    │        └────┬──────────────┘
              ┌─────▼─────┐ ┌────▼──────────────┐
              │ mode:     │ │ mode:             │
              │autonomous │ │ needs_trainer     │
              └───────────┘ └───────────────────┘
```

### Three Faculties

| Faculty | Role | Output |
|---------|------|--------|
| **Manas (Mind)** | Emotional, intuitive responses | Response + confidence + valence |
| **Buddhi (Intellect)** | Rational, ethical analysis using dharmic principles | Response + confidence + reasoning chain |
| **Sanskaras (Habits)** | Experience-based patterns from habit database | Response + confidence + activated habits |
| **Synthesizer (Atman)** | Integrates all three into a unified response | Final synthesized response |

All three modules run in parallel via `asyncio.gather`. Each module also checks the **Learnings DB** for relevant trainer guidance before making its Claude API call.

Default weights: Buddhi 40%, Manas 35%, Sanskaras 25%.

---

## Learning Mode

Learning mode transforms Soul AI from an autonomous responder into a trainable soul that grows through guidance.

### How It Works

1. **Child-Like Start:** The soul begins with 7 pure essence habits — purity of thought, honesty, unconditional love, care, inner peace, bliss, and innocent curiosity. No adult conditioning.

2. **Confidence Gating:** After all three modules process a message, the engine computes a weighted aggregate confidence score. If learning mode is enabled and confidence falls below the threshold (default 0.4), the soul pauses instead of responding.

3. **Trainer Consultation:** The soul formulates a question for the trainer using a lightweight Claude call, creates a pending learning in the database, and returns a `needs_trainer` response.

4. **Trainer Responds:** A trainer (human or AI) reviews the pending question and provides guidance — what to say, which modules should learn from it, and how much confidence to boost.

5. **Learning Activated:** The guidance becomes an active learning stored in the database. Next time a similar topic comes up, all relevant modules find the learning, incorporate it into their prompts, and respond with higher confidence — autonomously.

### Learning Lifecycle

```
pending  ──(trainer responds)──▶  active  ──(no longer needed)──▶  superseded
```

---

## User Guide

### Chat Mode

Start the chat CLI:

```bash
cd frontend
npm start              # Default: chat mode
npm start -- chat      # Explicit chat mode
npm start -- chat -u http://custom-host:8000  # Custom backend URL
```

Type any message to chat with the soul. The response shows all three faculty perspectives plus the synthesized answer.

#### Chat CLI Commands

| Command | Description |
|---------|-------------|
| `/config` | Show current backend configuration |
| `/habits` | List all loaded habits with weights |
| `/weights` | Show module weight distribution |
| `/quit` | Exit the application |

#### Understanding Responses

When learning mode is **disabled** (default), every message gets a full response with all three faculties plus synthesis.

When learning mode is **enabled** and the soul is uncertain, you'll see a message like:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Soul needs trainer guidance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Question: How should I respond when asked about my name?
  Context: "what is your name?"
  Learning ID: 1

  Use the trainer mode to provide guidance: npm start -- train
```

This means the soul needs a trainer to teach it before it can answer confidently.

---

### Trainer Mode

Start the trainer CLI:

```bash
cd frontend
npm start -- train
npm start -- train -u http://custom-host:8000  # Custom backend URL
```

#### Trainer CLI Commands

| Command | Description |
|---------|-------------|
| `/pending` | View all questions awaiting trainer guidance |
| `/respond <id>` | Respond to a specific pending learning by ID |
| `/learnings` | View all active learnings |
| `/teach` | Proactively teach the soul something new |
| `/enable` | Enable learning mode |
| `/disable` | Disable learning mode |
| `/threshold <0.0-1.0>` | Set the confidence threshold |
| `/quit` | Exit trainer mode |

#### Workflow: Responding to a Pending Question

1. Enable learning mode:
   ```
   Trainer: /enable
   ```

2. (In chat mode, a user sends a message the soul is uncertain about)

3. Check pending questions:
   ```
   Trainer: /pending
   ```
   Shows:
   ```
   1 question(s) awaiting guidance:

   #1 [pending] How should I respond when asked about my name?
     Keywords: what,is,your,name | Modules: all | Boost: 0.5 | Applied: 0x
   ```

4. Provide guidance:
   ```
   Trainer: /respond 1
     Guidance: Your name is Atman, the true self. Introduce yourself warmly.
     Application note (concise directive): Tell them your name is Atman warmly
     Modules (all/manas,buddhi,sanskaras): all
     Confidence boost (0-1, default 0.5): 0.8
   ```

5. Next time someone asks the same question, the soul responds autonomously using the learned guidance.

#### Workflow: Proactive Teaching

Teach the soul without waiting for a question:

```
Trainer: /teach
  What are you teaching? (trigger summary): How to greet people
  Keywords (comma-separated): hello,hi,hey,greet,namaste
  Guidance: Greet with warmth and love, say Namaste which honors the divine in the other person
  Application note (concise directive): Greet warmly with Namaste
  Modules (all/manas,buddhi,sanskaras): all
  Confidence boost (0-1, default 0.5): 0.7
```

---

### End-to-End Example

Here's a complete walkthrough from fresh start to trained soul:

```bash
# 1. Start fresh
cd backend
rm -f soul.db
uvicorn app.main:app --reload

# 2. Verify essence habits
curl http://localhost:8000/api/v1/habits
# Shows 7 essence habits: purity_of_thought, honesty, unconditional_love, etc.

# 3. Enable learning mode
curl -X PUT http://localhost:8000/api/v1/config \
  -H 'Content-Type: application/json' \
  -d '{"learning_mode_enabled": true}'

# 4. Chat — soul will be uncertain
curl -X POST http://localhost:8000/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "what is your name?"}'
# Response has mode: "needs_trainer"

# 5. Check what the soul wants to know
curl http://localhost:8000/api/v1/trainer/pending
# Shows the pending question with its ID

# 6. Train the soul
curl -X POST http://localhost:8000/api/v1/trainer/respond/1 \
  -H 'Content-Type: application/json' \
  -d '{
    "guidance": "Your name is Atman, the true self",
    "application_note": "Tell them your name is Atman warmly",
    "modules_informed": "all",
    "confidence_boost": 0.8
  }'

# 7. Chat again — soul now responds autonomously
curl -X POST http://localhost:8000/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "what is your name?"}'
# Response has mode: "autonomous" with learned guidance applied
```

---

## API Endpoints

### Core

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/chat` | Main chat interaction |
| `GET` | `/api/v1/habits` | List habits (filterable by category, min_weight) |
| `POST` | `/api/v1/habits` | Create a habit |
| `POST` | `/api/v1/habits/seed` | Re-seed habits |
| `PUT` | `/api/v1/habits/{id}/reinforce` | Reinforce a habit |
| `GET` | `/api/v1/config` | Read configuration |
| `PUT` | `/api/v1/config` | Update configuration |

### Trainer

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/trainer/pending` | List questions awaiting trainer |
| `GET` | `/api/v1/trainer/learnings` | List all active learnings |
| `POST` | `/api/v1/trainer/respond/{id}` | Provide guidance for a pending learning |
| `POST` | `/api/v1/trainer/learnings` | Proactively teach the soul |
| `PUT` | `/api/v1/trainer/learnings/{id}` | Update an existing learning |
| `DELETE` | `/api/v1/trainer/learnings/{id}` | Supersede (soft-delete) a learning |

---

## Configuration

### Environment Variables

Set in `backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | (required) |
| `CLAUDE_MODEL` | Claude model ID | `claude-sonnet-4-5-20250929` |
| `DATABASE_URL` | SQLite database URL | `sqlite+aiosqlite:///./soul.db` |

### Runtime Configuration

Adjustable via `PUT /api/v1/config` or trainer CLI:

| Field | Description | Default |
|-------|-------------|---------|
| `weight_manas` | Mind module weight | 0.35 |
| `weight_buddhi` | Intellect module weight | 0.40 |
| `weight_sanskaras` | Habits module weight | 0.25 |
| `claude_model` | Claude model to use | `claude-sonnet-4-5-20250929` |
| `temperature` | Claude temperature | 0.7 |
| `max_tokens` | Max tokens per call | 1024 |
| `learning_mode_enabled` | Enable trainer learning mode | `false` |
| `confidence_threshold` | Below this, soul asks trainer for help | 0.4 |

---

## Project Structure

```
soul/
├── backend/
│   └── app/
│       ├── main.py                  # FastAPI app, lifespan, DB init
│       ├── config.py                # Settings (env, weights, learning mode)
│       ├── models/
│       │   ├── database.py          # SQLAlchemy async engine + Base
│       │   ├── habit_model.py       # Habit table (sanskaras data)
│       │   ├── learning_model.py    # Learning table (trainer guidance)
│       │   └── schemas.py           # Pydantic request/response models
│       ├── services/
│       │   ├── claude_client.py     # Anthropic API wrapper
│       │   ├── habit_service.py     # Habit CRUD + keyword matching
│       │   └── learning_service.py  # Learning CRUD + keyword matching
│       ├── engine/
│       │   ├── base_module.py       # ABC with Claude helpers + learnings context
│       │   ├── manas.py             # Mind module (emotional)
│       │   ├── buddhi.py            # Intellect module (rational)
│       │   ├── sanskaras.py         # Habits module (experience)
│       │   ├── synthesizer.py       # Atman — integrates all faculties
│       │   ├── soul_engine.py       # Orchestrator with confidence gating
│       │   └── prompts/
│       │       ├── manas.txt        # Mind system prompt
│       │       ├── buddhi.txt       # Intellect system prompt
│       │       ├── sanskaras.txt    # Habits system prompt
│       │       └── synthesizer.txt  # Synthesizer system prompt
│       ├── api/v1/
│       │   ├── router.py           # Route registration
│       │   └── endpoints/
│       │       ├── health.py       # Health check
│       │       ├── chat.py         # Chat endpoint
│       │       ├── habits.py       # Habit management
│       │       ├── config.py       # Configuration management
│       │       └── trainer.py      # Trainer/learning endpoints
│       └── seed/
│           └── seed_data.py        # 7 child-like essence habits
├── frontend/
│   └── src/
│       ├── index.ts                # CLI entry — chat, train, config commands
│       ├── cli.ts                  # Chat REPL
│       ├── trainer-cli.ts          # Trainer REPL
│       ├── api-client.ts           # HTTP client for all endpoints
│       ├── display.ts              # Formatted output (response, trainer, learnings)
│       ├── config.ts               # Local config (~/.soulai.json)
│       └── types.ts                # TypeScript interfaces
├── docs/
│   ├── philosophy.md               # Hindu concepts mapped to implementation
│   ├── architecture.md             # Technical architecture deep-dive
│   └── api.md                      # Full API reference with examples
└── .env.example                    # Environment template
```

---

## Documentation

- [Philosophy](docs/philosophy.md) — Hindu concepts mapped to implementation
- [Architecture](docs/architecture.md) — Technical architecture deep-dive
- [API Reference](docs/api.md) — Full API documentation with examples
