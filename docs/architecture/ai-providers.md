# AI Providers

Ágora separates the knowledge platform from the AI provider (*the AI model
is interchangeable* — [principle #5](../product/principles.md)). This page
describes how providers are integrated today and where the abstraction is
heading (Phase 1 of the [roadmap](../roadmap.md)).

## Two provider roles

| Role | Used for | Current options |
|---|---|---|
| **Embedding provider** | Indexing chunks + embedding questions | `ollama` (local, default) · `gemini` |
| **LLM provider** | Generating chat answers | Google Gemini (Flash / Flash Lite / Pro) |

These are independent: you can embed locally with Ollama and answer with
Gemini — today's default local setup.

## Embedding providers (already swappable)

The documents module defines an `EmbeddingProviderPort`; `ollama` and
`gemini` adapters implement it. Selection is by environment:

```bash
EMBEDDING_PROVIDER=ollama          # or "gemini"
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIM=768                  # both providers produce 768-dim vectors
```

Vectors are tagged with the model that produced them, and retrieval always
filters by model — switching providers never mixes incompatible vectors.

## LLM provider (Gemini today)

The chat module talks to the LLM through its own ports:

- `LlmProviderPort` — `generate({ apiKey, model, systemPrompt, history, userMessage })`.
- `LlmCredentialPort` — resolves the organization's API key.

The only implementation today is the **Gemini adapter**. The supported
models live in a shared catalog (`shared/ai-provider-catalog.ts`), using
Google's rolling `-latest` aliases so model retirements don't break chat.

### Per-organization credentials

Each organization configures its own provider API key in Settings. Keys
are encrypted at rest with **AES-256-GCM** and never leave the backend —
the API exposes only the last four characters. See
[security-and-privacy.md](../deployment/security-and-privacy.md).

## Phase 1: the provider abstraction layer

The founding document makes provider independence part of Ágora's
identity. Phase 1 builds the abstraction **once**, then adds providers as
implementations:

- One clean interface: common input/output, streaming, and error handling.
- Refactor Gemini onto it.
- Add **OpenAI**, **Anthropic**, and **Ollama** (⭐ strategic priority:
  unlocks real, free self-hosting).
- Provider selection via configuration.

**Definition of Done:** adding a new provider means implementing a single
interface. See the [roadmap](../roadmap.md#-phase-1--provider-independence-complete-the-identity)
and, for contributors, [extending-agora.md](../development/extending-agora.md).

<!-- TODO(phase-1): document the final abstraction interface and its streaming
     contract here once designed. Record the design as an ADR. -->
