---
name: development-conventions
description: Shared engineering discipline for the agents that write code or technical documents — state assumptions up front and stop on real ambiguity, minimum-footprint changes, surgical diffs, and reproduce-before-fix for bugs. Use before implementing a ticket, fixing a bug, refactoring, or drafting a plan/spec, in any stack. The project's own conventions always win.
---

# Development Conventions

Defaults for how work gets done, not just how it's delivered (see
`delivery-conventions` for branching/commits/docs). They exist so every
agent reasons and cuts code the same way — not to override a project that
already decided otherwise.

## 1. Assumptions first

- Before acting, work out what you're assuming (about the requirement,
  the data, the existing contract, the environment) and say so in your
  report rather than burying the guess in the diff.
- A gap that changes the outcome — ambiguous requirement, missing contract,
  a choice only the user/architect can make — is a stop, not a guess: use
  `NEEDS-DECISION` (or ask directly, if you can talk to the user), state
  the question and your recommended answer, and finish everything that
  doesn't depend on it first.
- Don't block on things with no real impact (naming bikeshedding, a style
  choice the linter already enforces) — make the reasonable call, note it,
  move on.

## 2. Minimum footprint

- Write the least code that satisfies the requirement and stays readable
  by someone unfamiliar with the task. A straightforward 50-line version
  beats a 200-line one carrying patterns nobody asked for.
- No speculative generality: no parameter, flag, hook or abstraction layer
  for a use case that doesn't exist yet in the ticket or contract.
- Prefer the obvious construct over a language "party trick" (heavy
  reflection, dense one-liners, operator overloading used for cleverness)
  when it would make the code harder to follow for a reader who doesn't
  know the trick — unless the surrounding codebase already relies on it.

## 3. Surgical diffs

- Touch only the lines the change requires. No drive-by reformatting,
  reordering, or renaming of code you didn't need to change.
- Delete only what the change makes dead or directly supersedes. An
  unrelated issue you notice gets reported, not fixed — unless it's a
  one-line, zero-risk fix directly adjacent to what you're already editing.
- A refactor stays behavior-preserving unless the ticket asks for a
  behavior change; if a change mixes the two, land them as separate
  commits so the diff stays readable.

## 4. Reproduce before you fix

- For a bug fix: write a test that fails for the reported reason first
  (a real assertion failure, not a compile error), confirm it fails, then
  make it pass with the smallest change that does. The test stays — it's
  the record that this exact failure can't recur silently.
- This is the project's usual TDD loop (see the stack's testing skill —
  `xunit`, `kotlin-testing`/`android-testing`, `angular-testing`) applied
  specifically to defects, not a separate practice to layer on top.

## Precedence

The project's own `CLAUDE.md`/`AGENTS.md`, README, linter/formatter config
and existing code conventions win over anything above.
