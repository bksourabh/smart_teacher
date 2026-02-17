# Technical Architecture

## System Overview

Soul AI uses a client-server architecture with a Node.js CLI frontend and a Python FastAPI backend.

## Request Flow

1. User types a message in the CLI
2. CLI sends `POST /api/v1/chat` to the backend
3. **Soul Engine** receives the message and dispatches to all three modules in parallel via `asyncio.gather`
4. Each module makes an independent Claude API call with its own system prompt
5. **Sanskaras** additionally queries SQLite for relevant habits before its Claude call
6. All three outputs are collected and passed to the **Synthesizer**
7. Synthesizer makes a 4th Claude call to blend all perspectives
8. Complete response (all 4 outputs) is returned to the CLI
9. CLI displays formatted, color-coded output

## Module Design

### Base Module
All modules inherit from `BaseModule` which provides:
- System prompt loading from text files
- `call_claude_json()` for structured JSON responses
- `call_claude()` for free-text responses

### Manas (Mind)
- System prompt: emotional/intuitive persona
- Output: response text, confidence, emotional valence
- No external data dependencies

### Buddhi (Intellect)
- System prompt: rational/ethical persona with dharmic principles
- Output: response text, confidence, reasoning chain
- No external data dependencies

### Sanskaras (Habits)
- System prompt: experience-based persona
- Queries SQLite habit database via keyword matching
- Injects top-5 matched habits into Claude prompt
- Output: response text, confidence, activated habits list

### Synthesizer
- System prompt: unified Atman persona
- Receives all three module outputs with weights
- Output: free-text synthesized response

## Data Model

### Habits Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | VARCHAR(100) | Unique habit name |
| description | TEXT | What this habit represents |
| category | VARCHAR(50) | survival, social, emotional, cognitive, moral, growth |
| keywords | TEXT | Comma-separated trigger words |
| base_weight | FLOAT | Base importance (1.0-2.0) |
| repetition_count | INTEGER | Times reinforced |
| valence | FLOAT | Emotional charge (-1 to +1) |

**Effective weight:** `base_weight * log2(repetition_count + 1)`

## Configuration

Runtime-configurable via `/api/v1/config`:
- Module weights (manas, buddhi, sanskaras)
- Claude model, temperature, max tokens

## Performance

- 3 modules run in parallel: total latency ≈ max(module_latency), not sum
- Synthesizer adds one more Claude call sequentially
- Typical response time: 3-6 seconds depending on Claude model
