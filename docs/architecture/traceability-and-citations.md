# Traceability & Citations

Two product principles — *answers must be grounded* and *knowledge must be
traceable* — have concrete architectural consequences. This page documents
them.

## What a citation is

Every assistant reply carries the list of sources that grounded it. Each
source is:

```ts
interface ChatSource {
  documentName: string; // the file the fragment came from
  fragment: string;     // a ≤300-char preview of the grounding text
  relevance: number;    // cosine similarity score (0..1)
}
```

The full fragments go into the LLM prompt; the UI receives the short
preview — enough for the user to judge the grounding without re-reading
the document.

## Citations are persisted, not reconstructed

Sources are stored **with the assistant message** (`ai.messages.sources`,
JSONB) at the moment the reply is generated. This matters:

- Reloading a conversation shows the *same* citations the user saw live —
  not a re-run of retrieval that might return different fragments after
  documents changed.
- Realtime refetches (SSE-triggered) cannot silently drop citations.
- The citation is a historical record: *this* answer was grounded in
  *these* fragments, at *that* time.

One source is shown **per document** (the most relevant fragment), so a
reply grounded five times in one file cites it once.

## Honest absence of evidence

When retrieval returns nothing (empty project, unavailable embeddings
service, or simply no relevant content), the system does not fabricate
grounding:

- The chat continues without context rather than failing, and
- the mode-specific prompts instruct the model to acknowledge missing
  information instead of presenting assumptions as facts (*the AI must not
  invent context*).

An answer with zero citations is therefore a meaningful signal to the
user, not a rendering bug.

## Trust boundaries

- Retrieval is scoped to the **project (space)** and the **embedding
  model** that indexed it — answers can only be grounded in knowledge the
  asking user's organization loaded into that project.
- Conversations (and their citations) are private to their owner within
  the project.

## Internal traceability: ADRs

The same thesis applied to this repo: significant technical decisions are
recorded as [Architecture Decision Records](decisions/) with their
context and alternatives, so future contributors can trace *why* — not
just *what*.
