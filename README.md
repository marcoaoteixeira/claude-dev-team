# dev-team

Source repository and Claude Code plugin marketplace for **dev-team**: an agent team that detects a project's tech stack (.NET or Kotlin/JVM backends; Angular or Android frontends) and takes a refined Jira ticket from design through UX, test-first implementation, review, QA and a draft pull request.

## Preview: the development pipeline

Who's involved at each stage, what branches the flow, and the guard rails that keep it from running away unattended: **[development-pipeline.html](https://marcoaoteixeira.github.io/claude-dev-team/development-pipeline.html)** (once GitHub Pages is enabled for this repo — Settings → Pages → Source: `main` / `/docs`). Until then, open [`docs/development-pipeline.html`](docs/development-pipeline.html) locally after cloning.

## What's inside

| Path | What |
|---|---|
| `.claude-plugin/marketplace.json` | Marketplace `nameless-marketplace`, listing the plugin below |
| `plugins/dev-team/.claude-plugin/plugin.json` | Plugin manifest (name, version, description) |
| `plugins/dev-team/agents/` | The agents |
| `plugins/dev-team/skills/` | The skills |
| `plugins/dev-team/hooks/` | The review-gate hook |

### Agents

| Agent | Role |
|---|---|
| `software-architect` | Design (plan, API contract, build split, UX-spec call, ADRs) and design review — any stack |
| `product-owner` | Backlog refinement: epic breakdown, ticket critique |
| `ux-specialist` | User research, flows, interaction/component specs, accessibility review, design-QA — stack-agnostic |
| `qa-engineer` | Suggests test cases up front, verifies acceptance criteria are proven |
| `backend-developer-dotnet` | C#/.NET backend, test-first (xUnit) |
| `backend-reviewer-dotnet` | Read-only review of .NET diffs |
| `frontend-developer-angular` | Angular, test-first (Vitest) |
| `frontend-reviewer-angular` | Read-only review of Angular diffs |
| `kotlin-android-developer` | Kotlin/JVM backend (Ktor/Spring) **and** Android/Kotlin app (Compose), test-first (JUnit 5/Kotest, Turbine) — one developer for both sides |
| `kotlin-android-reviewer` | Read-only review of Kotlin backend and/or Android diffs |

Which backend/frontend pair gets used on a given project is decided by `stack-detection` from repo file markers — never guessed, never read off a README that could be stale.

### Skills

| Skill | Use |
|---|---|
| `development-pipeline` | Deliver one refined ticket end to end with the agents (manual only) |
| `stack-detection` | Identify a project's backend/frontend stack from repo markers, map to the matching agent pair |
| `epic-brainstorm` | Shape a Jira epic with the user, then refine it into tickets |
| `product-owner` | Refine or critique a single ticket |
| `developer-brainstorm` | Explore a rough feature idea before a design exists |
| `development-council` | Deliberate a hard architecture fork with several architect views |
| `adr-writer` | Draft an ADR for a qualifying decision |
| `delivery-conventions` | Branches, commits, CHANGELOG, README, where plans/specs/ADRs/UX docs go |
| `pr-writer` | Write and open the PR (Bitbucket API or saved file) |
| `sonarqube-check` | Check a branch/PR against the SonarQube quality gate |
| `angular-testing` | Angular unit-testing conventions (Vitest, Testing Library) |
| `android-testing` | Android/Kotlin testing conventions (MockK, Turbine, Compose UI tests) |
| `xunit` | xUnit best practices |
| `kotlin-testing` | Kotlin/JVM backend testing conventions (JUnit 5/Kotest, MockK, coroutine tests) |

### Hook

`require-review.cjs` runs before every Bash command and denies `git push` unless `development-pipeline` recorded a passed review and QA for the pushed commit. Direct pushes to `main`, `master`, `develop` or the default branch are always denied. You can still push manually with `! git push ...`.

## Install

Requirements:

- Claude Code with plugin support.
- `node` on `PATH` (for the hook).
- Atlassian MCP connector for the Jira/Confluence steps; SonarQube MCP for `sonarqube-check`.
- `BITBUCKET_TOKEN` in the environment to open PRs; without it the PR is saved as a file.

From a local clone:

```sh
claude plugin marketplace add C:/Workspace/DevTeam
claude plugin install dev-team@nameless-marketplace --scope user
```

A private repo uses your existing git credentials (SSH key or stored HTTPS credential).

If you have older copies of these agents or skills in `~/.claude/agents` or `~/.claude/skills`, remove them after installing. A user-level agent with the same name wins over the plugin's.

## Use

Plugin skills and agents are namespaced with `dev-team:`.

```text
/dev-team:development-pipeline PROJ-123 [3h] [--resume]
/dev-team:epic-brainstorm
/dev-team:adr-writer
```

Agents: `@agent-dev-team:software-architect`, or let the skills launch them.

## Develop

Every change starts on a new branch off an up-to-date `main` (never commit
to `main` directly — a repository rule rejects it): `<kind>/CDT-XXXX-<slug>`,
`kind` = `feature`|`fix`|`chore`|`refactor`|`docs`, `CDT-XXXX` the next
4-digit ticket key (this repo has no tracker wired up). Edit the files
under `plugins/dev-team/`, then:

1. Bump `version` in `plugins/dev-team/.claude-plugin/plugin.json`. Installed copies only update when the version changes.
2. Add an entry to `CHANGELOG.md`.
3. Validate: `claude plugin validate .`
4. Commit with Conventional Commits, scoped to the `CDT-XXXX` key, e.g. `feat(CDT-0005): add X`.
5. Push the branch and open a PR back to `main`.
6. Try it locally: `claude plugin marketplace update nameless-marketplace`, then restart Claude Code.

Conventions for editing the files are in `CLAUDE.md`.
