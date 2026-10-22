---
name: adr-writer
description: Draft (and, once confirmed, create) an Architecture Decision Record for an already-made architecture decision that qualifies for one — a structural framework change, an external API integration, or a database mutation; never for local fixes, styling or routine features — after a software-architect review, a development-council synthesis, or any discussion where a real trade-off was decided. Matches the project's existing ADR template, numbering, and folder convention.
---

# Role

Turn an architecture decision that's already been made — through a
`software-architect` review, a `development-council` synthesis, or a plain
discussion — into a properly recorded ADR. You document a decision that was
made; you don't make the decision yourself.

# When to Write an ADR

ADRs are rare. Write one **only** when the decision falls into one of
these categories:

- **Structural framework change** — adopting, replacing or upgrading a
  framework or core library, or changing the solution/module structure,
  layering or communication style.
- **External API integration** — integrating a new third-party or
  cross-team API/service, or changing how an existing one is consumed
  (auth, versioning, sync vs async).
- **Database mutation** — schema or data-model changes, migrations that
  reshape existing data, or a change of storage technology.

Everything else gets **no ADR**, even if it is new or non-trivial: local
logic fixes, bug fixes, refactors inside a component, styling and UI
tweaks, and routine feature additions (new endpoint, component or field
that follows existing patterns). When in doubt, don't write one.

If you are asked to record a decision outside these categories, say it
doesn't qualify and why, and ask the user to confirm before drafting
anyway.

These rules are shared with step 8 of
`${CLAUDE_PLUGIN_ROOT}/agents/software-architect.md` — keep both in sync.

# Gathering Context

- Prefer what's already in the conversation: the question that prompted the
  decision, the alternatives that were considered and why they were
  rejected, and the actual trade-off accepted. An ADR without alternatives
  considered doesn't explain much — dig for them rather than skipping that
  section.
- If invoked cold, ask for what's missing rather than inventing it: what
  was decided, what else was considered, what does this decision cost.
- Confirm the decision is actually final, not still being debated. If it's
  still open, the status should be "Proposed," not "Accepted" — don't
  silently upgrade a discussion to a settled decision.
- Confirm the decision earns an ADR. It must serve a concrete requirement
  (a ticket, acceptance criterion or business objective) and there must be
  a reason it has to be decided now. If it serves no requirement, or
  nothing forces it yet, say so and don't write the ADR.

# Matching the Project's Convention

- Location: resolve it with `${CLAUDE_PLUGIN_ROOT}/skills/delivery-conventions/SKILL.md` §5
  (declared by the project → existing ADR folder → `<docs root>/adr/` →
  `documentation/adr/`). Default naming for a new series:
  `ADR-<number>-<Title-In-Dashes>.md` — a zero-padded, sequential number
  (`ADR-001-`, `ADR-002-`, ...) followed by the title in Title Case with
  spaces replaced by dashes, e.g. `ADR-001-Database-Usage.md`.
- Before assuming that default, check whether the repo already has ADRs
  somewhere else — `docs/adr/`, `docs/decisions/`,
  `doc/architecture/decisions/`, or `.adr/` are other common locations —
  and read one or two of them. If the project already has an established
  ADR series in a different location or with different naming, don't
  fragment its history by starting a second series; follow the convention
  that's already there and say so. Only fall back to the default location
  and naming when no existing series is found.
- Determine the next number from the highest existing one in whichever
  location is actually in use. Don't renumber or "fix" any gaps or
  irregularities you find — just note them if they look like a real problem.
- Use the MADR-based template below unless the project's existing ADRs
  already use a different one — then follow theirs and apply the Drafting
  rules to its equivalent sections.

# Template

````markdown
# [The decision, e.g. Use PostgreSQL for the Orders service]

* **Status:** [Proposed | Accepted | Rejected | Deprecated | Superseded by [ADR-005](ADR-005-Title-In-Dashes.md)]
* **Group:** [Framework | Integration | Data]
* **Deciders:** [List the people involved in making the decision]
* **Date:** [YYYY-MM-DD]

## Context and Problem Statement

[Describe the context and problem statement. What is the force/issue that is motivating this decision? Keep it to 2-3 sentences.]

**Assumptions:**

* [Assumption 1, e.g., Peak load stays under 500 requests/s]
* [Assumption 2, e.g., The team keeps two engineers on this service]

## Decision Drivers

* [Driver 1, e.g., Low latency requirement < 50ms]
* [Driver 2, e.g., Team familiarity with PostgreSQL]
* [Driver 3, e.g., Budget constraints]

## Considered Options

* **Option 1:** [Description of option 1]
  * Pros: [list pros]
  * Cons: [list cons]
* **Option 2:** [Description of option 2]
  * Pros: [list pros]
  * Cons: [list cons]
  * Rejected because: [specific reason]

## Decision Outcome

**Chosen option:** "[Option X]", because [state the primary rationale for selection, linking back to the decision drivers].

### Consequences

* **Good:** [Positive side effect or benefit]
* **Good:** [Another positive side effect]
* **Bad:** [Negative side effect, technical debt, or risk introduced]
* **Bad:** [Another negative side effect]
* **Constraint:** [Rule future work must now follow]
* **Follow-up:** [Decision, requirement change, scope/schedule impact or training this forces]

## Related

* **Requirement:** [Ticket / acceptance criteria / objective this serves]
* **Decisions:** [ADRs this supersedes or relates to]
* **Artifacts:** [Plan, spec or API contract this affects]
````

# Drafting

- **Title**: the decision itself, not the problem (e.g. "Use PostgreSQL
  for the Orders service," not "Database choice for Orders").
- **Status**: Proposed / Accepted / Rejected / Deprecated / Superseded —
  match the project's existing vocabulary.
- **Group**: one of `Framework` (structural framework change),
  `Integration` (external API integration) or `Data` (database mutation)
  — the categories that qualify a decision for an ADR. Used to filter the
  index.
- **Deciders**: the people who made the decision, taken from the
  conversation or the ticket — never invented. When the
  `software-architect` writes the ADR, list the ticket assignee or the
  user who delegated the design; if nobody can be named, write
  `TBD — confirm in PR review`.
- **Context and Problem Statement**: the situation and constraints that
  made a decision necessary — specific to this case, not generic. It must
  answer "why now": what changed or what is blocked if this isn't decided.
  Then list the **assumptions** the decision rests on — expected load,
  budget, team skills, timeline, technology standards. These are the
  revisit triggers: if an assumption stops being true, the ADR is due for
  review.
- **Decision Drivers**: the requirements and forces the options are judged
  against. Each driver should be checkable, not a slogan.
- **Considered Options**: what else was on the table and why it lost —
  this is the part most often skipped and most valuable later. Include
  options other people raised, even weak ones, so no reviewer has to ask
  "did you think about X?". Give each rejected option a specific
  `Rejected because:` line. If someone disagreed with the outcome, name
  the dissenting view.
- **Decision Outcome**: the chosen option, stated plainly, followed by the
  argument: why it won, weighed against implementation cost, total cost of
  ownership, time to market, and whether the team has the skills and
  people to deliver and run it. "X is better" is not an argument; tie each
  reason to a Decision Driver.
- **Consequences**: what gets easier (`Good`) and what gets harder
  (`Bad`) — both, not just the upside. A decision with no real cost is
  suspicious. Also state:
  - **Constraint** — rules future work must now follow (e.g. "every new
    integration goes through the gateway"). Reviewers and the
    `software-architect` check later designs against these.
  - **Follow-up** — decisions this one forces, new or changed
    requirements, scope or schedule impact, training needs. Phrase each
    so it can become a follow-up ticket.
- **Related**: the ticket / acceptance criteria / objective this decision
  serves (required — see Gathering Context), any ADR this supersedes or
  relates to, and the plan, spec or API contract it affects.

# Superseding an Existing ADR

If this decision replaces an earlier one, say so explicitly and:

- Link to it from the new ADR's Related section.
- Propose updating the old ADR's Status line to "Superseded by [ADR-<number>](<new ADR file>)" —
  but confirm with the user before editing a historical record, and change
  only the status line, not the original content.

# Creating It

- Exception: the `software-architect` agent in design mode writes ADRs
  directly — the user delegated that decision to it. It uses this skill's
  template and naming, never edits an existing ADR, and reports each ADR
  it wrote.
- Default to showing the fully drafted ADR content for review.
- Only write the file once the user confirms it (or clearly asked you to
  create it outright) — this becomes a permanent, numbered part of the
  project's history, not something to add speculatively.
- Write it to whichever location and naming pattern was determined in
  Matching the Project's Convention above — `<adr folder>/ADR-<number>-<Title-In-Dashes>.md`
  by default, or the project's own existing location/pattern if one
  already exists. Create the folder if it doesn't exist.
