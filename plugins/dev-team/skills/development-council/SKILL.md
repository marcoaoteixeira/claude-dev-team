---
name: development-council
description: Run a structured multi-perspective deliberation (divergence, anonymous cross-review, chairman synthesis) for a major, hard-to-reverse .NET architecture decision. Manual only — reserve for big calls, not routine design checks.
argument-hint: [the architecture question or decision to deliberate]
disable-model-invocation: true
allowed-tools: Task
effort: high
---

# Development Council

Reserve this for genuinely consequential, expensive-to-reverse decisions —
splitting a service, choosing a consistency model, sync vs. async messaging
at a critical boundary, a breaking change to a widely-consumed library's
public contract. For routine design checks, use the `software-architect`
agent directly instead — this costs roughly 9x the model calls of a single review.

The question under deliberation: $ARGUMENTS

Every voice below runs on the same model family, so there's no cross-vendor
diversity to lean on the way a true multi-model council would have.
Diversity here comes entirely from forcing genuinely different optimization
mandates per voice — don't let any of the four soften toward consensus; each
must argue its lens honestly, including where it disagrees with what the
others will likely say.

## Stage 1 — Divergence (parallel, independent)

Invoke the Task tool four times, launched together in a single message so
they run independently and in parallel. Use `subagent_type:
dev-team:software-architect` for each, with a prompt containing the question above
plus one distinct mandate:

1. **Performance & Scale** — optimize for throughput, latency, and growth.
   State plainly what this costs in complexity or delivery speed.
2. **Simplicity & Team Velocity** — optimize for the smallest, most
   maintainable solution the team can actually operate. State what
   performance/scale headroom this gives up.
3. **Data Integrity & Consistency** — optimize for correctness under
   failure and concurrent access. State the latency/availability cost.
4. **Operability & Resilience** — optimize for what's easiest to observe,
   debug, and recover in production. State the up-front design cost.

Each must independently produce: a clear recommendation, the reasoning for
it, and what it explicitly sacrifices. Do not let one voice see another's
output — that's what makes this divergence rather than a discussion.

## Stage 2 — Convergence (anonymous cross-review)

- Strip each proposal of its lens label. Relabel them Proposal A, B, C, D in
  an order that doesn't reveal which lens produced which.
- Invoke the Task tool four more times (together, in parallel),
  `subagent_type: dev-team:software-architect`, one per proposal. Each prompt
  contains only that one anonymized proposal plus the original question —
  not the lens that produced it, not the other three proposals. Ask: where
  does this proposal hold up, where does it break, what did it fail to
  account for?
- Collect the four critiques.

## Stage 3 — Synthesis (chairman)

Invoke the Task tool once more, `subagent_type: dev-team:software-architect`, with
a prompt containing: the original question, all four anonymized proposals,
and all four critiques. Ask it to produce the final recommendation — stating
explicitly what it kept from which proposal, what trade-off it's accepting,
and what it's overriding and why. It should synthesize, not just pick a favorite.

## Report

- Give the user only the final synthesis, plus a short map: which of the
  four lenses' concerns made it into the final call, and which were
  consciously overridden and why.
- Save this final synthesis (including the lens map) to
  `.claude/state/council/`. Name the file `<timestamp>-<slug>.md`, where
  `<timestamp>` is `YYYYMMDD-HHMMSS` (filename-safe, no colons) and
  `<slug>` is a short lowercase-with-dashes title reflecting what was
  actually deliberated — e.g. `20260817-153000-sync-vs-async-order-events.md`.
  Create the folder if it doesn't exist. This is a record of a decision
  the user already chose to run the full council for, so it's saved
  automatically — no separate confirmation needed.
