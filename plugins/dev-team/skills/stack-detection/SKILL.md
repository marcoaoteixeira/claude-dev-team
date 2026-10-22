---
name: stack-detection
description: Identify a project's backend and/or frontend technology stack from repo file markers, and map each side to the matching dev-team developer/reviewer agent pair. Used once by development-pipeline during repo preflight, and by software-architect before design, so every later stage invokes the right stack-specific agents instead of assuming one stack. Ambiguous or unsupported stack → ask the user once; never guess.
---

# Role

Markers, not assumptions, not the README. A declared stack in a README or
CLAUDE.md can go stale the moment a migration lands and nobody updates the
doc; file markers are generated or required by the toolchain itself, so
they can't drift the same way. Use this before any stack-specific agent is
chosen.

# Agent pairs this plugin currently ships

| Side | Stack id | Developer agent | Reviewer agent |
|---|---|---|---|
| backend | `dotnet` | `backend-developer-dotnet` | `backend-reviewer-dotnet` |
| backend | `kotlin` | `backend-developer-kotlin` | `backend-reviewer-kotlin` |
| frontend | `angular` | `frontend-developer-angular` | `frontend-reviewer-angular` |
| frontend | `android` | `frontend-developer-android` | `frontend-reviewer-android` |

A stack detected below that is not in this table is **unsupported** — see
"Unsupported stack". Adding a new pair means adding rows here and to the
markers tables, in the same change that adds the agents.

# Markers

Match top to bottom; the first strong, unambiguous signal for a side wins.
Check markers at the repo root and one level into typical module folders
(`src/`, `app/`, `apps/*`, `services/*`, `backend/`, `frontend/`, `api/`,
`web/`) — a monorepo can carry more than one stack, one per folder.

## Backend

| Stack id | Strong markers |
|---|---|
| `dotnet` | any `*.csproj`, `*.sln`, or `global.json` with an `sdk` key |
| `kotlin` (JVM backend, e.g. Ktor/Spring) | `build.gradle.kts` (or `build.gradle`) with Kotlin sources under `src/main/kotlin`, and **no** Android markers below in the same module |

## Frontend

| Stack id | Strong markers |
|---|---|
| `angular` | `angular.json` |
| `android` (Kotlin) | `build.gradle.kts` (or `build.gradle`) **and** an `AndroidManifest.xml` under an app/module folder |

# Procedure

1. Scan for markers per side, independently — a repo may have only a
   backend, only a frontend, one of each, or several (monorepo).
2. **Clear single match per side** → that stack, done.
3. **Two backends or two frontends in different folders** (a monorepo with
   two services) → not ambiguous: report each folder's stack separately,
   map each independently. Do not collapse them into one.
4. **Conflicting markers inside what looks like one module** (e.g. a
   `build.gradle.kts` module with both an `AndroidManifest.xml` and a
   plain `src/main/kotlin` with no Android dependency) → ambiguous: ask
   the user once ("is `<module>` an Android app or a JVM backend
   service?"). Never guess between them.
5. **No markers at all for a side the ticket clearly needs** (new/empty
   project, or a side not yet scaffolded) → ask the user once which stack
   to build, offering the stacks this plugin supports (see the table
   above) as the suggested options.
6. **A stack is identified but has no row in the agent-pairs table** →
   do not fall back to a different stack and do not silently proceed.
   Report it as unsupported (see below) and let the caller (the pipeline
   or the user) decide.

# Unsupported stack

Report plainly: `detected <stack-id> for <side>, no dev-team agent pair for
it yet (supported: <list from the table>)`. This is a `NEEDS-DECISION` for
whoever asked for detection — not a reason to invoke the nearest existing
pair, which would apply the wrong language's conventions, test framework
and review checklist.

# Output

One line per side:

```
backend: <stack-id> (<markers found>) → <developer agent> / <reviewer agent> | unsupported: <stack-id>
frontend: <stack-id> (<markers found>) → <developer agent> / <reviewer agent> | unsupported: <stack-id>
```

Omit a side the ticket/project genuinely has none of (e.g. a pure backend
service has no frontend line).

This skill only names the stack and its agent pair — it does not read the
stack's own conventions (nullable settings, Angular version, Kotlin target,
etc.). That is each developer agent's own "Project Detection" step, run
after it is invoked.
