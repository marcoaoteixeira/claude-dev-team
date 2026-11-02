---
name: web-compliance
description: Legal and data-handling defaults for a web product with real end users — privacy policy and terms of service, cookie/consent banner, data retention, and data access/deletion requests. Use when starting frontend work on a new web product, or when a change adds/changes data collection, tracking, third-party scripts, or anything touching personal data. Not legal advice — surface the gap and the decision; wording and jurisdiction specifics belong to the user or legal counsel.
---

# Web Compliance

Defaults so a web product doesn't ship data collection without the basic
legal and data-handling scaffolding around it. Raised as findings/backlog
items and `NEEDS-DECISION`s, never as silently-authored legal text.

## 0. Scope and precedence

- Applies to web frontends with real end users — not admin tools, internal
  dashboards, or prototypes with no real user data. `software-architect`,
  `ux-specialist` and `frontend-developer-angular` judge whether a given
  project is in scope and say so in their report.
- **Not legal advice.** Flag the gap and propose standard structure/copy;
  final wording, jurisdiction (GDPR/CCPA/etc.) and sign-off belong to the
  user or legal counsel. The project's own existing policy/legal docs win
  over anything suggested here.

## 1. Starting a new web product

- A Privacy Policy and Terms of Service page (even a short first draft)
  should exist before the product collects real user data. If missing,
  raise it — don't ship data collection ahead of them.
- A cookie/consent banner should gate any non-essential cookie or tracking
  script (analytics, ads, session replay) before it runs. Strictly
  essential cookies (auth session) don't need consent, but still belong in
  the privacy policy's description of what's collected.

## 2. When a change touches data collection

A ticket that adds or changes a form field collecting personal data, an
analytics/tracking event, a third-party script, or a data export/
integration — check:

- Does the existing Privacy Policy still accurately describe what's
  collected and why? If not, name the specific addition needed — don't
  rewrite the whole document unasked.
- Does it introduce a new third-party data recipient (analytics vendor,
  ad network)? Note it as a decision for the user, not an implementation
  detail to just wire up.

## 3. Data retention

- Favor designs where personal data has one clear owner and a known
  deletion path from day one — avoid duplicating PII across tables/services
  without a plan to delete every copy.
- Any store holding personal data needs an explicit retention answer (how
  long, how it's purged). If the project has none, say so rather than
  assuming indefinite retention is fine.
- Prefer building deletion/anonymization as code (a service call, admin
  action, or scheduled job) over a manual runbook, so it can actually be
  exercised on request.

## 4. Data access and deletion requests

- A user with an account should be able to see what personal data is held
  about them and request its deletion — self-serve where feasible, a
  tracked support flow otherwise. If account/profile work doesn't support
  this yet, flag it as a backlog item rather than silently skipping it.
- A deletion request should cascade to every place that personal data is
  copied (caches, logs, analytics, backups where feasible) — and where it
  genuinely can't reach (e.g. backups on a retention schedule), say so
  rather than implying full erasure happened.
