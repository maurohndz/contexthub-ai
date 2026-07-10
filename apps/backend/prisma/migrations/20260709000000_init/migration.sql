-- =====================================================================
-- ContextHub AI — Migración inicial (v2: multi-tenant por orgs)
-- PostgreSQL 18
-- =====================================================================
-- Modelo: usuario se auto-registra -> crea/pertenece a una o varias
-- organizaciones -> dentro de la organización hay "espacios" (spaces,
-- antes "proyectos") -> cada miembro de la organización ve todos los
-- espacios (no hay visibilidad restringida: la org es la fuente de
-- verdad, sin secretos internos).
--
-- Convenciones:
--   - snake_case, inglés, en todas las columnas y tablas
--   - PK: id UUID (uuidv7(), nativo desde PG18 -> time-ordered, mejor
--     para índices B-tree que uuidv4 random)
--   - Columnas estándar en TODAS las tablas: status, created_at,
--     updated_at, deleted_at (soft delete)
--   - FKs: fk_<tabla>_<columna> | Índices: idx_<tabla>_<columna>
--   - Timestamps siempre TIMESTAMPTZ
-- =====================================================================

-- ---------------------------------------------------------------------
-- EXTENSIONES
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;      -- pgvector: embeddings / RAG
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- búsqueda difusa / LIKE indexado
CREATE EXTENSION IF NOT EXISTS citext;      -- emails case-insensitive
-- Nota: uuidv4()/uuidv7() son nativos desde PG18, no requieren extensión.

-- ---------------------------------------------------------------------
-- SCHEMAS
-- ---------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS security;   -- identidad, auth, auditoría
CREATE SCHEMA IF NOT EXISTS main;       -- organizaciones, espacios, contexto
CREATE SCHEMA IF NOT EXISTS ai;         -- embeddings, conversaciones, uso de IA

-- ---------------------------------------------------------------------
-- FUNCIÓN COMPARTIDA: auto-actualizar updated_at
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SCHEMA: security  (identidad global — un usuario puede pertenecer a
-- varias organizaciones)
-- =====================================================================

CREATE TABLE security.users (
  id                UUID PRIMARY KEY DEFAULT uuidv7(),
  email             CITEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  full_name         VARCHAR(150) NOT NULL,
  email_verified_at TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  status            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_users_email ON security.users (email) WHERE deleted_at IS NULL;

CREATE TABLE security.sessions (
  id                 UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id            UUID NOT NULL REFERENCES security.users (id),
  refresh_token_hash TEXT NOT NULL,
  ip_address         INET,
  user_agent         TEXT,
  expires_at         TIMESTAMPTZ NOT NULL,
  revoked_at         TIMESTAMPTZ,
  status             BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);
CREATE INDEX idx_sessions_user_id ON security.sessions (user_id);

CREATE TABLE security.api_keys (
  id           UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id      UUID NOT NULL REFERENCES security.users (id),
  name         VARCHAR(100) NOT NULL,
  key_hash     TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  status       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);
CREATE INDEX idx_api_keys_user_id ON security.api_keys (user_id);

-- Ledger de auditoría (append-only). Se mantienen las 4 columnas estándar
-- por consistencia, aunque en la práctica updated_at/deleted_at no se usan.
CREATE TABLE security.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id     UUID REFERENCES security.users (id),
  action      VARCHAR(100) NOT NULL,      -- ej: 'space.deleted'
  entity_type VARCHAR(100),
  entity_id   UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  ip_address  INET,
  status      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_audit_logs_user_id ON security.audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity ON security.audit_logs (entity_type, entity_id);

-- =====================================================================
-- SCHEMA: main
-- =====================================================================

-- ---------------------------------------------------------------------
-- Organizaciones (tenant)
-- ---------------------------------------------------------------------
CREATE TABLE main.organizations (
  id         UUID PRIMARY KEY DEFAULT uuidv7(),
  created_by UUID NOT NULL REFERENCES security.users (id),
  name       VARCHAR(150) NOT NULL,
  slug       VARCHAR(160) NOT NULL,
  status     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_organizations_slug ON main.organizations (slug) WHERE deleted_at IS NULL;

-- Membresía: many-to-many entre users y organizations, con rol simple.
-- El rol 'owner' es quien creó la org o fue promovido; no hay tabla
-- roles/permissions separada -- se mantiene simple a propósito.
CREATE TABLE main.organization_members (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  organization_id UUID NOT NULL REFERENCES main.organizations (id),
  user_id         UUID NOT NULL REFERENCES security.users (id),
  role            VARCHAR(20) NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner', 'admin', 'member')),
  invited_by      UUID REFERENCES security.users (id),
  joined_at       TIMESTAMPTZ,
  status          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT uq_organization_members UNIQUE (organization_id, user_id)
);
CREATE INDEX idx_organization_members_user_id ON main.organization_members (user_id);

-- Invitaciones por email (con o sin cuenta previa) + token de aceptación.
CREATE TABLE main.organization_invitations (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  organization_id UUID NOT NULL REFERENCES main.organizations (id),
  email           CITEXT NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'member'
                    CHECK (role IN ('admin', 'member')),
  invited_by      UUID NOT NULL REFERENCES security.users (id),
  token_hash      TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  status          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
-- evita invitaciones duplicadas pendientes al mismo email en la misma org
CREATE UNIQUE INDEX uq_org_invitations_pending
  ON main.organization_invitations (organization_id, email)
  WHERE accepted_at IS NULL AND deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- Espacios (antes "proyectos"). Visibles para TODOS los miembros de la
-- organización -- no hay control de acceso por espacio.
-- ---------------------------------------------------------------------
CREATE TABLE main.spaces (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  organization_id UUID NOT NULL REFERENCES main.organizations (id),
  created_by      UUID NOT NULL REFERENCES security.users (id),
  name            VARCHAR(150) NOT NULL,
  slug            VARCHAR(160) NOT NULL,
  description     TEXT,
  status          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT uq_spaces_org_slug UNIQUE (organization_id, slug)
);
CREATE INDEX idx_spaces_organization_id ON main.spaces (organization_id);

CREATE TYPE main.context_source_type AS ENUM ('file', 'url', 'text', 'note');

-- Origen de la información cargada al espacio (antes de fragmentar)
CREATE TABLE main.context_sources (
  id          UUID PRIMARY KEY DEFAULT uuidv7(),
  space_id    UUID NOT NULL REFERENCES main.spaces (id),
  source_type main.context_source_type NOT NULL,
  title       VARCHAR(200) NOT NULL,
  origin_url  TEXT,
  status      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_context_sources_space_id ON main.context_sources (space_id);

-- Archivos concretos asociados a una fuente tipo 'file'
CREATE TABLE main.context_documents (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  source_id       UUID NOT NULL REFERENCES main.context_sources (id),
  space_id        UUID NOT NULL REFERENCES main.spaces (id),
  file_name       VARCHAR(255) NOT NULL,
  file_path       TEXT NOT NULL,
  mime_type       VARCHAR(100),
  file_size_bytes BIGINT,
  status          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_context_documents_space_id ON main.context_documents (space_id);
CREATE INDEX idx_context_documents_source_id ON main.context_documents (source_id);

-- Texto fragmentado (chunking) para RAG; cada chunk tendrá su embedding
CREATE TABLE main.context_chunks (
  id          UUID PRIMARY KEY DEFAULT uuidv7(),
  source_id   UUID NOT NULL REFERENCES main.context_sources (id),
  space_id    UUID NOT NULL REFERENCES main.spaces (id),
  chunk_index INTEGER NOT NULL,
  content     TEXT NOT NULL,
  token_count INTEGER,
  status      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX idx_context_chunks_space_id ON main.context_chunks (space_id);
CREATE INDEX idx_context_chunks_source_id ON main.context_chunks (source_id);

-- Tags a nivel organización (biblioteca compartida), aplicados a espacios
-- puntuales vía space_tags.
CREATE TABLE main.tags (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  organization_id UUID NOT NULL REFERENCES main.organizations (id),
  name            VARCHAR(60) NOT NULL,
  color           VARCHAR(20),
  status          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT uq_tags_org_name UNIQUE (organization_id, name)
);

CREATE TABLE main.space_tags (
  id         UUID PRIMARY KEY DEFAULT uuidv7(),
  space_id   UUID NOT NULL REFERENCES main.spaces (id),
  tag_id     UUID NOT NULL REFERENCES main.tags (id),
  status     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_space_tags UNIQUE (space_id, tag_id)
);

-- =====================================================================
-- SCHEMA: ai
-- =====================================================================

-- 768 = dimensión de text-embedding-004 de Gemini. Si usan
-- gemini-embedding-001 (hasta 3072, truncable vía Matryoshka), ajustar aquí.
CREATE TABLE ai.embeddings (
  id         UUID PRIMARY KEY DEFAULT uuidv7(),
  chunk_id   UUID NOT NULL REFERENCES main.context_chunks (id),
  space_id   UUID NOT NULL REFERENCES main.spaces (id),
  embedding  VECTOR(768) NOT NULL,
  model_name VARCHAR(100) NOT NULL DEFAULT 'text-embedding-004',
  status     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_embeddings_space_id ON ai.embeddings (space_id);
-- HNSW: mejor recall/latencia que IVFFlat para búsquedas ANN en pgvector
CREATE INDEX idx_embeddings_vector_hnsw ON ai.embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE TABLE ai.conversations (
  id         UUID PRIMARY KEY DEFAULT uuidv7(),
  space_id   UUID NOT NULL REFERENCES main.spaces (id),
  user_id    UUID NOT NULL REFERENCES security.users (id),
  title      VARCHAR(200),
  status     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_conversations_space_id ON ai.conversations (space_id);

CREATE TYPE ai.message_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE ai.messages (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  conversation_id UUID NOT NULL REFERENCES ai.conversations (id),
  role            ai.message_role NOT NULL,
  content         TEXT NOT NULL,
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  model_name      VARCHAR(100),
  status          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_messages_conversation_id ON ai.messages (conversation_id);

CREATE TABLE ai.ai_usage_logs (
  id              UUID PRIMARY KEY DEFAULT uuidv7(),
  user_id         UUID REFERENCES security.users (id),
  organization_id UUID REFERENCES main.organizations (id),
  space_id        UUID REFERENCES main.spaces (id),
  provider        VARCHAR(50) NOT NULL DEFAULT 'gemini',
  model_name      VARCHAR(100) NOT NULL,
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  latency_ms      INTEGER,
  cost_usd        NUMERIC(10, 6),
  status          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_ai_usage_logs_user_id ON ai.ai_usage_logs (user_id);
CREATE INDEX idx_ai_usage_logs_org_id ON ai.ai_usage_logs (organization_id);
CREATE INDEX idx_ai_usage_logs_space_id ON ai.ai_usage_logs (space_id);

CREATE TABLE ai.prompt_templates (
  id         UUID PRIMARY KEY DEFAULT uuidv7(),
  name       VARCHAR(100) NOT NULL,
  content    TEXT NOT NULL,
  status     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_prompt_templates_name ON ai.prompt_templates (name) WHERE deleted_at IS NULL;

-- =====================================================================
-- TRIGGERS updated_at (uno por tabla)
-- =====================================================================
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT DISTINCT table_schema, table_name
    FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema IN ('security', 'main', 'ai')
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t.table_schema, t.table_name
    );
  END LOOP;
END $$;
