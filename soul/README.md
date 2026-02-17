# Soul AI

An AI assistant modeled on Hindu spiritual philosophy where consciousness operates through three faculties: **Mind (Manas)**, **Intellect (Buddhi)**, and **Habits (Sanskaras)**.

Every input is processed by all three modules in parallel, then a synthesizer combines their outputs into a unified response — just as the Atman (true self) integrates all aspects of inner experience.

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

# Run
uvicorn app.main:app --reload
```

The backend starts at `http://localhost:8000`. Seed habits are loaded automatically on first startup.

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Verify

```bash
# Health check
curl http://localhost:8000/api/v1/health

# List habits
curl http://localhost:8000/api/v1/habits
```

## Architecture

```
[Node.js CLI]  →  [FastAPI Backend]  →  [Soul Engine]
                                            |
                                 +----------+-----------+
                                 |          |           |
                              [MANAS]   [BUDDHI]  [SANSKARAS]
                              (Mind)   (Intellect) (Habits)
                                 |          |           |
                                 +----------+-----------+
                                            |
                                      [Synthesizer]
                                            |
                                      [Final Response]
```

- **Manas (Mind):** Emotional, intuitive responses
- **Buddhi (Intellect):** Rational, ethical analysis using dharmic principles
- **Sanskaras (Habits):** Experience-based patterns from SQLite habit database
- **Synthesizer (Atman):** Integrates all three into a unified response

All three modules run in parallel via `asyncio.gather`. Default weights: Buddhi 40%, Manas 35%, Sanskaras 25%.

## CLI Commands

| Command | Description |
|---------|-------------|
| `/config` | Show current configuration |
| `/habits` | List all loaded habits |
| `/weights` | Show module weight distribution |
| `/quit` | Exit the application |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/chat` | Main chat interaction |
| GET | `/api/v1/habits` | List habits |
| POST | `/api/v1/habits` | Create a habit |
| POST | `/api/v1/habits/seed` | Re-seed habits |
| PUT | `/api/v1/habits/{id}/reinforce` | Reinforce a habit |
| GET/PUT | `/api/v1/config` | Read/update config |
| GET | `/api/v1/health` | Health check |

## Documentation

- [Philosophy](docs/philosophy.md) - Hindu concepts mapped to implementation
- [Architecture](docs/architecture.md) - Technical architecture details
- [API Reference](docs/api.md) - Full API documentation
