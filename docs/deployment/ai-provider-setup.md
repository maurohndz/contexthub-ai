# AI Provider Setup

Ágora uses AI in two independent roles — **embeddings** (indexing and
search) and **chat generation**. Each is configured separately.

## Embeddings

Configured by environment on the backend
(see [configuration.md](configuration.md)):

### Option A — Ollama (local, free, default)

```bash
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://localhost:11434
```

Nothing else to do: `pnpm infra:up` starts Ollama and the `ollama-init`
sidecar pulls the model automatically on first run (it is idempotent —
warm volumes are not re-downloaded).

### Option B — Gemini embeddings

```bash
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=<your key>
```

> Vectors are tagged with the model that produced them and search filters
> by model, so switching embedding providers is safe — but documents
> indexed with the old model must be **reprocessed** to be searchable
> under the new one.

## Chat generation (LLM)

Chat credentials are configured **per organization, in the product UI**
(Settings → AI models), not by environment:

1. Log in and open **Configuración** from the left sidebar.
2. In the AI models section, select the provider (**Google Gemini** today)
   and paste the organization's API key
   (get one at [Google AI Studio](https://aistudio.google.com/apikey)).
3. Save. The key is encrypted at rest (AES-256-GCM) and only its last
   four characters are ever shown again.

Members can then pick the model per conversation: **Gemini Flash**
(fast), **Flash Lite** (cheapest), or **Gemini Pro** (most capable).

The backend `GEMINI_API_KEY` env variable acts only as a fallback when an
organization has not configured its own credential; leave it empty to
force per-organization configuration.

## Fully local setup

Today, embeddings and retrieval run fully local via Ollama, but **chat
generation still requires Gemini** (cloud). Making the LLM itself local
(Ollama chat models) is the ⭐ strategic priority of
[roadmap Phase 1 — Provider Independence](../roadmap.md), together with
OpenAI and Anthropic providers behind a single abstraction.
