# Security & Privacy

Ágora manages some of the most sensitive data an organization owns —
its internal knowledge. Privacy is a structural capability of the product
(see [principles](../product/principles.md)), and this page documents the
concrete mechanisms behind that claim.

To report a vulnerability, see [SECURITY.md](../../SECURITY.md).

## Tenancy & authorization

- **Everything is scoped to an organization.** Documents, projects,
  conversations, credentials, and events belong to exactly one tenant;
  every use case validates membership before touching data.
- **Conversations are additionally private per user** within a project —
  members never read each other's threads.
- Authorization failures map to `403`, cross-tenant lookups behave as
  not-found — internals are never leaked in error messages.

## Authentication & sessions

- Cookie-based sessions, resolved in middleware; use cases receive an
  already-validated `userId`.
- Passwords are hashed with **bcrypt**.
- The session cookie carries the `Secure` flag outside local development
  (`COOKIE_SECURE`), and CORS is restricted to the configured frontend
  origins **with credentials**.

## Secrets

- **Org AI provider keys** are encrypted at rest with **AES-256-GCM**
  (random IV per operation, authenticated tag — tampered payloads fail to
  decrypt rather than returning garbage). The server key is
  `CREDENTIALS_ENCRYPTION_KEY` (32-byte hex).
- **The key — plain or encrypted — never leaves over HTTP**; the API
  exposes only the last four characters (`apiKeyLastFour`).
- `.env.local` files with real secrets must not be committed to shared
  repositories.

## Data locality

- Documents live on disk under your control (`UPLOADS_DIR`); indexes and
  conversations live in your Postgres; queue/pub-sub state in your Redis.
- With `EMBEDDING_PROVIDER=ollama`, **document content is embedded without
  leaving your infrastructure**.
- What *does* leave today: chat generation sends the retrieved fragments
  and conversation history to the configured LLM provider (Gemini). Fully
  local generation is roadmap Phase 1's strategic priority.

## Auditability

- `security.audit_logs` records entity-level actions.
- Assistant answers persist their grounding sources — an immutable record
  of *what knowledge produced what answer*
  ([traceability](../architecture/traceability-and-citations.md)).

## Hardening checklist for production

- [ ] Strong, unique `POSTGRES_PASSWORD` and `REDIS_PASSWORD`
- [ ] Fresh `CREDENTIALS_ENCRYPTION_KEY` (`openssl rand -hex 32`), stored in a secret manager
- [ ] `COOKIE_SECURE=true` + TLS termination in front of the API
- [ ] `CORS_ORIGIN` restricted to your real frontend origin(s)
- [ ] Do not expose Postgres/Redis/Ollama ports publicly
- [ ] Backups: Postgres + `UPLOADS_DIR`
<!-- TODO(phase-4): expand into a full production hardening guide. -->
