---
name: delivery-conventions
description: Shared delivery rules for the developer agents and development-pipeline — branch naming, Conventional Commits, CHANGELOG (Keep a Changelog), README and developer-guide upkeep, and where plans/specs/ADRs/UX documents are stored. Use when creating a branch, writing a commit message, finishing a ticket, or deciding where a plan, spec, ADR or UX document goes. The project's own rules (CLAUDE.md, README, commitlint config, existing folders) always win over these defaults.
---

# Delivery Conventions

Defaults for how work is delivered. They exist so every agent delivers the
same way — not to override a project that already decided.

## 0. Precedence — read the project first

Before applying anything below, look for the project's own rules and follow
them where they differ or add to these:

- `CLAUDE.md` / `AGENTS.md` (repo root and the app folder you work in),
  `README.md`, `CONTRIBUTING.md` — workflow, branch names, commit extras,
  doc locations, PR rules, "files never to modify" lists.
- Commit tooling: `commitlint.config.*`, `.husky/`, `.gitmessage`, server
  hooks mentioned in docs.
- Existing structure: recent branch names (`git branch -r --sort=-committerdate | head`),
  recent commits (`git log --oneline -20`), existing `CHANGELOG*`, docs folders.

**Human-approval steps in the project's workflow** (e.g. "wait for approval
before creating the branch", "user review before commit"): when you run
interactively, follow them. When you run inside an automated pipeline, the
pipeline decides how those gates are handled — follow its instructions and
list every project gate you did not stop at in your final summary. Never
treat another agent's approval as the user's.

## 1. Branching

- Detect the default branch (`git symbolic-ref refs/remotes/origin/HEAD`);
  never assume `main`. Never commit to the default branch.
- Start from an up-to-date default branch: `git fetch`, then branch from
  `origin/<default>`. (In a worktree you cannot check out the default
  branch — branching from `origin/<default>` is the equivalent of the
  usual "switch to main and pull".)
- Name: `<kind>/<TICKET>-<slug>` unless the project defines another pattern.
  `kind` = `feature` | `fix` | `chore` | `refactor` | `docs`. `slug` =
  lowercase kebab-case, 2–5 words, from the ticket's outcome, no articles.
  Example: `feature/PROJ-123-export-orders-csv`.
- No ticket ID known and the work is more than trivial → ask (interactive)
  or stop and report (automated) — unless the project defines a
  placeholder for ticketless work (e.g. `PRO-000`); then use it. Never
  invent a real-looking ID.
- Uncommitted changes in the working tree when you start → do not branch
  over them, stash them or discard them. Ask or stop and report.

## 2. Commits — Conventional Commits

```
<type>(<TICKET>)[!]: <summary>

<description>
```

- **type** — one of: `feat` (new functionality, minor), `fix` (bug fix,
  patch), `refactor` (same behavior, patch), `perf` (performance, patch),
  `ci` (pipeline config, patch), `docs` (documentation only), `chore`
  (cleanup, no behavior change), `style` (formatting only), `test`
  (tests only). Nothing else.
- **TICKET** — the real Jira key, uppercase.
- **`!`** — the change breaks existing callers/consumers (forces a major
  bump). Add it whenever it applies, never speculatively.
- **summary** — imperative ("add", not "added"/"adds"), no negation ("stop
  sending X", not "don't send X"), no trailing period. Whole header 10–72
  characters.
- **description** — what changed and why, for a reader with none of
  today's context. Optional only when the summary says it all.
- **Trailers** — follow the project: if it forbids attribution trailers
  (e.g. `Co-authored-by`), leave them out even if your environment adds
  them by default.
- **Granularity** — one logical change per commit. In TDD, commit at green
  (test + implementation together); never commit a red build.
- **Validate every message** if the repo has commitlint — even when its
  hooks would not run for these files (hooks are often scoped to one app):
  from the folder holding the config, `echo "<message>" | <pm> exec commitlint`
  (`pnpm exec` / `npx --no-install` / `yarn`), or
  `node node_modules/@commitlint/cli/cli.js` when the package manager must
  not be used (it would try to install first). Fix until it passes.

Examples:
```
feat(PROJ-123): export the order list as csv
fix(PROJ-456): reuse the open draft instead of creating a second one
feat(PROJ-124)!: rename the user data endpoint
docs(PROJ-123): update changelog and readme for csv export
```

Reference: https://your-org.atlassian.net/wiki/spaces/eng/pages/334725272/Conventional+Commits

**Scope boundary:** commit locally. Pushing and opening a PR are separate
steps owned by the caller (development-pipeline / pr-writer).

## 3. CHANGELOG

Format: [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

- **Where** — an existing `CHANGELOG.md` wins. A monorepo with one per app:
  use the app's when the change stays inside one app, the root one when it
  spans several. None exists → create `CHANGELOG.md` at the repo root and
  say in your summary that you introduced it.
- **When** — once the ticket's work is done and verified (review and QA
  passed), not per commit. When work runs in parallel worktrees, only the
  final integration step writes the CHANGELOG, to avoid merge conflicts.
- **What** — one or a few lines per ticket, describing the outcome for a
  reader of the product (developer, tester, consumer), not the commit list.
  Link the ticket.
- **Never** assign a version number or release date: everything goes under
  `## [Unreleased]`; the release process moves it.
- Sections, in this order, only those that have entries: `Added`,
  `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Breaking changes
  are prefixed `**BREAKING:**`.
- Commit it with the ticket's last commit or as
  `docs(<TICKET>): update changelog`.

New file template:
```markdown
# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- <Outcome in one sentence.> ([PROJ-123](https://your-org.atlassian.net/browse/PROJ-123))
```

## 4. README and developer guides

- **Missing README** at the repo root → create a short one: what the
  project is, prerequisites, how to run it, how to test it, structure
  overview, links to docs (ADRs, plans). Facts only — read the code and
  build files, never guess commands. Create app-level READMEs only where
  the repo already has that pattern.
- **Update after a successful ticket** when the change affects anything a
  newcomer needs: setup steps, configuration/environment variables,
  commands/scripts, endpoints or public API, architecture overview, new
  external dependency or service. Otherwise leave it alone — the README is
  not a changelog.
- Edit the relevant section in the existing tone. If no section fits, add
  a short one where a reader would look for it.
- **Developer guides** the project relies on (`CLAUDE.md`, `AGENTS.md`,
  `docs/*.md`) follow the same rule when the change makes them wrong —
  unless the project lists them as files not to modify; then report the
  needed change instead.
- Stale content you notice outside the change: report it, don't fix it.

## 5. Where documents go — plans, specs, ADRs

Never scatter documents in the codebase. Resolve the location in this order:

1. **Declared by the project** (CLAUDE.md / README / ADR index) → use it,
   including its file-name pattern.
2. **Existing per-ticket folder** — the nearest one to the code you change
   (an app folder with its own docs wins over the repo root):
   - plans: `specs/plans`, `docs/plans`, `documentation/plans`, `plan/`, `plans/`
   - specs: `specs/features`, `docs/specs`, `documentation/specs`, `specs/`
   - ADRs: `docs/adr`, `documentation/adr`, `doc/architecture/decisions`, `docs/decisions`, `.adr`

   A folder only counts if it actually holds per-ticket documents (files
   named after tickets or features). A `plan/` holding one overview is not
   a plans folder.
3. **Nothing exists** → under the repo's existing docs root (`docs/` or
   `documentation/`, whichever exists) create `plans/`, `specs/`, `adr/`.
   No docs root at all → `documentation/plans/`, `documentation/specs/`,
   `documentation/adr/`.

- File name: `<TICKET>-<slug>.md`. When plans and specs share one folder,
  suffix them: `<TICKET>-<slug>-plan.md`, `<TICKET>-<slug>-spec.md`.
- ADRs follow the folder's numbering and naming exactly (`015-x.md`,
  `ADR-002-Title.md`, `0003-x.md`). Empty ADR folder with no declared
  pattern → `ADR-001-<Title-In-Dashes>.md` (adr-writer's template).
- If the folder has an index (`README.md` table, ADR list), add a row. If
  the project refers to an index that does not exist, do not create one —
  report it.
- If the location is git-ignored (`git check-ignore <path>`), that is the
  project's choice — write there, never force-add it, and mention it in
  your summary.

## 6. Where documents go — UX research, flows, specs and reviews

Same resolution order as §5, applied to `ux-specialist`'s output:

1. **Declared by the project** (CLAUDE.md / README) → use it.
2. **Existing UX docs folder** — the nearest one to the frontend code
   (`docs/ux/`, `documentation/ux/`, an app-level `ux/`) → use its layout.
3. **Nothing exists** → create under the repo's existing docs root
   (`docs/` or `documentation/`, whichever exists; neither exists →
   `documentation/`):
   ```
   <docs root>/ux/
     research/   # research plans, findings, personas, journey maps
     flows/      # user flows and task analyses
     specs/      # per-feature UX specs and component specs
     reviews/    # accessibility audits and design-QA reports
     decisions.md  # running log of UX decisions and rationale
   ```

- File name inside `specs/`, `flows/`, `research/`, `reviews/`:
  `<TICKET>-<slug>.md` (same pattern as §5). A standing component spec
  with no single ticket owner: `<component-name>.md`.
- `decisions.md` is one running log, not per-ticket — append a dated entry,
  never create a second decisions file.
- If the location is git-ignored, write there anyway and say so in the
  summary (same rule as §5).
