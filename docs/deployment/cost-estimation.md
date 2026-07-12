# Cost Estimation

What running Ágora actually costs, by component. Ágora's design goal is
that the **fully local path costs nothing beyond the hardware you already
control**.

> 🔗 This document is partially blocked by roadmap Phase 2 (the
> transactional email service) and Phase 1 (local LLM generation). Blocked
> sections are marked `TODO`.

## Cost components

| Component | Free path | Paid path |
|---|---|---|
| Hosting | Your own machine / homelab | VPS or cloud instance |
| Database & queue | Postgres + Redis in Docker (included) | Managed Postgres/Redis |
| Embeddings | **Ollama, local — $0** (default) | Gemini embeddings API |
| Chat generation (LLM) | *(Phase 1: Ollama local)* | Google Gemini pay-per-token |
| Transactional email | — | *(introduced in Phase 2)* |

## Hosting

Self-hosting baseline: one machine running Docker with Postgres, Redis,
Ollama, the API, and the web app.

- Minimum for small teams: 2 vCPU / 4 GB RAM plus disk for documents and
  the Ollama model volume (embedding model ≈ 300 MB; chat models, when
  Phase 1 lands, run into several GB).
- Local embeddings are CPU-friendly with `nomic-embed-text`; no GPU is
  required for the current feature set.

<!-- TODO(phase-4): validated sizing table (users × documents → CPU/RAM/disk)
     based on real deployments. -->

## AI provider costs

- **Embeddings via Ollama (default):** $0 — runs on your infrastructure.
- **Chat via Gemini:** billed per token by Google, per organization key.
  Cost scales with questions asked, retrieved context (5 fragments per
  question), and history (12 messages). Model choice matters: Flash Lite
  (cheapest) vs Flash vs Pro.
  <!-- TODO: add a worked example (questions/month → estimated cost) with
       current Gemini pricing at time of writing; prices change, link to
       https://ai.google.dev/pricing instead of hardcoding. -->
- **Chat via Ollama (Phase 1):** $0 marginal cost; the trade-off moves to
  hardware (RAM/GPU for the chosen model).

## Transactional email (Phase 2 dependency)

Email verification and invitations introduce a transactional email
service.

<!-- TODO(phase-2): once the email service is chosen, document its free
     tier and per-email pricing here. -->

## Rule of thumb

- **Evaluation / small team, privacy-first:** self-host with Ollama
  embeddings — the only real cost is the machine. Chat requires a Gemini
  key today (its free tier may be enough to evaluate).
- **Cloud-assisted:** small VPS + Gemini Flash Lite keeps monthly costs
  dominated by LLM usage, which you control per organization key.
