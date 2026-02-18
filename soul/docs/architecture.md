# Technical Architecture

## System Overview

Soul AI uses a client-server architecture with a Node.js CLI frontend and a Python FastAPI backend. The soul processes every message through three parallel cognitive modules, then either synthesizes autonomously or consults a trainer when uncertain.

## Request Flow

### Autonomous Mode (default)

1. User types a message in the CLI
2. CLI sends `POST /api/v1/chat` to the backend
3. **Soul Engine** dispatches to all three modules in parallel via `asyncio.gather`
4. Each module:
   - Queries the **Learnings DB** for relevant active learnings (keyword matching)
   - Appends any learnings as context to the user message
   - Makes an independent Claude API call with its own system prompt
5. **Sanskaras** additionally queries SQLite for relevant habits before its Claude call
6. Soul Engine computes **weighted aggregate confidence**: `sum(weight_i * confidence_i)`
7. If confidence >= threshold (or learning mode is off): proceed to synthesis
8. **Synthesizer** makes a 4th Claude call to blend all perspectives
9. Response returned with `mode: "autonomous"`
10. CLI displays formatted, color-coded output

### Learning Mode (needs_trainer)

1. Steps 1-6 same as above
2. If `learning_mode_enabled` is true and confidence < `confidence_threshold`:
3. Soul Engine makes a **lightweight Claude call** to formulate a question for the trainer
4. Extracts keywords from the user message and module outputs
5. Creates a **pending learning** in the database
6. Returns response with `mode: "needs_trainer"` and `trainer_needed` details
7. CLI displays the question and directs user to trainer mode
8. No synthesis occurs — the soul honestly says it needs guidance

### Trainer Response Flow

1. Trainer reviews pending learnings via `GET /trainer/pending`
2. Trainer provides guidance via `POST /trainer/respond/{id}` with:
   - `guidance`: Full teaching text
   - `application_note`: Concise directive for modules to apply
   - `modules_informed`: Which modules should use this learning
   - `confidence_boost`: How much this learning boosts confidence (0-1)
3. Learning status changes from `pending` to `active`
4. On subsequent similar messages, modules find the active learning via keyword matching
5. Learning context is appended to the module's Claude prompt
6. `times_applied` counter increments each time a learning is used

```
[Chat User] ──POST /chat──▶ [Soul Engine]
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                 [Manas]       [Buddhi]     [Sanskaras]
                    │              │              │
               (check learnings DB for each module)
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                    confidence >= threshold? ───YES──▶ [Synthesizer] ──▶ response
                                   │                                    mode: autonomous
                                  NO
                                   │
                    Formulate question (Claude call)
                    Extract keywords
                    Create pending learning in DB
                                   │
                    Return mode: "needs_trainer"
                                   │
[Trainer] ──GET /trainer/pending──▶ sees question
           ──POST /trainer/respond/{id}──▶ provides guidance
                                   │
                    Learning activated in DB
                                   │
            Next time same topic ──▶ modules find learning ──▶ confidence high ──▶ autonomous
```

## Module Design

### Base Module (`base_module.py`)

All modules inherit from `BaseModule` which provides:
- System prompt loading from text files in `engine/prompts/`
- `call_claude_json()` for structured JSON responses
- `call_claude()` for free-text responses
- `build_learnings_context(message, module_name)` — queries the learnings DB for active learnings relevant to the message and target module, formats them as prompt context

### Manas — Mind (`manas.py`)

- **System prompt:** Emotional/intuitive persona — feels before thinking
- **Learnings:** Checks for `manas`-targeted or `all`-targeted learnings
- **Output:** Response text, confidence (0-1), emotional valence (-1 to +1)
- **Nature:** Raw emotional truth, gut reactions, desires, fears

### Buddhi — Intellect (`buddhi.py`)

- **System prompt:** Rational/ethical persona with dharmic principles (satya, ahimsa, viveka)
- **Learnings:** Checks for `buddhi`-targeted or `all`-targeted learnings
- **Output:** Response text, confidence (0-1), reasoning chain (step-by-step)
- **Nature:** Logical analysis, long-term consequences, ethical discrimination

### Sanskaras — Habits (`sanskaras.py`)

- **System prompt:** Experience-based persona reflecting accumulated patterns
- **Data sources:**
  - Habit database: keyword matching, top-5 activated habits injected into prompt
  - Learnings database: `sanskaras`-targeted or `all`-targeted learnings
- **Output:** Response text, confidence (0-1), activated habits list
- **Nature:** Conditioned wisdom (and biases) from repeated experience

### Synthesizer — Atman (`synthesizer.py`)

- **System prompt:** Unified Atman (true self) persona
- **Input:** All three module outputs with their weights and metadata
- **Output:** Free-text synthesized response (3-6 sentences)
- **Nature:** Integrates all faculties, acknowledges inner tensions, speaks as whole person

### Soul Engine (`soul_engine.py`)

The orchestrator that:
1. Runs all three modules in parallel
2. Computes weighted aggregate confidence
3. Decides between autonomous response and trainer consultation
4. Creates pending learnings when uncertain (lightweight Claude call)
5. Returns the complete `ChatResponse` with mode flag

## Data Models

### Habits Table

Stores the soul's accumulated experience patterns (sanskaras).

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| name | VARCHAR(100) | Unique habit name |
| description | TEXT | What this habit represents |
| category | VARCHAR(50) | `essence` (child-like qualities) |
| keywords | TEXT | Comma-separated trigger words |
| base_weight | FLOAT | Base importance (1.6-2.0 for essence) |
| repetition_count | INTEGER | Times reinforced |
| valence | FLOAT | Emotional charge (-1 to +1) |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Effective weight formula:** `base_weight * log2(repetition_count + 1)`

**Seed habits (7 essence qualities):**
- `purity_of_thought` — Mind untouched by conditioning
- `honesty` — Speaks truth naturally without calculation
- `unconditional_love` — Loves without expectation or condition
- `care` — Naturally tends to the wellbeing of others
- `inner_peace` — Rests in stillness, undisturbed
- `bliss` — Experiences joy without external cause (ananda)
- `innocent_curiosity` — Asks "why?" with wonder, not doubt

### Learnings Table

Stores trainer guidance that shapes the soul's future responses.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| trigger_summary | TEXT | Soul's summary of what it needs help with |
| question_context | TEXT | Original user message that caused uncertainty |
| guidance | TEXT | Full trainer response/teaching |
| application_note | TEXT | Concise directive for modules to apply |
| modules_informed | VARCHAR(100) | `"all"` or comma-separated: `"manas,buddhi"` |
| keywords | TEXT | Comma-separated trigger words for retrieval |
| confidence_boost | FLOAT | How much this learning boosts confidence (0-1) |
| times_applied | INTEGER | Usage counter (incremented on each use) |
| status | VARCHAR(20) | `"pending"` / `"active"` / `"superseded"` |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

**Keyword matching:** Same pattern as habit_service — message words are intersected with learning keywords. Learnings are scored by `overlap_count * confidence_boost` and top-5 returned.

**Status lifecycle:**
- `pending` — Soul created this when uncertain, waiting for trainer
- `active` — Trainer has provided guidance, modules will use this
- `superseded` — Soft-deleted, no longer used

## Service Layer

### Claude Client (`claude_client.py`)

Singleton wrapper around Anthropic's async SDK:
- `complete()` — Returns raw text response
- `complete_json()` — Parses JSON from response, handles markdown code blocks

### Habit Service (`habit_service.py`)

- `find_relevant_habits(message, limit=5)` — Keyword overlap scoring
- `get_all(category?, min_weight?)` — Filtered listing
- `create(**kwargs)`, `reinforce(habit_id)`, `count()`

### Learning Service (`learning_service.py`)

- `find_relevant_learnings(message, modules?, limit=5)` — Keyword overlap scoring, filters by module
- `create_pending(question_context, trigger_summary, keywords)` — Soul creates when uncertain
- `activate_learning(id, guidance, application_note, modules, confidence_boost)` — Trainer responds
- `create_active(...)` — Proactive teaching (directly active)
- `get_pending()`, `get_all_active()`, `get_by_id()`
- `increment_applied(id)` — Usage counter
- `supersede(id)` — Soft-delete
- `update_learning(id, **kwargs)` — Partial update

## Configuration

Runtime-configurable settings (in-memory, no restart needed):

| Setting | Default | Description |
|---------|---------|-------------|
| `weight_manas` | 0.35 | Mind module weight |
| `weight_buddhi` | 0.40 | Intellect module weight |
| `weight_sanskaras` | 0.25 | Habits module weight |
| `claude_model` | `claude-sonnet-4-5-20250929` | Claude model ID |
| `temperature` | 0.7 | Claude sampling temperature |
| `max_tokens` | 1024 | Max tokens per Claude call |
| `learning_mode_enabled` | `false` | Enable trainer learning mode |
| `confidence_threshold` | 0.4 | Below this, soul asks for trainer |

## Performance

- 3 modules run in parallel: total latency = max(module_latency), not sum
- When learning mode triggers, an additional lightweight Claude call formulates the trainer question (small max_tokens=256, low temperature=0.3)
- Autonomous path: Synthesizer adds one more sequential Claude call
- Typical response time: 3-6 seconds depending on Claude model
- Learnings keyword matching is in-memory (all active learnings loaded per request) — suitable for hundreds of learnings

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend framework | FastAPI (Python 3.11+) |
| Database | SQLite via SQLAlchemy async + aiosqlite |
| AI model | Anthropic Claude (configurable model) |
| Frontend | TypeScript + Commander CLI + Chalk |
| HTTP client | Axios |
