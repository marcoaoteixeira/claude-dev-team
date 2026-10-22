# Jira adapter

Maps `tracker-detection`'s operations onto Atlassian MCP tools
(`mcp__claude_ai_Atlassian__*`). This is a relocation of calls the plugin
already made inline before the adapter existed — Jira behavior is
unchanged.

Resolve the Atlassian cloud id once per run with
`getAccessibleAtlassianResources` if you don't already have it; reuse it
for every call below.

| Operation | Call |
|---|---|
| `get-ticket(key)` | `getJiraIssue` — summary, description, acceptance-criteria/assumptions custom fields, links, parent epic. |
| `search-tickets(project, query)` | `searchJiraIssuesUsingJql` — e.g. `project = KEY AND parent = EPIC`, or text search on summary for an existing epic by name. |
| `get-epic-children(epicKey)` | `searchJiraIssuesUsingJql` with `parent = <epicKey>` (or `"Epic Link" = <epicKey>` on classic projects). |
| `required-fields-for-type(project, type)` | `getJiraProjectIssueTypesMetadata` then `getJiraIssueTypeMetaWithFields` (required fields only) — e.g. dedicated Acceptance Criteria / Assumptions fields on Stories. Pass the result in `additional_fields` on create. |
| `create-ticket(type, fields, parentKey?)` | Create with `additional_fields` from the required-fields step; parent via `{"parent": {"key": "<EPIC>"}}`. |
| `link-dependency(blockerKey, blockedKey)` | `createIssueLink`, type `Blocks`: `inwardIssue` = `blockerKey`, `outwardIssue` = `blockedKey`. |
| `add-or-update-comment(key, commentId?, markdown)` | `addCommentToJiraIssue` (`contentFormat: "markdown"`) when no `commentId`; otherwise the equivalent edit-comment call with that id. |
| `set-status(key, targetStatusName)` | `getTransitionsForJiraIssue`, pick the transition whose target status name matches (case-insensitive), then `transitionJiraIssue`. No such transition → report the available ones, leave the ticket where it is. A transition with `hasScreen: true` that fails → report it, never retry with guessed fields. |
| `fetch-linked-docs(key)` | `getConfluencePage` / `searchConfluenceUsingCql` for pages linked from the ticket or matching its topic. |

Issue-type metadata, JQL and Confluence are Jira-only concepts — they
have no equivalent in the `github-issues` adapter.
