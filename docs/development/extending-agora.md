# Extending Ágora

Ágora is built to be extended at its ports. This page maps the extension
points and the one workflow that applies to all of them.

## The universal recipe

Every extension follows the hexagonal pattern (checklists in
[AGENTS.md](../../AGENTS.md)):

1. Find (or define) the **port** — the interface in the owning module's
   `ports/`.
2. Write an **adapter** in that module's `infra/` implementing the port.
3. Wire it in the composition root (`infrastructure/container.ts`).
4. Add unit tests using an in-memory fake of the port.

Domain logic and use cases never change when you swap an implementation —
that is the point.

## Extension point: embedding providers (available today)

`EmbeddingProviderPort` (documents module) already has two
implementations — `ollama-embedding.adapter.ts` and
`gemini-embedding.adapter.ts` — selected via `EMBEDDING_PROVIDER`.

To add one: implement the port (embed batches of texts + expose
`modelName`), produce **768-dim vectors** (the DB column is
`vector(768)`), and add the selection branch in the container.

## Extension point: LLM providers

Today the chat module's `LlmProviderPort` has a single implementation
(Gemini), and the model catalog lives in
`shared/ai-provider-catalog.ts`.

**Before adding a provider here, read
[roadmap Phase 1](../roadmap.md):** the provider abstraction layer
(common input/output, streaming, error handling) is being designed so
that each provider is one implementation of one interface. Community
provider contributions are the explicit goal of that design — Ollama,
OpenAI, and Anthropic are the first three planned.

<!-- TODO(phase-1): replace this section with the concrete "implement the
     provider interface" guide once the abstraction lands (record the
     design as an ADR). -->

## Extension point: document formats

Text extraction lives in the documents module's processing pipeline
(`pdf-parse` for PDF, `mammoth` for DOCX, plain read for text formats).
Adding a format means extending the extraction step and the accepted
upload types — keep extraction behind the pipeline so the rest of the
flow (chunking, embeddings) stays untouched.

## Extension point: storage backends (port not yet extracted)

Uploads are stored on the local filesystem (`UPLOADS_DIR`); there is **no
dedicated storage port yet**. Supporting S3-compatible backends is a
welcome contribution, but per the architecture rules it starts by
*introducing* the port in the documents module (step 1 of the recipe),
moving the filesystem behavior behind it, and only then adding the S3
adapter.
<!-- TODO: extract the file-storage port; consider an ADR for the
     storage abstraction design. -->

## Adding realtime events

New mutations that affect visible UI state publish through the owning
module's **realtime notifier port** → Redis pub/sub → SSE. Add the event
type to `RealtimeEventDto` in `packages/shared-types`, and have the
frontend store refetch its atomic query on receipt. Full rules in
AGENTS.md ("Realtime" section).
