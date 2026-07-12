# Security Policy

Ágora is self-hosted software that manages sensitive organizational
knowledge. We take vulnerability reports seriously and appreciate
responsible disclosure.

## Supported versions

Ágora is pre-1.0; only the latest state of the `main` branch receives
security fixes.

| Version | Supported |
|---|---|
| `main` (latest) | ✅ |
| older commits | ❌ |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub
issues.**

Instead, use one of these private channels:

1. **GitHub private vulnerability reporting** (preferred):
   [Report a vulnerability](https://github.com/maurohndz/contexthub-ai/security/advisories/new)
2. **Email:** maurodevelopia@gmail.com — include "SECURITY" in the subject.

Include as much of the following as you can:

- Type of issue and affected component (e.g. auth, multi-tenant
  isolation, credential encryption, document pipeline)
- Steps to reproduce or proof of concept
- Impact assessment: what an attacker could reach (other tenants' data,
  stored AI credentials, other users' conversations)

## What to expect

- Acknowledgement of your report within **7 days**.
- We will keep you informed of progress and credit you in the fix's
  release notes unless you prefer otherwise.
- Please give us reasonable time to ship a fix before public disclosure.

## Scope notes for self-hosters

Ágora's threat model assumes the operator controls the infrastructure.
Misconfigured deployments (exposed Postgres/Redis/Ollama ports, missing
TLS, default passwords) are deployment issues, not vulnerabilities — see
the hardening checklist in
[docs/deployment/security-and-privacy.md](docs/deployment/security-and-privacy.md).
