---
name: epic-brainstorm
description: Brainstorm a Jira epic with the user part by part, recording only confirmed facts as numbered decisions in a local markdown doc, then produce a Jira-ready epic doc, (only on approval) write it to Jira, and refine it into development-ready child tickets with the product-owner agent (created only on approval). Use this whenever the user wants to brainstorm, shape, draft, refine or plan a Jira epic, says "let's brainstorm an epic", pastes an epic name with a few bullet points to explore, asks to turn a brainstorm into an epic description, or wants an epic broken down into refined tickets — even if they don't say "skill" or "brainstorm" explicitly. Not for a single one-off ticket (product-owner skill) or for reviewing code.
---

# Epic brainstorm

Shape a Jira epic together with the user. The user is thinking out loud to define work; a wrong assumption written into the epic pollutes every ticket created from it. So the job is to **capture what the user decides**, surface what's unclear, and never fill gaps with guesses.

Two documents come out of it, in the folder the user works in (current working directory unless they name another):

1. `<Slug>-Epic.md` — the brainstorm log: decisions, answered and open questions, working models. Template: `references/brainstorm-template.md`.
2. `<Slug>-Epic-Jira.md` — the clean, Jira-ready epic description. Template: `references/jira-template.md`.

If screenshots or other files are needed, put them in `<Slug>-Epic-Assets/`.

All document content is in normal English and concise. Readers skim tickets — short sentences, tables over prose, no filler. Match the chat tone the user is using, but keep the docs plain.

## Step 1 — Gather the basics

Check what the user already gave you. Ask only for what's missing, in one short batch:

- **Epic name**
- **Space / Jira project** (e.g., key `PC`)
- **Team**
- **Main parts / topics** the epic covers (if not given, ask; don't invent them)
- **Links or documents** for context (Confluence pages, Jira epics, designs, files)

The user may give much more on start — clarifications per part, message examples, constraints. Treat everything they state as confirmed fact.

## Step 2 — Research quietly, then write the first draft

Before asking questions, read what's available so the questions are informed:

- Fetch linked Confluence pages / Jira issues (Atlassian MCP tools; load them with ToolSearch if deferred).
- Search Jira in the project for related tickets and for an **existing epic with the same name** (JQL on summary/text). If an epic already exists, note its key — the description goes there later instead of creating a new one.
- If that epic **already has a description or child tickets**, someone has shaped it already. Summarise it in Background (description points + child ticket keys/titles) and make the first question: treat its content as **confirmed input** (record it as decisions, brainstorm only the gaps) or as a **draft to redo**? Warn that changing the scope may affect the existing child tickets. Until answered, don't record its content as decisions — and point out where it contradicts what the user said.
- Search Confluence for pages on the same topic (CQL on title/text). Related design pages often already hold decisions or open points.
- If a previous `*-Epic.md` exists in the folder, glance at it for the user's house style.

Large tool results: extract only what you need (keys, summaries, the relevant descriptions) rather than dumping everything into context.

**PO checkpoint 1.** Invoke the `dev-team:product-owner` agent (mode Review) on what you gathered: the user's summary, parts and the sources found. Ask it for the epic goal (stated or inferred), value gaps and the questions a PO would ask first. Fold its questions into your batches — attributed as "(PO)" — don't show its raw output. It is advice: the user decides.

Then create `<Slug>-Epic.md` from the brainstorm template with: header table, summary (the user's words), decisions so far, background (facts from sources, each with its source), one section per part, and the **first batch of questions for Part 1 only**.

Tell the user briefly what you found — especially **conflicts** between their statements and the sources (e.g., a Confluence page says X, they said Y). Conflicts become questions, not silent choices.

## Step 3 — Go part by part

Work on one part at a time. Per turn:

1. Ask a **small batch (4–7) of focused questions** for the current part, numbered (`Q<part>.<n>`), each with a one-line "why it matters".
2. When the user answers, update the doc:
   - Each answer becomes a numbered decision `D<n>` (global numbering) with a reference to its question.
   - Move answered questions into an "Answered" table for that part (strike the ID: `~~Q1.3~~`).
   - If an answer contradicts an earlier decision, strike the old one and point to the new one ("Superseded by D53"). Don't delete history.
   - Keep a short **working flow / model diagram** per part current — it is the fastest way for the user to spot a misunderstanding.
3. Reply in chat with a compact summary of new decisions and the next batch. Keep it short; the doc holds the detail.

Rules that keep the epic trustworthy:

- **Record, don't guess.** If an answer is partial or ambiguous, record the confirmed part and ask a sharper follow-up. When two readings are possible, show both with a concrete example (e.g., "{DE, FR, US} or only {DE}?") — offering an A/B choice resolves ambiguity faster than rephrasing.
- **Match answers to questions by content, not number.** Users skip or renumber; if one is unanswered, re-ask it.
- **"TBD" or "don't know" is a valid answer.** Record it as a decision ("Issuer/audience: TBD with team X") and add it to Dependencies — don't keep re-asking.
- **Flag risks plainly.** If a decision has a security or access-control consequence (e.g., everyone gets access while X is true), say so explicitly and ask who owns that boundary.
- When a part has no meaningful open questions left, mark it **closed** and move on. Minor details can go to "To settle at refinement".

## Step 4 — Produce the Jira-ready doc

When all parts are closed, tell the user and offer to draft `<Slug>-Epic-Jira.md` from the Jira template. It is a clean rewrite of the decisions — no question history, no decision IDs in the body (except the source line):

- Summary, Background, Flow/Model, Scope (one subsection per part), Out of scope, Dependencies, To settle at refinement, Candidate tickets (area · ticket · acceptance criteria), References.
- **PO checkpoint 2.** Before showing the draft, invoke `dev-team:product-owner` (mode Review) on it: goal clarity, value, scope/out-of-scope, testable AC, hidden second epic. Fix what is clearly right; turn the rest into questions for the user.
- Acceptance criteria follow from decisions. Where you had to **infer** something not explicitly decided, list those points for the user to check before they rely on it.

## Step 5 — Write to Jira (only with explicit approval)

Writing to Jira publishes to the team, so ask first: "Write this onto <KEY>, or keep it local?"

- If approved and an epic exists: update its **description only** (`editJiraIssue`, markdown), leaving summary, status, assignee and priority as they are unless told otherwise. Drop the title and the local source line from the body.
- If no epic exists, ask before creating one.
- Afterwards, update the brainstorm doc header status.
- Then offer Step 6 in one line.

## Step 6 — Refine into tickets (PO checkpoint 3)

Only when the user asks for it or accepts the offer.

1. Invoke `dev-team:product-owner` (mode Breakdown) with the epic key (or the Jira-ready doc), the brainstorm doc path and the project key. It returns open questions, proposed tickets in order, and changes to existing issues.
2. Show the user the **open questions first** (with the PO's recommended answers) and a compact ticket list (order · type · title · one line of value). Full drafts go to `<Slug>-Epic-Tickets.md` next to the other docs.
3. Apply the answers: update the drafts yourself when the change is mechanical; re-invoke `dev-team:product-owner` when an answer changes the slicing.
4. **Create only on explicit approval** ("create these N tickets in <PROJECT>?"):
   - Required fields per issue type come from `getJiraIssueTypeMetaWithFields` — e.g. dedicated Acceptance Criteria / Assumptions fields on Stories. Pass them in `additional_fields`; the parent epic as `{"parent": {"key": "<EPIC>"}}`.
   - Create in the proposed order so keys read naturally; then add the dependency links (`createIssueLink`, type Blocks: `inwardIssue` = the blocker, `outwardIssue` = the blocked ticket).
   - Proposed changes to existing issues are separate edits — confirm them separately.
   - On a failure, stop, report what was created, and fix before continuing — never leave duplicates.
5. Update the epic's ticket table (Jira-ready doc and, with approval, the epic description) with the real keys, and `<Slug>-Epic-Tickets.md` with keys and status.

The tickets are then ready for `/dev-team:development-pipeline <KEY>`.

## Resuming

If a `<Slug>-Epic.md` already exists, read it, find the current part and the open questions, and continue from there rather than starting over.
