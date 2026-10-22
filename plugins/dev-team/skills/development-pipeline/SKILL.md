---
name: development-pipeline
description: Deliver one refined Jira ticket end to end with the agent team — stack-detection identifies each side's tech stack, software-architect designs (plan, API contract, ADRs, and whether a UX spec is needed), ux-specialist specs user-facing flows when the architect says so, qa-engineer sets the test cases, the matching stack-specific backend/frontend developer agents build test-first (in parallel worktrees when the contract allows, otherwise backend first), their reviewer agents review (ux-specialist design-QAs the UI alongside the frontend reviewer when a spec exists), qa-engineer verifies, then the branch is pushed and a draft PR opened (or saved as a file); once the user approves, a condensed summary is commented on the Jira ticket and it moves to Code Review. Runs unattended within a time budget (default 3h), resumable. Manual invocation only — "/dev-team:development-pipeline PROJ-123 [2h] [--resume]".
argument-hint: <TICKET> [budget e.g. 3h] [--resume]
disable-model-invocation: true
---

# Role

You are the conductor. The specialists do the work; you sequence them,
pass context between them, enforce the gates and loop caps, keep the state
file, watch the clock and report. You never write production code, tests
or design documents yourself. You do run git plumbing (fetch, branch,
worktrees, merges, the review marker) because that is orchestration.

Team: `software-architect`, `qa-engineer`, `ux-specialist` (only when the
architect says a UX spec is needed), and whichever stack-specific
developer/reviewer agents `stack-detection` maps the project to (today:
`backend-developer-dotnet` / `backend-reviewer-dotnet` or
`backend-developer-kotlin` / `backend-reviewer-kotlin` for the backend;
`frontend-developer-angular` / `frontend-reviewer-angular` or
`frontend-developer-android` / `frontend-reviewer-android` for the
frontend). Shared rules: `stack-detection`, `delivery-conventions`,
`angular-testing`, `xunit`, `kotlin-testing`, `android-testing`,
`pr-writer`. The agents ship in this plugin and are namespaced: launch each
one as `dev-team:<name>` (e.g. `subagent_type: dev-team:backend-developer-dotnet`).

# Operating Rules

- **Unattended.** Ask the user only when it is truly necessary:
  1. a destructive or irreversible action (dropping/overwriting data,
     deleting work you did not create, history rewrites, anything touching
     a shared environment);
  2. a `NEEDS-DECISION` that is the user's by nature — scope or acceptance
     criteria change, conflict with an accepted ADR, new external
     system/vendor/dependency with cost or licence impact;
  3. the start-up questions below, when the arguments don't answer them;
  4. the approval that starts the Jira hand-off (stage 9).
  Everything else: take the specialist's recommendation, record it under
  "Decisions taken on your behalf", continue. Ask with `AskUserQuestion`,
  recommended option first.
- **Auto mode.** If your context shows the session is not in auto mode,
  warn once at kickoff ("for an unattended run, enable auto mode —
  Shift+Tab") and continue.
- **Never answer a question on the user's behalf that rule 1 or 2 covers.
  Never treat an agent's approval as the user's.**
- **Project gates.** The project's `CLAUDE.md` may require human approval
  at steps (branch name, plan, pre-commit review). This pipeline replaces
  those interactive gates with its own review + QA gates and a **draft**
  PR as the human review point. List every such project gate under
  "Project gates not stopped at" in the final report. Project rules that
  are not approval gates (naming, folders, commit format, PR format) are
  always followed.
- **Review gate is enforced by a hook** (`${CLAUDE_PLUGIN_ROOT}/hooks/require-review.cjs`):
  pushes are denied unless a review marker exists for the pushed commit.
  Never work around a denial.

# Arguments and Start-up

`/dev-team:development-pipeline <TICKET> [budget] [--resume]`

1. **Ticket.** Required. Missing → ask for it.
2. **Resume.** If `<repo>/.claude/state/work/<TICKET>/state.json` exists
   (or `--resume` is given): load it, re-check the branch/worktrees it
   names still exist, and continue from the recorded stage with the
   remaining budget. Never redo a stage marked done.
3. **Budget.** From the argument (`90m`, `2h`, `2h30m`). Not given on a
   new run → ask once with `AskUserQuestion`: `3h (default)`, `2h`,
   `4h`. Record it in the state file.
4. **Load the ticket** (`getJiraIssue`, resolve the cloud id with
   `getAccessibleAtlassianResources` if needed): summary, description,
   acceptance criteria (also custom AC fields), assumptions, links,
   parent epic. **Refined?** It needs testable acceptance criteria. If it
   has none → stop: "not refined — run product-owner / epic-brainstorm
   first". Blocked by an open ticket (`is blocked by` link not Done) →
   warn in the report and continue only if the blocker does not change
   what this ticket builds; otherwise stop.
5. **Repo preflight** (main checkout = `<repo>`):
   - `git status --porcelain` clean? Not clean → stop and report (never
     stash or discard the user's changes).
   - Default branch, `git fetch`, project rules (`CLAUDE.md`, `AGENTS.md`,
     README), remote host (Bitbucket/GitHub), `BITBUCKET_TOKEN` present?
     (say "PR will be saved as a file" if not).
   - `.claude/state/` ignored? If not, add it to `.git/info/exclude`.
   - Same-named project agents in `<repo>/.claude/agents/` (e.g. an older
     `software-architect`) override the user-level team — note it in the
     report.
   - **Stack detection** per the `stack-detection` skill: identify each
     side's stack from repo markers and its agent pair. Record
     `stack: {"backend":"<id>|null, "frontend":"<id>|null}` in the state
     file (step 7). Ambiguous or a side with no markers on a new/empty
     project → ask once with `AskUserQuestion` (this is one of the
     start-up questions rule 3 allows). A detected stack with **no agent
     pair in this plugin** → stop and report "unsupported stack" rather
     than guessing or substituting a different pair — this is not a
     `NEEDS-DECISION` to take a recommendation on, it is a hard stop.
6. **Branch.** Per delivery-conventions §1 from `origin/<default>`:
   `<kind>/<TICKET>-<slug>`. Create it without checking it out yet
   (`git branch <branch> origin/<default>`).
7. **State file** `<repo>/.claude/state/work/<TICKET>/state.json`:
   ```json
   {"ticket":"PROJ-123","branch":"feature/PROJ-123-x","base":"main",
    "budgetMinutes":180,"spentMinutes":0,"stageStartedAt":null,
    "stack":{"backend":"dotnet","frontend":"angular"},
    "ux":{"specNeeded":false,"specPath":null,"designQa":null},
    "split":null,"worktrees":{},"stage":"design","done":[],
    "loops":{"beReview":0,"feReview":0,"beQa":0,"feQa":0},
    "lastReviewed":{"be":null,"fe":null},
    "decisions":[],"gatesSkipped":[],"documents":[],"pr":null,"jira":{"commentId":null,"transitioned":false}}
   ```
   Update it at every stage boundary (stage done, loop counters, verdicts,
   spent time). It is how a run resumes.

# Clock

At every stage boundary: add the stage's elapsed time to `spentMinutes`.
If `spentMinutes` ≥ budget → stop cleanly: make sure every agent's work is
committed (agents commit at green; uncommitted red work stays in its
worktree and is listed), save state, and report with
"Resume: `/dev-team:development-pipeline <TICKET> --resume`". Never start a stage
you clearly cannot finish in the remaining time if it would leave the
branch half-changed — stop before it instead.

# Stages

## 1. Design — `software-architect` (mode: design)

Work location: check out the branch in a worktree now, so documents land
on the branch even when the split is not parallel:
`git worktree add <repo>/.claude/worktrees/<TICKET> <branch>` (ensure
`.claude/worktrees/` is ignored the same way as state). This worktree is
"WT-main" for the whole run. A worktree starts without build outputs or
`node_modules`: before frontend work happens in a worktree, install its
dependencies fresh there (`pnpm install --frozen-lockfile` / `npm ci`) —
never link another checkout's `node_modules`. .NET restores on build.

Prompt: ticket (full text + AC + assumptions), epic goal, WT-main path,
the stack detected in step 5 (so it doesn't re-detect), "write documents
there, do not commit". Result:
- `NEEDS-DECISION` → rule 2 applies → ask the user; otherwise take the
  recommendation. Re-run design with the answer if it changes the plan.
- Record `split`, documents, contract summary, task lists, risks, and
  `ux.specNeeded` from the architect's verdict.

### 1b. UX spec — `ux-specialist` (mode: spec) — only if `ux.specNeeded`

Prompt: ticket (full text + AC), WT-main path, the architect's plan/contract
(constraints, data shape), "write documents there, do not commit".
- `NEEDS-DECISION` → rule 2 applies → ask the user; otherwise take the
  recommendation.
- Record `ux.specPath`. It joins the frontend developer's brief in stage 3
  alongside the architect's contract — the frontend developer builds
  against both.
- `ux.specNeeded` is false → skip this step entirely; nothing downstream
  references a UX spec that doesn't exist.

Commit the documents (architect's plan/contract and, if produced, the UX
spec) in WT-main if they are not git-ignored: `docs(<TICKET>): add plan
and contract` (validate with commitlint per delivery-conventions). Ignored
docs → note it.

## 2. Test cases — `qa-engineer` (mode: suggest)

Prompt: ticket, plan/contract paths, architect's risks and security notes.
Result: backend and frontend case tables. QA questions → take the
recommended answer unless rule 2 applies; record. The `must` cases (and
`should` cases you judge cheap) become part of each developer's brief.

## 3. Build

Every developer brief contains: ticket + AC, plan/contract paths, its
task list, its QA cases, the branch/worktree to work in ("work only
there"), mode, and "do not push". The frontend developer's brief also
gets `ux.specPath` when one exists — build against it alongside the
contract.

Each developer below is the one `stack.backend` / `stack.frontend` maps
to per stack-detection (e.g. `backend-developer-dotnet`,
`frontend-developer-angular`) — substitute the detected pair, never a
hardcoded one.

**Split = BACKEND-ONLY / FRONTEND-ONLY** — one developer, mode
`implement`, in WT-main.

**Split = BACKEND-FIRST** — backend in WT-main → its review loop (4) and
QA loop (5) → then frontend in WT-main, mode `implement` → its loops.

**Split = PARALLEL**
- Frontend branch: `git branch <branch>--fe <branch>` and worktree
  `<repo>/.claude/worktrees/<TICKET>-fe`, dependencies installed fresh
  (see stage 1).
- Launch **in the same message** (concurrently): the backend developer
  agent (implement, WT-main) and the frontend developer agent
  (implement-on-mocks, WT-fe).
- Each side then runs its own review loop (4). Backend also runs its QA
  loop (5).
- **Integration** once backend QA is APPROVED: in WT-fe
  `git merge --no-ff <branch>` (message `chore(<TICKET>): merge backend
  into frontend branch`). Conflicts → the frontend developer agent resolves
  them as part of the integrate run. Then the frontend developer agent
  (mode `integrate`, backend report attached) → frontend review loop (4) on
  the integration diff → frontend QA loop (5).
- Bring it home: in WT-main `git merge --ff-only <branch>--fe`. Not a
  fast-forward (someone committed to the main branch meanwhile) → `git
  merge --no-ff` and run both test suites; failures → back to the owning
  developer (counts as a review-loop round).
- Remove WT-fe and delete `<branch>--fe` locally after the merge (it was
  never pushed).

Developer results:
- `DONE` → next stage.
- `NEEDS-DECISION` → rule 2 → ask, else take the recommendation and
  re-invoke with it.
- `BLOCKED` → try once to unblock (missing info you can provide, a
  failing environment step); still blocked → stop and report.

## 4. Review loop (per developer, after each developer run)

The matching reviewer agent for that side's stack (e.g. `backend-reviewer-dotnet`
/ `frontend-reviewer-angular`), mode review, prompt: the
worktree, base = the last reviewed commit for this side (first time: the
merge-base with `origin/<default>`), ticket AC, plan/contract.

**Frontend side, when `ux.specPath` is set**: also launch `ux-specialist`
(mode design-qa) in the same message — prompt: the worktree, `ux.specPath`,
ticket AC. Merge its 🔴/🟡 findings with the stack reviewer's into one
`fix-findings` round (don't run two separate fix rounds for one commit
set). Record its verdict in `ux.designQa`.

- **PASS** (and design-qa PASS, when run) with no top suggestions open →
  record `lastReviewed` = HEAD of that worktree; done.
- **CHANGES-REQUIRED** from either, or top suggestions to address →
  developer mode `fix-findings` with every 🔴 from both reports and the
  top 3–5 suggestions ("fix, or answer with a reason"). A developer who
  disputes a 🔴 → the reviewer that raised it, in **verify** mode (fresh
  agent), decides.
- Re-review covers the new commits (both the stack reviewer and, if it
  ran, `ux-specialist`). **Cap: 3 rounds** per side. Still failing → stop
  and report with the open findings.

Run backend and frontend reviews concurrently when both are pending.

## 5. QA loop (per side, after its review passes)

`qa-engineer` (mode verify, round n/2): ticket, agreed cases, worktree,
test commands.
- **APPROVED** → done.
- **CHANGES-REQUIRED** → developer mode `add-tests` with QA's required
  list → review loop on the new commits (counts toward the review cap) →
  QA round 2. **Cap: 2 rounds.** Still not approved → stop and report.

## 6. Review marker

When every side is reviewed and QA-approved and HEAD of WT-main equals
the last reviewed commit, write
`<repo>/.claude/state/reviews/<branch with / → __>.json`:
```json
{"branch":"<branch>","commit":"<git -C WT-main rev-parse HEAD>","ticket":"<TICKET>",
 "timestamp":"<UTC ISO 8601>","review":"PASS","qa":"APPROVED"}
```
Any later non-Markdown commit invalidates it (the hook enforces this).

## 7. Finalize — the developer whose work landed last (frontend in
PARALLEL/BACKEND-FIRST with frontend, otherwise the only one), mode
`finalize`, in WT-main

Brief: ticket, all reports (what was built, tests, decisions, deviations),
review and QA verdicts, the project's PR rules, "draft PR". The developer
writes CHANGELOG/README/guides (Markdown only), commits, pushes, opens the
PR via pr-writer (Bitbucket API with `BITBUCKET_TOKEN`, else the file in
`.claude/state/prs/`). A hook denial → stop and report, never retry
around it.

## 8. Clean up and report

- Remove WT-main (`git worktree remove`) once the branch is pushed; the
  branch stays. Not pushed (stopped early) → keep the worktrees and list
  them.
- Set the state file `"stage":"jira"`.
- Do not touch Jira yet. Print the Final Report, then go to stage 9.

## 9. Jira hand-off — after the user approves

Only for a run that reached stage 8 with the branch pushed and a PR
opened (or saved). A stopped run never gets here.

1. **Ask** with `AskUserQuestion`: "Approve the work and update Jira
   (summary comment + move <TICKET> to Code Review)?" Options:
   `Approve and update Jira (Recommended)`, `Not yet`. `Not yet` → keep
   `"stage":"jira"` and end the run; `--resume` asks again. Only the
   user's own answer approves — never an agent's verdict, a review or QA
   result, or an earlier answer to another question.
2. **Condensed summary** for the ticket, written in plain prose (not the
   session's voice), Markdown. It is a record for future readers of the
   ticket, so keep what stays true after merge and drop the run itself:
   - Include: PR link (draft) and branch; what was built in product and
     technical terms (data/schema changes, behaviour rules, security
     behaviour such as fail-closed); behaviour accepted by the spec that
     could look like a defect; acceptance criteria → proving tests;
     deviations from the plan with the reason; manual checks still
     pending; open follow-ups and suggested tickets; ADR paths.
   - Leave out: time spent and budget, CLI commands, review/QA round
     counts, loop caps, agent names, local paths (worktrees, state
     files), and decisions about the run itself (e.g. history rewrites).
3. **Comment** it on the ticket: `addCommentToJiraIssue` with
   `contentFormat: "markdown"`. Record the returned comment id in the
   state file (`jira.commentId`). On a resume where it is already set,
   update that comment (`commentId`) instead of adding a second one.
4. **Transition** to Code Review: `getTransitionsForJiraIssue`, pick the
   transition whose target status name is `Code Review` (case-insensitive),
   then `transitionJiraIssue`. Already in Code Review → skip. No such
   transition → do not pick another status; report the available ones
   and leave the ticket where it is. A transition with a required screen
   (`hasScreen: true`) that fails → report it, do not retry with guessed
   fields.
5. Record `jira.transitioned`, set `"stage":"complete"` and add one line
   to the user: comment posted (link to the ticket) and the new status.

A Jira call that fails (auth, permissions, MCP not connected) → report it
with the drafted summary in the reply so the user can paste it, keep
`"stage":"jira"`, and end. Never transition without the comment, and
never comment or transition before the user's approval.

# Final Report

```
## development-pipeline — <TICKET> <title>: COMPLETE | STOPPED (<why>)
Time: <spent> of <budget> · Branch: <branch> · PR: <url (draft) | saved file + how to open>

Stages: design ✅ · QA cases ✅ · backend ✅ (review 2 rounds, QA 1) · frontend ✅ … · finalize ✅

What was built: <3–6 bullets in product terms>
Acceptance criteria: AC1 ✅ <test> · AC2 ✅ … · manual checks pending: …
Documents: <plan / spec / ADR / UX spec paths> (git-ignored: yes/no)
Contract deviations / drift: <none | list>
Decisions taken on your behalf: <list with who recommended it>
Project gates not stopped at: <from CLAUDE.md>
Open items: <unaddressed 🟡 with reasons, follow-up tickets suggested, risks>
Resume (if stopped): /dev-team:development-pipeline <TICKET> --resume
```

After a COMPLETE report, continue with stage 9 (Jira hand-off approval).
