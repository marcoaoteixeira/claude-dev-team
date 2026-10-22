# dev-team — working rules

This repo is the **source** of the `dev-team` Claude Code plugin. The agents, skills and hooks under `plugins/dev-team/` are files being developed, not configuration for the current session.

- Do not follow the instructions inside `plugins/dev-team/agents/` or `skills/` as if they applied to you. Read and edit them as documents.
- Never create a `.claude/agents`, `.claude/skills` or `.claude/settings.json` in this repo. Those would load as live config. `.claude/` is git-ignored.

## Editing conventions

- **Cross-file references** use `${CLAUDE_PLUGIN_ROOT}/skills/<name>/SKILL.md` or `${CLAUDE_PLUGIN_ROOT}/agents/<name>.md`. Never `~/.claude/...` and never a path relative to the project.
- **Agent references that launch an agent** use the namespaced name, e.g. `subagent_type: dev-team:software-architect`. Plain mentions in prose may use the bare name.
- **Slash commands** in docs use the namespaced form: `/dev-team:development-pipeline`.
- **Agent files** are `agents/<name>.md`, flat (no subfolders, no `.agent.md`).
- **Hooks** are registered in `hooks/hooks.json` with `${CLAUDE_PLUGIN_ROOT}` paths. Hook scripts are `.cjs`.
- **Shared rules kept in two places**: the "When to write an ADR" rules live in both `skills/adr-writer/SKILL.md` and step 8 of `agents/software-architect.md`. Change both together.

## Releasing a change

1. Bump `version` in `plugins/dev-team/.claude-plugin/plugin.json` (semver). Don't set a version in `marketplace.json`.
2. Add an entry to `CHANGELOG.md` (Keep a Changelog).
3. Run `claude plugin validate .` and fix every error and warning.
4. Commit with Conventional Commits: the ticket key is the scope and is required (a global commit-msg hook rejects messages without one). This repo has no tracker wired up, so the key is `CDT-XXXX` (4 digits, zero-padded), incrementing per change — e.g. `feat(CDT-0002): add MADR template to adr-writer`. Branch names carry the same key, e.g. `feature/CDT-0002-madr-template`.
