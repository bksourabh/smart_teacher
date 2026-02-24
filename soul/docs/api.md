# API Reference

Base URL: `http://localhost:8000/api/v1`

---

## Core Endpoints

### POST /chat/stream  *(Web UI — SSE)*

Streaming variant of `/chat`. Returns a `text/event-stream` response that emits events as each faculty completes. Used by the Vite + Lit web UI for progressive rendering.

**Request:** Same as `POST /chat`
```json
{ "message": "Should I quit my job to start a business?" }
```

**SSE Event sequence:**

```
event: start
data: {"message": "Should I...", "timestamp": 1740000000.0}

event: manas
data: {"module": "manas", "response": "There's excitement...", "confidence": 0.70, "valence": 0.30}

event: buddhi
data: {"module": "buddhi", "response": "Consider 12 months savings...", "confidence": 0.85, "reasoning_chain": [...]}

event: sanskaras
data: {"module": "sanskaras", "response": "The essence of curiosity...", "confidence": 0.60, "activated_habits": [...]}

event: confidence
data: {"weighted": 0.745, "threshold": 0.4, "learning_mode": false}

event: synthesis
data: {"response": "This is a moment of genuine reflection...", "weights": {...}, "mode": "autonomous", "elapsed_ms": 4231}

event: done
data: {"elapsed_ms": 4231}
```

**Alternative: needs_trainer path** (when `learning_mode_enabled=true` and confidence < threshold):

```
event: needs_trainer
data: {"learning_id": 1, "trigger_summary": "How should I...", "question_context": "...", "elapsed_ms": 2100}

event: done
data: {"elapsed_ms": 2100}
```

**Error event** (if a module fails):
```
event: error
data: {"module": "manas", "error": "API timeout"}
```

> The `manas`, `buddhi`, and `sanskaras` events arrive in **completion order** (whichever finishes first), not fixed order. This allows the UI to render each faculty progressively.

---

### POST /chat

Main interaction endpoint. Processes input through all three modules. In learning mode, may return a trainer consultation request instead of a synthesized response.

**Request:**
```json
{
  "message": "Should I quit my job to start a business?",
  "conversation_id": null
}
```

**Response (autonomous mode):**
```json
{
  "manas": {
    "module": "manas",
    "response": "There's excitement about the possibility...",
    "confidence": 0.70,
    "valence": 0.30,
    "metadata": {}
  },
  "buddhi": {
    "module": "buddhi",
    "response": "Consider: Do you have 12 months of savings?...",
    "confidence": 0.85,
    "reasoning_chain": ["Step 1: ...", "Step 2: ..."],
    "metadata": {}
  },
  "sanskaras": {
    "module": "sanskaras",
    "response": "The essence of innocent curiosity resonates here...",
    "confidence": 0.60,
    "activated_habits": [
      {"name": "innocent_curiosity", "weight": 1.8, "influence": "eager to explore"}
    ],
    "metadata": {}
  },
  "synthesis": {
    "response": "This is a moment of genuine inner reflection...",
    "weights": {"manas": 0.35, "buddhi": 0.40, "sanskaras": 0.25}
  },
  "elapsed_ms": 4231,
  "mode": "autonomous",
  "trainer_needed": null
}
```

**Response (needs_trainer mode):**

Returned when `learning_mode_enabled` is true and weighted confidence is below `confidence_threshold`.

```json
{
  "manas": { "...": "..." },
  "buddhi": { "...": "..." },
  "sanskaras": { "...": "..." },
  "synthesis": {
    "response": "I'm not sure how to respond to this yet. I need guidance from my trainer.",
    "weights": {"manas": 0.35, "buddhi": 0.40, "sanskaras": 0.25}
  },
  "elapsed_ms": 2100,
  "mode": "needs_trainer",
  "trainer_needed": {
    "learning_id": 1,
    "trigger_summary": "How should I respond when asked about my name?",
    "question_context": "what is your name?"
  }
}
```

---

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

---

## Habits Endpoints

### GET /habits

List all habits, optionally filtered.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | (none) | Filter by category (e.g. `essence`) |
| `min_weight` | float | 0.0 | Minimum effective weight |

**Response:** Array of habit objects:
```json
[
  {
    "id": 1,
    "name": "purity_of_thought",
    "description": "Mind untouched by conditioning...",
    "category": "essence",
    "keywords": "think,thought,mind,pure,clean,clear,fresh,innocent,simple",
    "base_weight": 2.0,
    "repetition_count": 1,
    "effective_weight": 2.0,
    "valence": 0.8
  }
]
```

### POST /habits

Create a new habit.

**Request:**
```json
{
  "name": "meditation",
  "description": "Daily meditation practice",
  "category": "growth",
  "keywords": "meditate,calm,mindful,present,breathe",
  "base_weight": 1.5,
  "valence": 0.6
}
```

### POST /habits/seed

Re-seed the habit database with the 7 default essence habits. Existing habits are preserved (duplicates skipped).

**Response:**
```json
{
  "message": "Habits seeded",
  "count": 7
}
```

### PUT /habits/{id}/reinforce

Increment a habit's repetition count, increasing its effective weight via the `log2(repetition_count + 1)` formula.

**Response:** Updated habit object.

---

## Configuration Endpoints

### GET /config

Returns current runtime configuration.

**Response:**
```json
{
  "weight_manas": 0.35,
  "weight_buddhi": 0.40,
  "weight_sanskaras": 0.25,
  "claude_model": "claude-sonnet-4-5-20250929",
  "temperature": 0.7,
  "max_tokens": 1024,
  "learning_mode_enabled": false,
  "confidence_threshold": 0.4
}
```

### PUT /config

Update runtime configuration. All fields are optional — only provided fields are updated.

**Request:**
```json
{
  "learning_mode_enabled": true,
  "confidence_threshold": 0.5
}
```

**Response:** Full updated configuration object.

---

## Trainer Endpoints

### GET /trainer/pending

List all learnings with status `pending` — questions the soul needs help with.

**Response:**
```json
[
  {
    "id": 1,
    "trigger_summary": "How should I respond when asked about my name?",
    "question_context": "what is your name?",
    "guidance": "",
    "application_note": "",
    "modules_informed": "all",
    "keywords": "what,is,your,name",
    "confidence_boost": 0.5,
    "times_applied": 0,
    "status": "pending"
  }
]
```

### GET /trainer/learnings

List all learnings with status `active`.

**Response:** Array of learning objects (same schema as above, with `status: "active"` and populated guidance fields).

### POST /trainer/respond/{id}

Provide guidance for a pending learning. Changes its status from `pending` to `active`.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Learning ID |

**Request:**
```json
{
  "guidance": "Your name is Atman, the true self. Share this warmly.",
  "application_note": "Tell them your name is Atman warmly",
  "modules_informed": "all",
  "confidence_boost": 0.8
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `guidance` | string | yes | — | Full teaching/guidance text |
| `application_note` | string | yes | — | Concise directive for modules |
| `modules_informed` | string | no | `"all"` | `"all"` or comma-separated: `"manas,buddhi"` |
| `confidence_boost` | float | no | 0.5 | How much this boosts confidence (0-1) |

**Response:** Updated learning object with `status: "active"`.

**Errors:**
- `404` — Learning not found
- `400` — Learning is not in `pending` status

### POST /trainer/learnings

Proactively create a new learning (directly active, no pending phase).

**Request:**
```json
{
  "trigger_summary": "How to greet people",
  "question_context": "",
  "keywords": "hello,hi,hey,greet,namaste",
  "guidance": "Greet warmly with Namaste, honoring the divine in the other person",
  "application_note": "Greet warmly with Namaste",
  "modules_informed": "all",
  "confidence_boost": 0.7
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `trigger_summary` | string | yes | — | What this learning teaches |
| `question_context` | string | no | `""` | Optional context |
| `keywords` | string | yes | — | Comma-separated trigger words |
| `guidance` | string | yes | — | Full teaching text |
| `application_note` | string | yes | — | Concise directive |
| `modules_informed` | string | no | `"all"` | Target modules |
| `confidence_boost` | float | no | 0.5 | Confidence boost (0-1) |

**Response:** Created learning object with `status: "active"` (HTTP 201).

### PUT /trainer/learnings/{id}

Update an existing learning. All fields are optional.

**Request:**
```json
{
  "guidance": "Updated guidance text",
  "confidence_boost": 0.9
}
```

| Field | Type | Description |
|-------|------|-------------|
| `guidance` | string | Updated teaching text |
| `application_note` | string | Updated directive |
| `modules_informed` | string | Updated target modules |
| `confidence_boost` | float | Updated boost value |
| `keywords` | string | Updated trigger words |

**Response:** Updated learning object.

### DELETE /trainer/learnings/{id}

Supersede (soft-delete) a learning. Sets status to `superseded` — it will no longer be returned in keyword searches.

**Response:** Updated learning object with `status: "superseded"`.

---

## Response Schema Reference

### ChatResponse

| Field | Type | Description |
|-------|------|-------------|
| `manas` | ManaOutput | Mind module output |
| `buddhi` | BuddhiOutput | Intellect module output |
| `sanskaras` | SanskaraOutput | Habits module output |
| `synthesis` | SynthesisOutput | Synthesized response |
| `elapsed_ms` | integer | Total processing time in milliseconds |
| `mode` | string | `"autonomous"` or `"needs_trainer"` |
| `trainer_needed` | TrainerConsultationNeeded? | Present when mode is `needs_trainer` |

### ManaOutput

| Field | Type | Description |
|-------|------|-------------|
| `module` | string | Always `"manas"` |
| `response` | string | Emotional/intuitive response |
| `confidence` | float | 0.0 to 1.0 |
| `valence` | float | -1.0 (distress) to +1.0 (joy) |

### BuddhiOutput

| Field | Type | Description |
|-------|------|-------------|
| `module` | string | Always `"buddhi"` |
| `response` | string | Rational/ethical analysis |
| `confidence` | float | 0.0 to 1.0 |
| `reasoning_chain` | string[] | Step-by-step reasoning |

### SanskaraOutput

| Field | Type | Description |
|-------|------|-------------|
| `module` | string | Always `"sanskaras"` |
| `response` | string | Experience-based response |
| `confidence` | float | 0.0 to 1.0 |
| `activated_habits` | object[] | `{name, weight, influence}` |

### SynthesisOutput

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | Unified synthesized response |
| `weights` | object | `{manas, buddhi, sanskaras}` weight values |

### TrainerConsultationNeeded

| Field | Type | Description |
|-------|------|-------------|
| `learning_id` | integer | ID of the pending learning created |
| `trigger_summary` | string | What the soul wants to know |
| `question_context` | string | Original user message |

### LearningResponse

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Learning ID |
| `trigger_summary` | string | What this learning addresses |
| `question_context` | string | Original context |
| `guidance` | string | Trainer's teaching |
| `application_note` | string | Concise directive for modules |
| `modules_informed` | string | Target modules |
| `keywords` | string | Comma-separated trigger words |
| `confidence_boost` | float | 0.0 to 1.0 |
| `times_applied` | integer | Usage counter |
| `status` | string | `pending` / `active` / `superseded` |

---

## SSE Stream Event Reference

All events from `POST /chat/stream` follow the `text/event-stream` format.

| Event | When | Data fields |
|-------|------|-------------|
| `start` | Immediately | `message`, `timestamp` |
| `manas` | Manas module completes | `module`, `response`, `confidence`, `valence` |
| `buddhi` | Buddhi module completes | `module`, `response`, `confidence`, `reasoning_chain[]` |
| `sanskaras` | Sanskaras module completes | `module`, `response`, `confidence`, `activated_habits[]` |
| `confidence` | All 3 modules done | `weighted`, `threshold`, `learning_mode` |
| `synthesis` | Atman synthesizes | `response`, `weights`, `mode`, `elapsed_ms` |
| `needs_trainer` | Confidence below threshold (learning mode on) | `learning_id`, `trigger_summary`, `question_context`, `elapsed_ms` |
| `done` | Stream complete | `elapsed_ms` |
| `error` | Module or synthesis failure | `module` (optional), `error` |
