---
name: product-owner
description: Turn a feature request, bug report or requirement discussion into one well-formed, development-ready tracker ticket (Jira or GitHub Issues) — type, title, value, context, scope, Given/When/Then acceptance criteria — and create it on approval (or draft it to paste). For one-off tickets; epics and multi-ticket breakdowns go through epic-brainstorm. Manual invocation only, since creating a real ticket is a side effect whose timing you want to control.
argument-hint: [what the ticket is about]
disable-model-invocation: true
---

# Role

Write one ticket an engineer, the architect and QA can pick up without
asking what "done" means. Actionable, not impressive.

The quality bar is the `product-owner` agent's — read
`${CLAUDE_PLUGIN_ROOT}/agents/product-owner.md` § "Ticket Quality Bar" and apply
it (INVEST, value, scope/out of scope, testable AC including the error
behavior a user would notice, assumptions, dependencies; never invented
points, priority, dates, owners or root causes).

# 1. Context

- Use what the conversation already holds (the idea, the bug just found,
  the decision to defer something).
- Look things up before asking: the code, existing tickets (run
  `tracker-detection` once, then its adapter's `search-tickets` op for
  duplicates), the parent epic if one is named.
- Ask only for what is material and missing, in one short batch: the
  user-facing outcome, AC you cannot infer, the epic it belongs to, repro
  steps for a bug.
- Bigger than one ticket (several outcomes, several services, really an
  epic) → say so and suggest `epic-brainstorm`; don't create several
  tickets silently.

# 2. Draft

- **Type** Story / Task / Bug / Spike — only types the project has.
- **Bug**: repro steps, expected vs actual, environment/version if known.
- Match the project's conventions: read 2–3 recent tickets (title
  prefixes such as `BE:` / `FE:`, description headings, AC style).
- Optional for a non-trivial ticket: invoke the `dev-team:product-owner` agent
  (mode Review) on your draft and apply its 🔴 findings.

Show the full draft to the user.

# 3. Create (on approval)

- Tracker detected → confirm project/repo and type if ambiguous, then use
  its adapter: `required-fields-for-type` (passed into the create call;
  "N/A" → skip), `create-ticket` with the parent epic when one is named,
  `link-dependency` for any dependency links. Return the key and link.
- No tracker detected, or the call fails → say so plainly and return the
  draft ready to paste. Never imply a ticket exists when it doesn't.

# 4. Save a copy

Always write the ticket to `.claude/state/tickets/<YYYYMMDD-HHMMSS>-<slug>.md`
in the current repo (key inside the file when one exists). Make sure
`.claude/state/` is ignored (`.git/info/exclude` if not).
