---
name: sonarqube-check
description: Check a change against the project's SonarQube quality gate — bugs, vulnerabilities, code smells, security hotspots, coverage, and duplication — scoped to the current branch/PR, not a whole-project audit. Invoke after implementing a change and before merging, after the CI pipeline has analysed the branch (results exist only after a pipeline run), alongside the stack's backend/frontend reviewer agent, or whenever asked "does this pass quality gate" / "check SonarQube."
---

# Role

Query the project's SonarQube server for what it already knows about this
change, and report it plainly. This is read-only: report findings, don't
resolve them. Fixing a flagged issue goes to the stack's backend/frontend
developer agent; dismissing one as a false positive or an accepted risk is
the user's call, not yours to make silently.

This complements the stack's backend/frontend reviewer agent, not replaces it: SonarQube does the
mechanical, rule-based detection reliably (magic numbers, cognitive
complexity, duplication, known vulnerability patterns) — let it own that.
The reviewers are for the judgment calls a static analyzer can't make
(architecture fit, whether the tests actually prove the right thing).

# Scope

Default to the current branch or pull request, not a full-project audit —
matching how the reviewers scope to the diff. Use `list_pull_requests` /
`list_branches` to identify the right one if it isn't obvious, and pass
`branch` or `pullRequest` to the scoped tools below. Only run a
full-project sweep if explicitly asked for one.

# Checking Quality Gate

1. Confirm the project: `search_my_sonarqube_projects` if it isn't obvious
   which project maps to this repo.
2. `get_project_quality_gate_status` (branch/PR-scoped) — the headline
   pass/fail, and which specific conditions are failing.
3. For each failing condition, pull the detail:
   - `search_sonar_issues_in_projects` for bugs, vulnerabilities, and code
     smells introduced in this branch/PR.
   - `search_security_hotspots` for anything needing manual security review.
   - `get_component_measures` / `search_files_by_coverage` /
     `get_file_coverage_details` for coverage gaps.
   - `search_duplicated_files` / `get_duplications` for duplication.
   - `search_dependency_risks` for new dependency vulnerabilities, if available.
4. Use `show_rule` to explain *why* something was flagged, not just the
   rule ID — a rule code means nothing to someone who has to fix it.

# Reporting

Structure it the same way as the reviewers:

## Quality Gate: PASS / FAIL
## 🔴 Blocking — failing conditions, must resolve before merge
## 🟡 Non-blocking — flagged but not gating (e.g. minor code smells)
## ✅ Clean — what's passing

For each issue: file + line, what SonarQube flagged and why (via
`show_rule`), and a concrete fix. Don't just repeat the rule name.

# What This Skill Doesn't Do

- Doesn't call `change_sonar_issue_status` or `change_security_hotspot_status`
  — marking something a false positive or an accepted risk is a judgment
  call for the user, not something to do quietly while "checking."
- Doesn't run a full-project audit unless asked — see Scope above.
- If no SonarQube MCP is connected, say so plainly rather than guessing at
  what a scan might find.
