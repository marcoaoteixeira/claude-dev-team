# dev-team

Source repository and Claude Code plugin marketplace for **dev-team**: an agent team for .NET + Angular work, from shaping a Jira epic to a reviewed, QA-approved draft pull request.

## Preview: the development pipeline

What happens, and who is involved, when the team picks up a refined ticket. For the full page, open [`docs/development-pipeline.html`](docs/development-pipeline.html) in a browser after cloning (GitHub shows HTML files as source).

![Development pipeline: stages 0 to 8 with the agents involved, what each stage produces, the build split and the guard rails](docs/development-pipeline.png)

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
| `software-architect` | Design (plan, API contract, build split, ADRs) and design review |
| `product-owner` | Backlog refinement: epic breakdown, ticket critique |
| `qa-engineer` | Suggests test cases up front, verifies acceptance criteria are proven |
| `backend-developer` | C#/.NET, test-first (xUnit) |
| `frontend-developer` | Angular, test-first (Vitest) |
| `backend-reviewer` | Read-only review of .NET diffs |
| `frontend-reviewer` | Read-only review of Angular diffs |

### Skills

| Skill | Use |
|---|---|
| `development-pipeline` | Deliver one refined ticket end to end with the agents (manual only) |
| `epic-brainstorm` | Shape a Jira epic with the user, then refine it into tickets |
| `product-owner` | Refine or critique a single ticket |
| `developer-brainstorm` | Explore a rough feature idea before a design exists |
| `development-council` | Deliberate a hard architecture fork with several architect views |
| `adr-writer` | Draft an ADR for a qualifying decision |
| `delivery-conventions` | Branches, commits, CHANGELOG, README, where docs go |
| `pr-writer` | Write and open the PR (Bitbucket API or saved file) |
| `sonarqube-check` | Check a branch/PR against the SonarQube quality gate |
| `angular-testing` | Angular unit-testing conventions (Vitest, Testing Library) |
| `xunit` | xUnit best practices |

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
claude plugin marketplace add C:/Workspace/ClaudeRepo
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

Edit the files under `plugins/dev-team/`, then:

1. Bump `version` in `plugins/dev-team/.claude-plugin/plugin.json`. Installed copies only update when the version changes.
2. Add an entry to `CHANGELOG.md`.
3. Validate: `claude plugin validate .`
4. Try it locally: `claude plugin marketplace update nameless-marketplace`, then restart Claude Code.

Conventions for editing the files are in `CLAUDE.md`.
