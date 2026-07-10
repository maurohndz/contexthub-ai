# Plan de implementación: carga de documentos, embeddings y almacenamiento de vectores

## Objetivo

Permitir subir documentos a un **espacio** (que pertenece a una **organización**), extraer su texto,
trocearlo en chunks, generar embeddings y almacenarlos en pgvector para búsqueda semántica.
El proveedor de embeddings debe ser intercambiable: **API de Gemini** o **modelos locales en Ollama**,
sin cambiar el esquema ni el código de negocio.

## Estado actual (ya existe)

- Schema Prisma con `ContextSource`, `ContextDocument`, `ContextChunk` y `Embedding` (`vector(768)`,
  columna `model_name`) en los schemas `main`/`ai`. Postgres 18 con pgvector ya corre en compose.
- Scaffold vacío en `apps/backend/src/contexts/knowledge-management/modules/documents/`
  (use-cases: upload/process/reprocess/delete sin implementar).
- Frontend: feature `sources` completa contra `mock-source-api.adapter.ts` (upload zone, lista, toggle).
- Redis en docker-compose (sin uso todavía) → sirve para la cola de procesamiento async.
- `requireAuth` + `OrganizationMembershipPort` para verificar pertenencia a la organización.

---

## Decisión clave: dimensión de vectores = 768

**Recomendación: mantener `vector(768)`** (ya está así en el schema). Es el punto de compatibilidad
entre proveedores cloud y locales:

| Modelo | Proveedor | Dimensión nativa | ¿Compatible con 768? |
|---|---|---|---|
| `text-embedding-004` | Gemini API | 768 | ✅ nativa |
| `gemini-embedding-001` | Gemini API | 3072 (Matryoshka) | ✅ truncando a 768 + renormalizar |
| `nomic-embed-text` | Ollama | 768 (Matryoshka) | ✅ nativa |
| `bge-base-en-v1.5` / `bge-m3` (base) | Ollama | 768 / 1024 | ✅ / ❌ |
| `mxbai-embed-large` | Ollama | 1024 | ❌ |
| `all-minilm` | Ollama | 384 | ❌ (padding degrada calidad) |

Por qué 768 y no más:

- **1536/3072** excluye a casi todos los modelos locales y duplica/cuadruplica almacenamiento
  y el costo del índice HNSW.
- **384** pierde demasiada calidad de recuperación.
- Los modelos Matryoshka (gemini-embedding-001, nomic) están entrenados para truncarse con pérdida
  mínima: se corta el vector a 768 y se **renormaliza L2** antes de guardar.

**Regla dura**: los vectores de modelos distintos viven en espacios vectoriales distintos —
**nunca se mezclan en una misma búsqueda**. Cada fila de `ai.embeddings` guarda `model_name`;
la búsqueda semántica siempre filtra `WHERE model_name = <modelo activo>`. Si se cambia de
proveedor, se re-embebe (use-case `reprocess-document`).

---

## Fase 1 — Docker Compose: servicio de embeddings (Ollama)

`docker-compose.yml`:

```yaml
  ollama:
    image: ollama/ollama:latest
    ports:
      - '${OLLAMA_PORT:-11434}:11434'
    volumes:
      - ollama_models:/root/.ollama   # los modelos pesan GB; persistirlos

volumes:
  ollama_models:
```

- Descarga inicial del modelo (una vez): `docker compose exec ollama ollama pull nomic-embed-text`.
  Documentarlo en README; opcionalmente un servicio `ollama-init` one-shot que hace el pull.
- El backend le pega a `http://ollama:11434` (en compose) o `http://localhost:11434` (dev local).

Variables de entorno nuevas (backend, `environments/.env.local` + `env.ts`):

```
EMBEDDING_PROVIDER=ollama          # ollama | gemini
EMBEDDING_MODEL=nomic-embed-text   # o text-embedding-004 / gemini-embedding-001
EMBEDDING_DIM=768
OLLAMA_BASE_URL=http://localhost:11434
GEMINI_API_KEY=                    # solo si provider=gemini
UPLOADS_DIR=./storage/uploads
```

## Fase 2 — Migración SQL

Nueva migración (aditiva, no toca lo existente):

1. **Estado de procesamiento** en `main.context_documents`:
   ```sql
   CREATE TYPE main.document_processing_status AS ENUM ('pending','processing','ready','error');
   ALTER TABLE main.context_documents
     ADD COLUMN processing_status main.document_processing_status NOT NULL DEFAULT 'pending',
     ADD COLUMN processing_error text;
   ```
2. **Índice HNSW** para similitud coseno (si no quedó creado en la migración init):
   ```sql
   CREATE INDEX IF NOT EXISTS embeddings_embedding_hnsw_idx
     ON ai.embeddings USING hnsw (embedding vector_cosine_ops);
   ```
3. Índice `ai.embeddings (space_id, model_name)` para el filtro de búsqueda.

## Fase 2b — Migración: esquema `parameters` (catálogos) + clasificación de documentos

Cada archivo debe tener una **clasificación**. Se introduce un esquema nuevo de catálogos
(`parameters`) con el patrón catálogo → ítems, ambos identificados por un **`code`** estable
(el código es el contrato con el código de aplicación; el `name` es editable para UI).

**Migración nueva** (aditiva, no toca las existentes):

```sql
CREATE SCHEMA IF NOT EXISTS parameters;

-- Cabecera de catálogo (ej: DOCUMENT_CLASSIFICATION, futuro: LANGUAGES, etc.)
CREATE TABLE parameters.catalogs (
  id          UUID PRIMARY KEY DEFAULT uuidv7(),
  code        VARCHAR(60) NOT NULL,          -- estable, MAYUS_SNAKE
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  status      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_catalogs_code ON parameters.catalogs (code) WHERE deleted_at IS NULL;

-- Ítems del catálogo (las clasificaciones concretas)
CREATE TABLE parameters.catalog_items (
  id          UUID PRIMARY KEY DEFAULT uuidv7(),
  catalog_id  UUID NOT NULL REFERENCES parameters.catalogs (id),
  code        VARCHAR(60) NOT NULL,          -- único dentro del catálogo
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_catalog_items_catalog_code
  ON parameters.catalog_items (catalog_id, code) WHERE deleted_at IS NULL;
CREATE INDEX idx_catalog_items_catalog_id ON parameters.catalog_items (catalog_id);

-- FK de clasificación en los documentos
ALTER TABLE main.context_documents
  ADD COLUMN classification_id UUID REFERENCES parameters.catalog_items (id);
CREATE INDEX idx_context_documents_classification_id
  ON main.context_documents (classification_id);

-- Triggers updated_at para las tablas nuevas (mismo patrón del init,
-- extendiendo el loop al schema 'parameters')
```

**Seed en la misma migración** — catálogo `DOCUMENT_CLASSIFICATION` con ítems iniciales:

| code | name |
|---|---|
| `CONTRACT` | Contrato |
| `INVOICE` | Factura |
| `REPORT` | Informe |
| `MANUAL` | Manual / documentación |
| `POLICY` | Política / normativa |
| `PRESENTATION` | Presentación |
| `MEETING_NOTES` | Minuta / notas de reunión |
| `OTHER` | Otro |

Impactos en el resto del plan:

- **Prisma**: agregar `"parameters"` al array `schemas` del datasource; modelos `Catalog` y
  `CatalogItem` (`@@schema("parameters")`); `ContextDocument.classificationId` opcional.
- **Backend**: endpoint de solo lectura `GET /api/catalogs/:code/items` (con `requireAuth`)
  para poblar selects del frontend; el upload (Fase 7) acepta `classificationCode` en el
  multipart y lo resuelve a `classification_id` (400 si el code no existe en el catálogo).
- **Shared types**: `CatalogItemDto { code, name }`; `DocumentDto` incluye `classification`.
- **Frontend** (Fase 8): select de clasificación en `SourceUploadZone` (obligatorio antes de
  subir) y badge de la clasificación en `SourceListItem`.

## Fase 3 — Backend: puerto de embeddings + adapters

Arquitectura hexagonal, igual que organizations/spaces:

```
modules/documents/
  ports/embedding-provider.port.ts
  infra/ollama-embedding.adapter.ts
  infra/gemini-embedding.adapter.ts
```

Puerto:

```ts
export interface EmbeddingProviderPort {
  readonly modelName: string;      // se persiste en ai.embeddings.model_name
  readonly dimensions: number;     // debe ser 768
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

- **OllamaEmbeddingAdapter**: `POST {OLLAMA_BASE_URL}/api/embed` con `{ model, input: string[] }`
  (soporta batch nativo).
- **GeminiEmbeddingAdapter**: `POST .../v1beta/models/{model}:batchEmbedContents`. Para
  `gemini-embedding-001` pasar `outputDimensionality: 768` y renormalizar L2.
- Ambos validan `vector.length === 768` y lanzan error claro si no coincide (evita corromper la tabla).
- El `container.ts` elige adapter según `EMBEDDING_PROVIDER`.

## Fase 4 — Backend: extracción de texto y chunking

```
modules/documents/
  domain/document.ts           # tipos, errores (UnsupportedFileTypeError, etc.)
  infra/text-extractor.ts
  infra/chunker.ts
```

- **Extracción por MIME type**:
  - `application/pdf` → `pdf-parse`
  - `.docx` → `mammoth`
  - `text/plain`, `text/markdown`, `text/csv` → lectura directa (UTF-8)
  - Otro → 415 `UnsupportedFileTypeError`
- **Chunking**: por caracteres aproximando tokens (~4 chars/token):
  - Tamaño objetivo **~500 tokens (≈2000 chars)**, solapamiento **~80 tokens (≈320 chars)**.
  - Cortes preferentes en límites de párrafo/oración (split por `\n\n`, luego `. `).
  - Guarda `chunk_index` y `token_count` estimado en `main.context_chunks`.
- **Archivos**: se guardan en disco local `UPLOADS_DIR/<orgId>/<spaceId>/<documentId>.<ext>`
  (`file_path` ya existe en el schema). En compose, volumen `backend_uploads`. Límite 20 MB vía multer.

## Fase 5 — Backend: repositorios y use-cases

```
modules/documents/
  ports/document-repository.port.ts
  ports/embedding-repository.port.ts
  infra/prisma-document.repository.ts
  infra/prisma-embedding.repository.ts
  use-cases/upload-document/    # crea source+document (pending), guarda archivo, encola job
  use-cases/process-document/   # extrae → chunkea → embebe → inserta vectores → ready/error
  use-cases/list-documents/     # lista por espacio con processing_status
  use-cases/delete-document/    # soft delete de document + chunks + embeddings, borra archivo
  use-cases/reprocess-document/ # borra chunks/embeddings viejos y reprocesa (cambio de modelo)
```

Puntos críticos:

- **Aislamiento multi-tenant**: todo use-case recibe `userId` + `organizationId` + `spaceId`;
  primero `membership.isMember(userId, orgId)` (403 si no) y luego verifica que el espacio
  pertenezca a esa organización (404 si no). Mismo patrón que spaces.
- **Inserción de vectores**: Prisma no soporta `vector` → `$executeRaw` con cast:
  ```sql
  INSERT INTO ai.embeddings (chunk_id, space_id, embedding, model_name)
  VALUES ($1, $2, $3::vector, $4)
  ```
  (el vector se serializa como `'[0.1,0.2,...]'`). Batch con `unnest` o multi-values.
- **Transaccionalidad**: chunks + embeddings de un documento se insertan en una transacción;
  si el embedding falla a mitad, el documento queda `error` con `processing_error` y sin datos parciales.

## Fase 6 — Procesamiento asíncrono (BullMQ + Redis)

El embedding de un PDF grande tarda; no puede bloquear el request de upload.

- Cola `document-processing` con **BullMQ** sobre el Redis existente.
- `upload-document` responde `201` inmediato con el documento en `pending` y encola `{ documentId }`.
- Worker (mismo proceso backend al inicio, extraíble a proceso aparte después) ejecuta
  `ProcessDocumentUseCase`: `processing` → extrae/chunkea/embebe → `ready` | `error`.
- Reintentos: 2 con backoff exponencial; al agotarse marca `error`.
- Nueva env: `REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379`.

## Fase 6b — Notificaciones en tiempo real: SSE + Redis (sin polling)

El frontend **no hace polling**: el backend le avisa por **Server-Sent Events** cuándo volver a
hacer GET. El evento es solo una señal de invalidación (tipo + ids), nunca lleva los datos —
el front siempre refetchea por la API normal (así la autorización vive en un solo lugar).

### Backend

```
infrastructure/
  realtime/
    sse-connection-registry.ts   # registro de conexiones en Redis
    redis-event-bus.ts           # pub/sub de eventos por usuario
    events.routes.ts             # GET /api/events (SSE)
```

- **Canal SSE**: `GET /api/events` con `requireAuth` (la cookie de sesión viaja igual que en
  cualquier fetch con credentials). Headers: `Content-Type: text/event-stream`,
  `Cache-Control: no-cache`, `X-Accel-Buffering: no`. Heartbeat (`: ping\n\n`) cada 25 s para
  que proxies no corten la conexión.
- **Registro en Redis al abrir el canal** (el login del usuario dispara la apertura desde el
  front; ver más abajo):
  - `SADD sse:user:{userId} {instanceId}:{connectionId}` + `EXPIRE` renovado por heartbeat.
  - En `req.on('close')`: `SREM` y limpieza. Sirve para saber qué usuarios están conectados
    y en qué instancia del backend (escala horizontal).
- **Bus de eventos (Redis Pub/Sub)**: cada instancia del backend mantiene UN subscriber
  ioredis suscrito a `events:user:*` (psubscribe). Cuando llega un mensaje de un usuario que
  tiene conexiones SSE locales, lo reenvía por esos sockets.
- **Emisión**: el worker de BullMQ (Fase 6), al cambiar el estado de un documento, publica:
  ```json
  PUBLISH events:user:{userId}  { "type": "document.updated",
                                  "organizationId": "...", "spaceId": "...",
                                  "documentId": "...", "status": "ready" }
  ```
  Se emite en cada transición relevante: `processing`, `ready`, `error`.
  (A futuro, el mismo bus sirve para invitaciones a organizaciones, etc.)
- **Contrato de eventos** en `packages/shared-types`: `RealtimeEventDto` discriminado por
  `type` (`document.updated` por ahora).

### Frontend

- Al **iniciar sesión** (o al restaurar sesión en el arranque con `/me` OK), el auth store
  abre el canal: `new EventSource(API_URL + '/api/events', { withCredentials: true })`.
  Un solo EventSource por sesión, vive en un módulo `lib/realtime.ts` con API
  `subscribe(type, handler)`.
- `use-sources.ts` se suscribe a `document.updated`: si `spaceId` coincide con el espacio
  activo → vuelve a hacer `GET .../documents` (refetch). Nada de intervals.
- **Logout**: se cierra el EventSource antes de `POST /logout` (el backend limpia el registro
  en Redis con el `close`).
- **Reconexión**: EventSource reconecta solo (backoff nativo del browser). Al evento `open`
  tras una reconexión se hace un refetch de seguridad (pudo perderse un evento mientras
  estaba caído el canal).

## Fase 7 — Rutas HTTP

```
POST   /api/organizations/:orgId/spaces/:spaceId/documents      (multipart, campo "file")
GET    /api/organizations/:orgId/spaces/:spaceId/documents      (lista + processing_status)
DELETE /api/organizations/:orgId/spaces/:spaceId/documents/:id
POST   /api/organizations/:orgId/spaces/:spaceId/documents/:id/reprocess
```

- Todas con `requireAuth` + verificación de membresía (403) y de que el espacio ∈ organización (404).
- `multer` con límite 20 MB y whitelist de MIME types (413 / 415 en errores).
- DTOs nuevos en `packages/shared-types`: `DocumentDto` (incluye `processingStatus`), `SourceDto`.

## Fase 8 — Frontend: reemplazar mock de sources

Mismo patrón que organizations/projects:

- `features/sources/infra/http-source-api.adapter.ts` reemplaza al mock:
  - `list(orgId, spaceId)`, `upload(orgId, spaceId, file)` con `FormData` (sin `Content-Type` manual),
    `remove(...)`, `reprocess(...)` — todos con `credentials: 'include'`.
- `SourceUploadZone` sube el archivo real y agrega el documento en estado `pending`.
- **Estado en tiempo real vía SSE** (Fase 6b): `use-sources.ts` se suscribe a
  `document.updated` y refetchea la lista cuando el evento corresponde al espacio activo.
  Sin polling.
- `SourceListItem`: badge de estado (Procesando… / Listo / Error con tooltip del mensaje).
- Actualizar `docCount` del proyecto activo cuando un documento pasa a `ready`.

## Fase 9 — Búsqueda semántica (deja lista la base, endpoint mínimo)

```
POST /api/organizations/:orgId/spaces/:spaceId/search   { query: string, limit?: number }
```

- Embebe el query con el **mismo proveedor activo** y ejecuta:
  ```sql
  SELECT c.content, c.chunk_index, d.file_name, 1 - (e.embedding <=> $1::vector) AS score
  FROM ai.embeddings e
  JOIN main.context_chunks c ON c.id = e.chunk_id
  WHERE e.space_id = $2 AND e.model_name = $3 AND e.deleted_at IS NULL
  ORDER BY e.embedding <=> $1::vector
  LIMIT $4
  ```
- Es la pieza que después consume el chat (RAG).

## Fase 10 — Tests y verificación

- **Unitarios** (con fakes, como los existentes):
  - Chunker: tamaños, solapamiento, textos cortos, cortes en párrafos.
  - `UploadDocumentUseCase`: 403 si no es miembro, 404 si el espacio no es de la org, 415 MIME inválido.
  - `ProcessDocumentUseCase`: happy path con `FakeEmbeddingProvider` (vectores dim 768),
    error del provider → estado `error`, validación de dimensión ≠ 768.
- **E2E manual**: subir PDF como usuario A en su espacio; verificar chunks+vectores en DB
  (`SELECT count(*) FROM ai.embeddings`); usuario B recibe 403 sobre ese espacio; búsqueda
  devuelve chunks relevantes; cambiar `EMBEDDING_PROVIDER` y reprocesar.

## Orden de ejecución

1. Fase 1 (compose + env), Fase 2 (migración de procesamiento) y Fase 2b (esquema
   `parameters` + clasificación) — desbloquean todo lo demás.
2. Fase 3 (adapters de embedding) + Fase 4 (extractor/chunker) — testeables aislados.
3. Fase 5 (use-cases/repos) + Fase 6 (cola) + Fase 6b (SSE + Redis) + Fase 7 (rutas).
4. Fase 8 (frontend) + Fase 9 (search) + Fase 10 (tests/E2E).

## Dependencias nuevas

- Backend: `multer`, `pdf-parse`, `mammoth`, `bullmq`, `ioredis`.
- Frontend: ninguna (fetch + FormData nativos).
