# Changelog

All notable changes to the `dev-team` plugin are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the plugin follows [Semantic Versioning](https://semver.org/).

## [2.2.0] - 2026-10-22

### Added

- Agent `ux-specialist`: user research, flows, interaction/component specs, accessibility review, and design-QA of implemented UI against its own spec. Stack-agnostic — serves Angular and Android frontends alike. Modes: `spec`, `design-qa`, `guidance`.
- `software-architect` design mode now returns a `UX spec needed: YES|NO` verdict, same standing as the ADR call.
- `development-pipeline`: optional stage 1b runs `ux-specialist` (mode spec) when the architect says a UX spec is needed; the frontend developer builds against it alongside the API contract; `ux-specialist` (mode design-qa) runs alongside the frontend reviewer in the review loop and its findings merge into the same `fix-findings` round. State file gained a `ux` block (`specNeeded`, `specPath`, `designQa`).
- `delivery-conventions` §6: where UX research/flows/specs/reviews/decisions-log documents go, following the same project-declared → existing-folder → default-root precedence as §5.

## [2.1.0] - 2026-10-22

### Added

- Kotlin/JVM backend pair: agents `backend-developer-kotlin` and `backend-reviewer-kotlin`, skill `kotlin-testing` (JUnit 5/Kotest, MockK, coroutine test conventions).
- Android frontend pair: agents `frontend-developer-android` and `frontend-reviewer-android`, skill `android-testing` (JUnit, MockK, Turbine, Jetpack Compose UI tests).
- `stack-detection`: added `kotlin` (backend) and `android` (frontend) rows to the marker tables and the agent-pairs table — no longer reported as unsupported.

## [2.0.0] - 2026-10-22

### Added

- Skill `stack-detection`: identifies a project's backend/frontend tech stack from repo file markers (not README claims) and maps it to the matching developer/reviewer agent pair. Wired into `development-pipeline` (repo preflight) and `software-architect` (Before Anything).

### Changed

- **Breaking:** renamed agents to carry their stack explicitly, so multiple stacks per role can coexist — `backend-developer` → `backend-developer-dotnet`, `backend-reviewer` → `backend-reviewer-dotnet`, `frontend-developer` → `frontend-developer-angular`, `frontend-reviewer` → `frontend-reviewer-angular`. Update any direct `subagent_type` invocations or saved docs that used the old names.
- `development-pipeline` stores the detected `stack` in its state file and resolves the backend/frontend agent pair from it instead of hardcoding `.NET`/Angular agent names.

## [1.0.0] - 2026-10-22

### Added

- Marketplace `nameless-marketplace` and plugin `dev-team`.
- Agents: software-architect, product-owner, qa-engineer, backend-developer, frontend-developer, backend-reviewer, frontend-reviewer.
- Skills: development-pipeline, epic-brainstorm, product-owner, developer-brainstorm, development-council, adr-writer, delivery-conventions, pr-writer, sonarqube-check, angular-testing, xunit.
- Hook `require-review.cjs`: denies `git push` without a passed review and QA marker.
