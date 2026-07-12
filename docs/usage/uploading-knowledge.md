# Uploading Knowledge

Everything Ágora can answer comes from what you load. This guide covers
the sources page and the processing lifecycle.

## Supported sources

| | |
|---|---|
| Formats | PDF, DOCX, TXT, MD, CSV, JSON |
| Max size | 20 MB per file |
| Classification | Required — pick from the catalog (e.g. *Contrato*, *Política / normativa*) |

Reach the page from the project menu (⋮) → **Ver fuentes**. Drag a file
into the drop zone (or browse), choose the classification, and click
**Subir fuente**.

## What happens after upload

Processing is asynchronous — the upload returns immediately and the
document row updates in real time:

1. **Text extraction** from the file.
2. **Chunking** into searchable fragments.
3. **Embedding** each fragment (locally via Ollama by default).

| Status | Meaning |
|---|---|
| Processing | The pipeline is running |
| Processed | The document is searchable and citable |
| Error | Something failed — the error is shown under the row |

## Managing sources

- **Reprocess** (↻) — re-runs the pipeline for a source; useful after an
  error or an embedding-provider change. Fragments are rebuilt from
  scratch.
- **Delete** (🗑) — removes the source and all its derived fragments from
  search.

The project's document count (right sidebar) updates automatically as
documents finish processing.

## What makes a good knowledge source

- Text-based files: image-only/scanned PDFs yield no extractable text.
  <!-- TODO: OCR support is not currently implemented; document if/when it lands. -->
- Self-contained documents (manuals, minutes, rule sets) ground better
  answers than fragmentary notes.
- Keep sources current: Ágora answers from what is loaded — an outdated
  manual produces confidently outdated answers, with citations to match.
