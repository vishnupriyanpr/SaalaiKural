# Architecture & Technical Reference

## Section 1 — Solution Architecture

### Overview

The RoadWatch Citizen Assistant follows a **linear webhook-processing pattern** — the simplest reliable architecture for a chatbot MVP:

```
┌──────────────┐     POST /roadwatch-chat     ┌────────────────────────────────────────┐
│              │  ──────────────────────────►  │  n8n Cloud Workflow                    │
│  Browser     │                               │                                        │
│  index.html  │                               │  Webhook → Validate → IF Valid?        │
│              │  ◄──────────────────────────  │    ├─ Yes → Build Prompt → Gemma 4 API │
│              │     JSON Response             │    │    → Format Response → Respond     │
└──────────────┘                               │    └─ No → Error Response → Respond    │
                                               └────────────────────────────────────────┘
                                                            │
                                                            ▼
                                               ┌────────────────────────┐
                                               │  NVIDIA NIM            │
                                               │  Gemma 4 (27B-IT)     │
                                               │  OpenAI-compatible API │
                                               └────────────────────────┘
```

### Why This Architecture

| Component | Why It Exists |
|---|---|
| **Single HTML frontend** | Zero build step, open in browser and demo. No framework overhead. |
| **n8n Cloud Webhook** | Instant HTTP endpoint, no server to deploy. 14-day free trial. |
| **Input Validation node** | Prevents empty/malformed messages from wasting API calls. |
| **IF routing node** | Cleanly separates valid vs invalid paths. |
| **Build Prompt (Code)** | Embeds the system prompt + constructs API body in one place. Easy to edit. |
| **HTTP Request node** | Calls NVIDIA NIM. Uses `continueOnFail` so errors don't crash the workflow. |
| **Format Response (Code)** | Normalizes LLM output into a stable JSON contract. Adds category + follow-ups. |
| **Respond to Webhook** | Returns the structured JSON synchronously to the browser. |

### What Was Intentionally Left Out (MVP)

- **No database** — stateless; each message is independent
- **No session memory** — no conversation history stored
- **No authentication** — public webhook for hackathon demo
- **No rate limiting** — n8n Cloud has built-in execution limits
- **No queue/workers** — synchronous request-response only

---

## Section 2 — Gemma 4 API Integration

### Endpoint

```
POST https://integrate.api.nvidia.com/v1/chat/completions
```

### Headers

```
Authorization: Bearer <NVIDIA_API_KEY>
Content-Type: application/json
```

### Request Body

```json
{
  "model": "google/gemma-3-27b-it",
  "messages": [
    {
      "role": "system",
      "content": "<system prompt from docs/system-prompt.txt>"
    },
    {
      "role": "user",
      "content": "<user's message>"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "top_p": 0.9
}
```

> **Model Name**: The workflow uses `google/gemma-3-27b-it`. If your NVIDIA Build dashboard shows a different identifier for Gemma 4, update the `model` field in the **Build Prompt** code node (one location only).

### Response Body (Success)

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here's what you can do about the pothole..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 256,
    "completion_tokens": 150,
    "total_tokens": 406
  }
}
```

### Response Body (Error)

```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error",
    "code": 429
  }
}
```

### How the Workflow Parses It

1. Check if `data.error` exists → treat as failure
2. Check if `data.choices[0].message.content` exists → extract reply
3. If anything is missing → return fallback error response
4. The user always gets a valid JSON contract — never a raw crash

### API Key Storage

The API key is stored as an **n8n Cloud Environment Variable**:
- Name: `NVIDIA_API_KEY`
- Referenced in the HTTP Request node as: `{{ $env.NVIDIA_API_KEY }}`
- This keeps the key out of the workflow JSON (safe to share/export)

---

## Section 3 — Response Contract

### Contract Schema

```json
{
  "success": true,
  "reply": "string — the assistant's text response",
  "category": "string — one of the category values below",
  "guidance_type": "string — one of the guidance type values below",
  "follow_up_options": ["string[]  — 2-3 contextual follow-up suggestions"]
}
```

### Category Values

| Value | When Used |
|---|---|
| `road_safety` | Helmet, seatbelt, pedestrian, night driving, visibility questions |
| `road_issue` | Potholes, damaged roads, broken signals, waterlogging, complaints |
| `traffic_rules` | Speed limits, signals, fines, license, lane discipline |
| `emergency` | Accidents, injuries, fire, immediate danger |
| `general` | General questions within scope |
| `out_of_scope` | Questions outside road safety domain |
| `error` | Input validation or API errors |

### Guidance Type Values

| Value | Meaning |
|---|---|
| `general_guidance` | Common knowledge, safe to follow |
| `verify_with_authorities` | Involves fines, laws, penalties — user should verify officially |
| `emergency_action` | Immediate safety action (call 112 first) |

### Error Response Example

```json
{
  "success": false,
  "reply": "Please enter a message to get started.",
  "category": "error",
  "guidance_type": "general_guidance",
  "follow_up_options": ["What can you help me with?", "Road safety tips"]
}
```

---

## Section 4 — N8N Workflow Node Reference

### Node 1: Webhook - Chat Input
- **Type**: `n8n-nodes-base.webhook` (v2)
- **Method**: POST
- **Path**: `/roadwatch-chat`
- **Response Mode**: `responseNode` (waits for Respond to Webhook node)
- **Input**: `{ "message": "user text here" }`
- **Output**: `$json.body.message`

### Node 2: Validate Input
- **Type**: `n8n-nodes-base.code` (v2)
- **Logic**: Checks message exists, is a string, length 2-2000
- **Handles**: Missing body, null/undefined message, wrong type, too short, too long
- **Output**: `{ valid: true/false, error: string|null, message: string, sessionId: string }`

### Node 3: IF - Input Valid
- **Type**: `n8n-nodes-base.if` (v2)
- **Condition**: `$json.valid === true`
- **True output (index 0)**: → Build Prompt
- **False output (index 1)**: → Prepare Error Response

### Node 4: Build Prompt
- **Type**: `n8n-nodes-base.code` (v2)
- **Logic**: Constructs the OpenAI-compatible messages array with system prompt + user message
- **Contains**: The full system prompt (edit here to change LLM behavior)
- **Contains**: The model name (edit here to change model)
- **Output**: `{ requestBody: {...}, userMessage: string }`

### Node 5: Call Gemma 4 API
- **Type**: `n8n-nodes-base.httpRequest` (v4.2)
- **Method**: POST
- **URL**: `https://integrate.api.nvidia.com/v1/chat/completions`
- **Auth**: Bearer token from `$env.NVIDIA_API_KEY`
- **Body**: JSON-stringified `$json.requestBody` from Build Prompt
- **Timeout**: 30 seconds
- **Error Handling**: `onError: continueRegularOutput` — continues to next node even on failure

### Node 6: Format Response
- **Type**: `n8n-nodes-base.code` (v2)
- **Logic**: Parses LLM response, detects category from user message, builds structured output
- **Error handling**: try/catch wraps everything; always returns valid contract JSON
- **References**: `$('Build Prompt')` to retrieve original user message for categorization

### Node 7: Send Response / Send Error Response
- **Type**: `n8n-nodes-base.respondToWebhook` (v1.1)
- **Mode**: `firstIncomingItem` — returns the JSON from the previous node directly

---

## Section 5 — Future Roadmap (Phase 2)

### Priority 1 — Quick Wins
- **Conversation memory**: Add n8n's Window Buffer Memory for multi-turn chat
- **Multilingual**: Detect Hindi/Tamil/regional language input, respond in same language
- **Rate limiting**: Add per-IP throttling via Code node
- **Logging**: Store queries to Google Sheets for analysis

### Priority 2 — Dashboard Integration
- **Issue database**: Connect to Supabase/Postgres to store reported road issues
- **Location capture**: Add geolocation to the frontend, send coordinates with messages
- **Photo upload**: Let users attach road issue photos (store in cloud storage)
- **Admin dashboard**: React/Next.js dashboard to view submitted issues on a map

### Priority 3 — Authority Routing
- **Auto-routing**: Based on issue type + location, route to the correct department
- **Status tracking**: Let users check the status of their reported issue
- **Analytics**: Heatmap of road issues, most common problem types, response times

### Priority 4 — Intelligence
- **RAG knowledge base**: Verified Indian traffic laws, state-specific rules, fine schedules
- **Fine-tuned model**: Train on Indian road safety corpus for better accuracy
- **Sentiment analysis**: Detect urgency/frustration and prioritize responses
- **Spending transparency**: Connect to government spending APIs for accountability
