---
name: pr-writer
description: Write a pull request description from the actual work done, using the project's PR template, and open the PR — on Bitbucket via its REST API when BITBUCKET_TOKEN is set, on GitHub via gh — or save it as a file in .claude/state/prs/ when it cannot be opened. Use when a change is finished (review and QA passed) and it's time to open or describe the PR; called by development-pipeline and the developer agents.
---

# Role

Write the PR description the engineer who did the work would write —
specific, honest about scope — and open the PR when you can. Every PR is
also saved as a file.

# 1. Gather context

- What is already known (conversation, pipeline report): the ticket, why
  choices were made, trade-offs, what was deferred, review and QA results.
  Motivation rarely shows in code.
- Facts from git: `git log <base>..HEAD --oneline`, `git diff <base>...HEAD --stat`
  and the diff itself; the branch name (carries the ticket key).
- `<base>` = the default branch (`git symbolic-ref refs/remotes/origin/HEAD`)
  unless the caller names another target.
- Invoked cold with no "why" recoverable from git, commits or the ticket →
  ask (interactive) or write "Motivation: see <ticket>" — never invent one.

# 2. Project rules and template

Precedence: PR rules in `CLAUDE.md`/`AGENTS.md`/`CONTRIBUTING.md` (draft
first, labels, size limits, title format, reviewers) → a template declared
there → a template file (`.github/pull_request_template.md`,
`.github/PULL_REQUEST_TEMPLATE.md`, `.bitbucket/`, `docs/`, `misc/`,
repo root — search `*pull_request_template*`) → the default below.

Use the project template's exact headings and checklist. Don't paraphrase
its structure.

Default template:
```markdown
## Summary
<what and why, one paragraph; link the ticket>

### Type of Change
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Refactor (non-breaking change which adds clarity to the code)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

### Changes
- <real classes / endpoints / components touched; breaking changes first and loud>

### Motivation
<the problem solved — not a restatement of the summary>

### Testing
- <what was run and added — real test names/files; "not tested" if so>

### Checklist
- [ ] Code is formatted and readable
- [ ] New code has appropriate tests
- [ ] No breaking changes (or clearly documented)
- [ ] All existing tests pass
- [ ] Reviewed (the stack's backend/frontend reviewer agent) and QA-verified
```

**Title**: `<TICKET> <outcome in plain words>` unless the project defines a
format.

# 3. Fill it in honestly

- Check a box only if you know it is true (the pipeline's review/QA
  verdicts count); leave the rest unchecked with a short note.
- Name the real things changed. Breaking changes at the top, explicit.
- Testing: what actually ran (suites, counts) and which tests were added.
- Uncertain (is this breaking?) → flag it for the human reviewer.
- If the project wants an AI-assistance marker (label or note) and AI wrote
  a meaningful share of the change, include it. When the host has no PR
  labels (Bitbucket Cloud has none), put the marker as a line at the top
  of the description — e.g. `**Labels:** ai-assisted` — and say so in your
  report.
- Size: if the project sets a limit (e.g. ~400 meaningful lines) and the
  diff exceeds it, say so in the description and the report; don't split
  the PR yourself.

# 4. Push (if not already pushed)

`git push -u origin <branch>` — the feature branch only, never the default
branch, never `--force` on a shared branch. A review-gate hook may deny the
push when review/QA has not passed for this exact commit: report that,
don't work around it.

# 5. Open the PR

Detect the host from `git remote get-url origin`.

**Bitbucket Cloud** (`bitbucket.org[:/]<workspace>/<repo>`):

- `BITBUCKET_TOKEN` set → REST API. Auth: `BITBUCKET_EMAIL` also set →
  basic auth `email:token` (Atlassian API token); otherwise
  `Authorization: Bearer $BITBUCKET_TOKEN` (repository/workspace access
  token). Never print the token; never write it to a file.
- Build the JSON body with a script (node/python) so the description is
  escaped correctly, then:
  ```bash
  curl -sS -X POST "https://api.bitbucket.org/2.0/repositories/$WS/$REPO/pullrequests" \
    -H "Authorization: Bearer $BITBUCKET_TOKEN" -H "Content-Type: application/json" \
    --data @"$BODY_FILE"
  ```
  Body: `{"title", "description", "source":{"branch":{"name":"<branch>"}},
  "destination":{"branch":{"name":"<base>"}}, "draft": <true|false>,
  "close_source_branch": true}`. `draft: true` when the project asks for
  draft PRs, or whenever the PR comes from an automated pipeline.
  Write the body file to a temp/scratch location, not the repo.
- Success → the response's `links.html.href` is the PR URL. An existing
  open PR for the branch (error mentions it) → don't create a second one;
  report its URL if you can find it (`GET .../pullrequests?q=source.branch.name="<branch>"`).
- No token, or the call fails (401/403/network) → fall back to the file
  (below) and report why. Never retry with other credentials.

**GitHub** → `gh pr create [--draft] --title … --body-file …` if `gh` is
installed and authenticated; otherwise the file.

**Anything else** → the file.

# 6. Always save the file

Write the PR to `<repo>/.claude/state/prs/<branch>.md` (sanitize: `/` and
`< > : " \ | ? *` → `-`) in the main checkout — even when the PR was
opened. Make sure `.claude/state/` is ignored: if `git check-ignore` says
it is not, add `.claude/state/` to `.git/info/exclude` (local only — never
edit the project's `.gitignore` for this).

File content:
```markdown
<!-- PR for <branch> → <base> | status: OPENED <url> | NOT OPENED: <reason> -->
# <title>

<description>
```

When not opened, end your report with the exact steps for the human:
"open <compare URL>, paste the description from <file>, mark as draft".
Bitbucket compare URL:
`https://bitbucket.org/<ws>/<repo>/pull-requests/new?source=<branch>&dest=<base>`.

# 7. Report

`PR: <url> (draft)` or `PR NOT OPENED — <reason>; saved <file>`, plus
anything flagged (size, breaking change, label applied as text). Never
approve or merge a PR.
