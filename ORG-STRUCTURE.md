# Org structure — the pyramid

NextLevel is run by one person (Edouard) through a hierarchy of Claude Code
agents. This doc is the org chart. It replaces the previous "flat, everywhere"
setup where Edouard talked to whichever agent directly and information didn't
reliably flow anywhere.

```
                        Edouard (CEO)
                              │
                        Co-CEO (root session — see CLAUDE.md)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
 chief-of-engineering  chief-of-marketing    chief-of-finance
        │                     │                     │
   ┌────┼────┐          ┌─────┴─────┐         ┌─────┴─────┐
 backend frontend qa  content   client-ops  bookkeeping legal-
-engineer -engineer      -growth              -spend    compliance
```

## Levels

**Level 0 — CEO.** Edouard. Final say on money, legal risk, roadmap, hiring.

**Level 1 — Co-CEO** (`CLAUDE.md`, the root session). The only agent Edouard
talks to directly. Normalizes messy input into clear briefs, routes to the
right department head(s), reconciles their answers, and reports back up in
plain, decision-ready language. Never passes raw input down or raw sub-agent
output up.

**Level 2 — Department heads** (`.claude/agents/chief-of-*.md`). Each owns a
domain end-to-end and can delegate to its own sub-agents via the `Agent`
tool. Each head is responsible for the *quality and completeness* of what it
hands back to the Co-CEO — the Co-CEO should never have to re-check a head's
work for basic gaps.

| Head | Owns | Sub-agents |
|---|---|---|
| `chief-of-engineering` | apps/api, apps/dashboard, apps/admin, apps/widget, packages/*, infra/, CI | `backend-engineer`, `frontend-engineer`, `qa-release` |
| `chief-of-marketing` | growth, content, client-facing ops/support, positioning | `content-growth`, `client-ops` |
| `chief-of-finance` | spend, budget, invoicing, contracts, compliance/legal | `bookkeeping-spend`, `legal-compliance` |

**Level 3 — Specialists** (`.claude/agents/*.md`). Narrow-scope agents each
head delegates to for a specific kind of work. They report only to their
head, never directly to the Co-CEO or Edouard.

## Information flow rules

1. **Down = briefs.** Every level down gets a structured, scoped brief, not
   a forwarded raw message.
2. **Up = synthesis.** Every level up gets a reconciled answer, not a
   transcript dump.
3. **No skipping levels.** Edouard doesn't need to talk to a specialist
   directly, and a specialist doesn't report to Edouard. If a shortcut seems
   necessary, that's a sign the head's brief was incomplete — fix the brief,
   don't bypass the level.
4. **Cross-department asks get split, not forwarded whole.** The Co-CEO
   decomposes multi-domain asks into one brief per department before
   delegating.
5. **Escalation is explicit.** A head escalates to the Co-CEO only for: cross
   -department conflicts, anything needing Edouard's judgment (money/legal/
   roadmap calls), or blockers outside its own authority.

## Adding a new agent

- New specialist → add `.claude/agents/<name>.md`, list it under the right
  head's "Sub-agents" row above, and add it to that head's delegation list in
  its own file.
- New department → add a `chief-of-*.md`, add a row to the table above, and
  add it to the Co-CEO's routing list in `CLAUDE.md`.

## Status

This is the first draft of the pyramid (2026-07-03). The previous setup had
agents defined ad hoc with no fixed reporting lines — this file and the
`.claude/agents/` directory are the source of truth going forward. If other
agent definitions exist elsewhere (a separate docs vault, another repo), they
should be reconciled into this structure rather than run in parallel.
