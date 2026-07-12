# Product Principles

These principles are **constraints on implementation**, not aspirations.
A feature that violates one of them is wrong even if it works. Pull
requests are reviewed against this list.

## 1. Answers must be grounded

Responses are built from the organization's available information, and the
sources used are shown with the answer. An ungrounded answer is a bug.

*In practice today:* every assistant reply carries the document fragments
that grounded it, persisted with the message and rendered as citations in
the chat (see [traceability-and-citations.md](../architecture/traceability-and-citations.md)).

## 2. The user keeps control

Never hide how an answer was reached. The user can always see which
sources were used and judge them directly.

## 3. Context belongs to the organization

Documents, indexes, configuration, and conversations stay under the
user's control. Multi-tenancy is strict: everything is scoped to an
organization, and one organization can never read another's data.

## 4. Privacy must be a structural capability

It must be genuinely possible to run the entire system on your own
infrastructure. This is why the Ollama (self-hosted) provider is a
strategic priority in [the roadmap](../roadmap.md) — until local models
work end to end, Ágora is not yet what it promises to be.

## 5. The AI model is interchangeable

The knowledge platform is separate from the AI provider. Providers are
integrated behind interfaces (ports); swapping or adding one must never
require touching domain logic. See
[ai-providers.md](../architecture/ai-providers.md).

## 6. Simplicity is a priority

Usable by non-technical people, even if the infrastructure underneath is
advanced. Complexity lives in the platform, not in the user's day.

## 7. Knowledge must be traceable

Important answers must link back to documents, meetings, decisions, or
concrete sources. Traceability is also why this project records its own
technical decisions as [ADRs](../architecture/decisions/) — Ágora exists
to preserve decisions with their context, so it practices what it preaches.

## 8. The AI must not invent context

When there is not enough information, the assistant acknowledges the
absence of evidence instead of presenting assumptions as facts. Retrieval
returning nothing is a valid, honest state — not something to paper over.
