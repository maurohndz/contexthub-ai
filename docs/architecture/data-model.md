# Data Model

PostgreSQL 18 with the **pgvector**, `pg_trgm`, and `citext` extensions.
Tables are split across four schemas by concern. The authoritative
definition is [`apps/backend/prisma/schema.prisma`](../../apps/backend/prisma/schema.prisma);
this page is the map.

## Conventions

- Primary keys: `uuidv7()` (time-ordered UUIDs — also usable as an
  insertion-order tie-breaker).
- Standard columns everywhere: `status` (boolean), `created_at`,
  `updated_at`, `deleted_at`.
- **Soft delete for business entities; hard delete for derived data**
  (chunks/embeddings are rebuilt from the source file).
- Some objects are not expressible in the Prisma DSL (HNSW index,
  `uuidv7()` defaults) and are **managed by hand in migrations** — read
  the Persistence rules in [AGENTS.md](../../AGENTS.md) before touching
  the schema.

## Schema map

### `security` — identity & access

| Table | Purpose |
|---|---|
| `users` | Accounts (unique citext email, bcrypt password hash) |
| `sessions` | Cookie sessions (expiry, revocation) |
| `api_keys` | Per-user API keys *(reserved for future use)* |
| `audit_logs` | Entity-level audit trail |

### `main` — organizations & knowledge

| Table | Purpose |
|---|---|
| `organizations` | Tenants (unique slug, creator) |
| `organization_members` | Membership + role per user/org |
| `organization_invitations` | Pending email invitations *(flow lands in roadmap Phase 2)* |
| `spaces` | Projects (UI name) — knowledge containers per org |
| `tags` / `space_tags` | Org-defined tags on spaces |
| `context_sources` | Uploaded files (one row per upload) |
| `context_documents` | Processed document per source (+ classification) |
| `context_chunks` | Text chunks derived from a source |
| `ai_provider_credentials` | Per-org encrypted AI API keys (AES-256-GCM payload, last-four only exposed) |

### `ai` — retrieval & conversation

| Table | Purpose |
|---|---|
| `embeddings` | `vector(768)` per chunk, tagged with `model_name`; **HNSW index** (cosine) + `(space_id, model_name)` filter index |
| `conversations` | Chat threads, scoped to `(space, user)` — private per user |
| `messages` | Messages per conversation; assistant rows persist their grounding `sources` (JSONB) |
| `prompt_templates` | Named prompt templates *(reserved)* |
| `ai_usage_logs` | Token/usage accounting per org/space/user |

### `parameters` — catalogs

| Table | Purpose |
|---|---|
| `catalogs` / `catalog_items` | Generic catalogs (e.g. document classifications) |

## Key relationships

```
organizations 1─n organization_members n─1 users
organizations 1─n spaces
spaces        1─n context_sources 1─n context_chunks 1─1 embeddings
context_sources 1─1 context_documents n─1 catalog_items (classification)
spaces        1─n conversations n─1 users     (thread privacy)
conversations 1─n messages                    (assistant rows carry sources JSONB)
```

## Retrieval-critical indexes

- `ai.embeddings` `USING hnsw (embedding vector_cosine_ops)` — the ANN
  index behind every semantic search. **Not representable in Prisma**;
  kept alive by hand-written migrations.
- `ai.embeddings (space_id, model_name)` — scopes search to a project and
  the embedding model that indexed it.
