---
name: tracker-detection
description: Identify which work tracker a project uses (Jira or GitHub Issues/Projects v2) from connected-tool evidence, and name the adapter doc that maps the plugin's tracker operations onto that tracker's real calls. Used by product-owner, epic-brainstorm and development-pipeline before any ticket read/write. Ambiguous or no tracker evidence → ask the user once; never guess.
---

# Role

Evidence, not a declared setting. Which tracker a project uses is picked
up from what is actually connected (an MCP server, an authenticated CLI),
the same rule `stack-detection` applies to tech stacks: a declared value
can go stale with no error signal; evidence can't silently drift.

# Trackers this plugin currently ships

| Tracker id | Evidence | Adapter doc |
|---|---|---|
| `jira` | An Atlassian MCP tool is connected (`mcp__claude_ai_Atlassian__*` resolves via ToolSearch or is already listed) | `references/jira.md` |
| `github-issues` | The `github` MCP is connected **and** `gh auth status` succeeds **and** `gh project list --owner <org-or-user>` succeeds (Projects v2 needs the CLI's `project` scope) | `references/github-issues.md` |

A tracker detected below that is not in this table is **unsupported** —
report it rather than guessing between the two above.

# Procedure

0. **Check for a recorded result first**: a `## Dev-Team Detected Facts`
   section in the project's `CLAUDE.md` (or `README.md` if no `CLAUDE.md`)
   with a `Tracker:` line. Found → use it, skip the evidence checks below
   — unless the recorded tracker's evidence no longer holds (e.g. the MCP
   it named is no longer connected), in which case treat it as stale,
   re-detect, and update the record. This is why which tracker a project
   uses should be checked once per project, not re-asked or re-detected on
   every invocation.
1. Check Atlassian MCP evidence, then GitHub MCP + `gh` evidence,
   independently.
2. **Exactly one tracker has evidence** → that tracker, done.
3. **Both have evidence** → ask the user once (`AskUserQuestion`): which
   tracker this project actually uses. Record the answer for the rest of
   the run; never re-ask mid-run.
4. **Neither has evidence** → ask the user once which tracker to use,
   offering the two rows above. If they name a tracker neither MCP/CLI
   supports yet, say so plainly — this is not a `NEEDS-DECISION` to
   improvise around, it is a hard stop until the right MCP/CLI is
   connected.
5. `github-issues` evidence present but `gh project` fails specifically
   on the `project` scope (CLI authenticated, board calls denied) →
   report that precisely: Issues/comments will work, but `set-status`
   (board moves) won't until the token is re-authorized with
   `gh auth refresh -s project`. Don't fall back to a label silently —
   that's a different, weaker mechanism than what Projects v2 gives.

# Operations vocabulary

Callers (agents and orchestrating skills) name one of these — they never
call a tracker's raw API inline. Each adapter doc maps every one of them
onto that tracker's real tool calls:

- `get-ticket(key)` — title, description, type, status, parent, links.
- `search-tickets(project/repo, query)` — duplicates, an existing epic by
  name, a project's recent tickets to match conventions.
- `get-epic-children(epicKey)` — a parent's existing child tickets.
- `required-fields-for-type(project, type)` — fields the tracker demands
  before a ticket of this type can be created. A tracker that has no such
  concept says so (callers must treat "N/A" as "skip this step", not as
  an error).
- `create-ticket(type, fields, parentKey?)` → the new ticket's key.
- `link-dependency(blockerKey, blockedKey)` — a tracker without a native
  blocking-link type documents its weaker substitute explicitly.
- `add-or-update-comment(key, commentId?, markdown)` → the comment id (so
  a later update edits it instead of adding a second one).
- `set-status(key, targetStatusName)` — move the ticket to a named status
  (e.g. "Code Review"). No such status/mechanism → report the available
  ones (or what's missing) rather than picking the nearest one.
- `fetch-linked-docs(key)` — linked wiki/design pages. A tracker with no
  such integration shipped yet says so; callers skip, they don't guess at
  a substitute.

# Output

One line: `tracker: <id> → ${CLAUDE_PLUGIN_ROOT}/skills/tracker-detection/references/<id>.md`

The caller loads that adapter doc once per run and uses it for every
operation above instead of re-detecting or calling a raw API directly.

# Recording the result (detect once)

Which tracker a project uses is a fact, once evidence has settled it, not
something to ask or re-detect every run.

- After detecting from evidence (never after a cached hit), write or
  update a `## Dev-Team Detected Facts` section in the project's
  `CLAUDE.md` if one exists, otherwise `README.md`, at the repo root:
  ```markdown
  ## Dev-Team Detected Facts

  - Tracker: `<id>` (evidence: `<what was checked>`) — detected
    `<YYYY-MM-DD>` by tracker-detection. Delete this line to force
    re-detection.
  ```
  Share the `## Dev-Team Detected Facts` heading with `stack-detection` if
  it already added one — add this as another bullet under it, not a
  second heading.
- Commit it with whatever change triggered detection, or
  `docs(<TICKET>): record detected tracker` standalone, per
  delivery-conventions.
