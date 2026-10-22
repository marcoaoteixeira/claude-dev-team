# Brainstorm doc template (`<Slug>-Epic.md`)

Fill in what is known; leave sections short. Replace `<…>`.

~~~markdown
# Epic (DRAFT): <Epic name>

| Field   | Value |
|---------|-------|
| Jira    | <KEY-123 link, or "not created yet"> |
| Team    | <Team> |
| Space   | <Space (KEY)> |
| Owner   | <if known from sources> |
| Status  | Brainstorming — Part 1 (<name>) in progress |
| Updated | <YYYY-MM-DD> |

> This draft contains only what is confirmed by the product owner, sources, or existing tickets.
> Anything not confirmed is listed under **Open Questions** rather than assumed.
> Work proceeds part by part.

---

## 1. Summary

<2–4 sentences in the user's own terms. List the parts.>

## 2. Decisions (confirmed by product owner)

| # | Decision |
|---|----------|
| D1 | **<Short bold statement.>** <Detail.> (Q1.1) |
| ~~D2~~ | ~~<old>~~ **Superseded by D9:** <new>. |

## 3. Background (what exists today)

**<Source title>** — [link](<url>):
- <Fact relevant to the epic.>

**Related epics / tickets (context only):** <KEY — one line each>

## 4. Part 1 — <Name>

**Goal (from product owner):** <user's words>

**Confirmed:** D1, D3–D5.

### Working flow (from D…)

```
<ASCII flow or model; annotate each element with its decision ID>
```

### Answered — Part 1 (first batch)

| # | Question | Answer |
|---|----------|--------|
| ~~Q1.1~~ | <short question> | <short answer> → D3 |

### Open questions — Part 1 (second batch)

| # | Question | Why it matters |
|---|----------|----------------|
| Q1.5 | <question, with A/B options or an example if ambiguous> | <one line> |

**Part 1: closed.**   ← when done

## 5. Part 2 — <Name>
<same structure>

## N. Dependencies

| Dependency | Owner | Source |
|------------|-------|--------|
| <what> | <team / TBD> | <decision or page> |
~~~

Conventions:
- Decisions: global numbering `D<n>`; questions per part `Q<part>.<n>`.
- Every decision references the question (or source) it came from.
- Never delete a superseded decision — strike it and point forward.
- Example payloads/messages the user provides go verbatim in a code block in the relevant part, followed by "Observations (facts only)".
