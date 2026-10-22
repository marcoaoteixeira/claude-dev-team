# GitHub Issues / Projects v2 adapter

Maps `tracker-detection`'s operations onto `mcp__github__*` tools and the
`gh` CLI (via `Bash`) for the parts the MCP server doesn't cover
(Projects v2 has no MCP tool today — see `tracker-detection`'s evidence
check). `key` here is an issue number, optionally qualified
`owner/repo#123` when working across repos.

| Operation | Call |
|---|---|
| `get-ticket(key)` | `mcp__github__issue_read`. |
| `search-tickets(repo, query)` | `mcp__github__search_issues` (GitHub search syntax, e.g. `repo:<owner>/<repo> is:issue <text>`). |
| `get-epic-children(epicKey)` | No MCP tool lists sub-issues. `gh api repos/<owner>/<repo>/issues/<epicKey>/sub_issues`. |
| `required-fields-for-type(project, type)` | **N/A.** GitHub issues have no per-type required custom fields. Callers skip this step rather than treating the absence as an error. |
| `create-ticket(type, fields, parentKey?)` | `mcp__github__issue_write` (`type` from `mcp__github__list_issue_types` when the org has Issue Types enabled, else a label). When `parentKey` is given: create first, then `mcp__github__sub_issue_write` to attach it under the parent. |
| `link-dependency(blockerKey, blockedKey)` | GitHub has no native blocking-link type. Substitute: add `Blocks #<blockedKey>` to the blocker's body and a `blocked` label on the blocked issue. State plainly to the caller that this is weaker than Jira's link (not queryable the same way, easy to edit away) — don't present it as equivalent. |
| `add-or-update-comment(key, commentId?, markdown)` | `mcp__github__add_issue_comment` when no `commentId`; `mcp__github__update_issue_comment` with that id otherwise. |
| `set-status(key, targetStatusName)` | Requires the issue to already be on a Projects v2 board — this adapter never adds it to one (which board is a decision, not evidence); if it isn't on one, report that and stop. Otherwise, via `gh` CLI: `gh project item-list <project-number> --owner <owner> --format json` to find the item id for this issue, `gh project field-list <project-number> --owner <owner> --format json` to find the Status field id and the option id matching `targetStatusName`, then `gh project item-edit --project-id <id> --id <item-id> --field-id <statusFieldId> --single-select-option-id <optionId>`. No option matching `targetStatusName` → report the available ones, leave the item where it is (same rule as the Jira adapter's "no such transition"). |
| `fetch-linked-docs(key)` | **N/A.** No wiki/design-page integration shipped yet. Callers skip this step. |

`gh` must already be authenticated with the `project` scope
(`gh auth status`; `gh auth refresh -s project` if not) — `tracker-detection`
checks this before naming `github-issues` as the detected tracker, but a
scope that was revoked mid-run should still fail loudly here, not be
silently treated as "no board".
