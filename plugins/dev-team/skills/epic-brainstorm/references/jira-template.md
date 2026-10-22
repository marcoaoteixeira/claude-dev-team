# Jira-ready doc template (`<Slug>-Epic-Jira.md`)

Clean rewrite of the closed brainstorm. No question history; no decision IDs in the body. Concise — readers skim.

~~~markdown
# <Epic name>

**Type:** Epic · **Key:** [<KEY>](<url>) · **Space:** <Space (KEY)> · **Team:** <Team>
**Source:** brainstorming doc `<Slug>-Epic.md` (decision refs D1–D<n>)

---

## Summary

<What changes and why, 1 short paragraph.>

This epic:
1. **<Part 1>** — <one line>
2. **<Part 2>** — <one line>

## Background

- **Current state:** <facts, with ticket keys>
- **<Source / model>** — [link](<url>): <one line>
- **Existing building blocks:** <what already exists and is reused>

## Flow   (or "Domain model")

```
<final ASCII diagram, no decision IDs>
```

## Scope

### 1. <Part 1>
- **<Topic>:** <rule>.

### 2. <Part 2>
- …

## Out of scope
- <item>

## Dependencies
| Dependency | Owner |
|------------|-------|
| <what> | <team / TBD> |

## To settle at refinement
- <minor open item>

## Candidate tickets

| Area | Ticket | Acceptance criteria |
|------|--------|---------------------|
| <Part> | BE/FE/Ops: <title> | <testable criteria, short sentences> |
| Quality | Tests / E2E for <area> | <cases covered> |

## References
- Confluence: <links>
- Jira: <keys>
~~~

When writing to Jira: drop the H1 title and the **Source** line (local path means nothing to readers); keep the rest as markdown.
