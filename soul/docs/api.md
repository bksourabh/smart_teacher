# API Reference

Base URL: `http://localhost:8000/api/v1`

## POST /chat

Main interaction endpoint. Processes input through all three modules and synthesizer.

**Request:**
```json
{
  "message": "Should I quit my job to start a business?"
}
```

**Response:**
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
    "response": "Past patterns strongly favor financial security...",
    "confidence": 0.75,
    "activated_habits": [
      {"name": "risk_aversion", "weight": 3.2, "influence": "..."}
    ],
    "metadata": {}
  },
  "synthesis": {
    "response": "This is a moment of genuine inner conflict...",
    "weights": {"manas": 0.35, "buddhi": 0.40, "sanskaras": 0.25}
  },
  "elapsed_ms": 4231
}
```

## GET /habits

List all habits, optionally filtered.

**Query Parameters:**
- `category` (optional): Filter by category (survival, social, emotional, cognitive, moral, growth)
- `min_weight` (optional, default 0.0): Minimum effective weight

**Response:** Array of habit objects.

## POST /habits

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

## POST /habits/seed

Re-seed the habit database with default habits.

## PUT /habits/{id}/reinforce

Increment a habit's repetition count, increasing its effective weight.

## GET /config

Returns current runtime configuration.

## PUT /config

Update runtime configuration.

**Request:**
```json
{
  "weight_manas": 0.35,
  "weight_buddhi": 0.40,
  "weight_sanskaras": 0.25
}
```

## GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```
