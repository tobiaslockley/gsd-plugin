---
phase: quick-260410-0np
plan: 01
subsystem: docs/community
tags: [docs, community, discussion-post, gsd-upstream]
requires: []
provides:
  - "DISCUSSION-POST.md: ready-to-paste GitHub Discussions post introducing claude-code-gsd"
affects: []
tech_stack:
  added: []
  patterns: []
key_files:
  created:
    - .planning/quick/260410-0np-draft-gsd-discussions-post-introducing-p/DISCUSSION-POST.md
  modified: []
decisions:
  - "Framed post as community discussion (not feature request) per upstream maintainer Tom Boucher's guidance"
  - "Chose title 'Sharing claude-code-gsd: a Claude Code plugin packaging of GSD — would upstream integration be useful?' — invitation-shaped, not PR-shaped"
  - "Included repo URL as markdown link placeholder with HTML comment instructing user to confirm before posting"
  - "Omitted v1.0 execution-time metric (~60 minutes across 27 tasks) as too internal for community framing"
metrics:
  duration: "~2 minutes"
  completed: 2026-04-10
  tasks_completed: 1
  files_changed: 1
---

# Quick Task 260410-0np: Draft GSD Discussions Post Summary

One-liner: Drafted a ready-to-paste GitHub Discussions post introducing claude-code-gsd to the upstream GSD community, framed as a community-interest discussion per maintainer guidance.

## What Was Built

A single markdown file at `.planning/quick/260410-0np-draft-gsd-discussions-post-introducing-p/DISCUSSION-POST.md` containing a complete, ready-to-paste GitHub Discussions post. The post follows the plan's 7-section structure:

1. **Title** (H1): "Sharing claude-code-gsd: a Claude Code plugin packaging of GSD — would upstream integration be useful?"
2. **Opening paragraph**: Credits Lex Christopherson (TACHES) and GSD 1.32.0, states what was built in one sentence, sets the Discussion (not Feature Request) framing per Tom's guidance.
3. **Why I built it**: Four bullets covering per-turn token overhead pain, unsustainable fork maintenance (8-16+ hrs/month), additive constraint (multi-CLI compat), and the six integration seams in Claude Code's public extension points.
4. **What it does**: Five bullets covering single-step install, plugin contents (60 skills, 21 agents, MCP server, hooks), CLAUDE.md reduction (~2,338 -> ~174 words, ~92%), MCP state surface (6 resources + 10 tools), and memdir persistence.
5. **What it is NOT**: Three bullets establishing it's not a fork, not a replacement for multi-CLI compat, and not yet a feature request.
6. **The open question**: Three specific discussion prompts for the community plus an offer to share implementation details.
7. **Links**: Repo link placeholder (with confirm-before-posting HTML comment) and credit line for GSD 1.32.0.

## Post Statistics

- **Final title chosen**: "Sharing claude-code-gsd: a Claude Code plugin packaging of GSD — would upstream integration be useful?"
- **Approximate word count**: ~575 words total (title + body). Body is roughly 555 words — slightly above the plan's soft 300-500 target, but the plan prioritized scannability over strict word count, and the post uses short paragraphs plus bullets throughout.
- **Line count**: 41 lines (meets plan's min_lines: 40)
- **Anchors present**: `claude-code-gsd`, `gsd-plugin`, `92%`, `2,338`, `174`, `60 skills`, `21 agents`, `MCP`, `community`, `Discussion`

## Source Facts Traceability

Every factual claim in the post traces to the plan's `<source_facts>` block, which was drawn from PROJECT.md and STATE.md:

| Claim in post | Source |
| --- | --- |
| ~92% CLAUDE.md reduction, ~2,338 -> ~174 words | PROJECT.md validated requirement (v1.0) |
| 60 skills, 21 agents | PROJECT.md validated requirement (v1.0) |
| 6 MCP resources, 10 MCP tools | PROJECT.md validated requirement (v1.0) |
| Single-step install `claude plugin install gsd` | PROJECT.md validated requirement (v1.0) |
| 8-16+ hrs/month fork maintenance | PROJECT.md Key Decisions ("No fork" rationale) |
| Six integration seams in Claude Code | PROJECT.md validated requirement (existing) |
| GSD 1.32.0 base, Lex Christopherson / TACHES credit | PROJECT.md Context |
| Multi-CLI compat as core property | PROJECT.md Constraints |
| memdir persistence for phase outcomes and decisions | PROJECT.md validated requirements (v1.0) |

## Facts Omitted From Post (and Why)

- **v1.0 execution stats** (3 phases, 10 plans, 27 tasks, ~60 minutes): too internal — community cares about what the plugin does, not how many GSD phases produced it. Including it would read as self-congratulation rather than motivation.
- **Specific tech internals** (~14k LOC in bin/*.cjs, ~573 LOC MCP server, ~21k LOC across skills): not useful for gauging community interest; available on request ("happy to share implementation details").
- **`context: 'fork'` skill changes, `.claude/agents/*.md` enhancements**: implementation detail, not relevant to the "is this interesting?" question.
- **`CLAUDE_PLUGIN_ROOT` env var, lightweight MCP transport, self-contained skills architecture decisions**: internal engineering decisions from PROJECT.md Key Decisions table — too deep for a discussion opener.
- **"Published as jnuyens/gsd-plugin"**: included only as the repo link, not called out separately, to avoid looking promotional.

## Tone / Style Compliance

- **No emojis** (verified by manual read-through)
- **No superlatives** ("revolutionary", "game-changing", etc.) — verified absent
- **Motivation before solution** — "Why I built it" section precedes "What it does"
- **Explicit Discussion framing** — opening and "What it is NOT" both say this is not yet a feature request
- **Acknowledges maintainer** — Lex (TACHES) credited at the top, Tom referenced as the one who suggested posting here first
- **Acknowledges multi-CLI compat boundary** — explicitly called out in "What it is NOT"
- **Open question ends the body** — three specific community prompts plus an offer to share more

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Force-added DISCUSSION-POST.md past .gitignore rule**

- **Found during**: Task 1 commit step
- **Issue**: `.gitignore` at repo root contains a broad `.planning/` rule that would have silently prevented `git add` from staging the required deliverable. Plan constraints explicitly mandate committing the file atomically.
- **Fix**: Used `git add -f` to force-add only the single DISCUSSION-POST.md file past the ignore rule. This is the standard git mechanism for tracking a specific file when the parent directory is broadly ignored. No `.gitignore` modification, no impact on other ignored `.planning/` contents.
- **Files modified**: `.planning/quick/260410-0np-draft-gsd-discussions-post-introducing-p/DISCUSSION-POST.md` (force-added)
- **Commit**: `56f8a73`
- **Rationale**: The upstream GSD orchestrator framework clearly assumes `.planning/` artifacts (STATE.md, ROADMAP.md, SUMMARY.md files) get committed — the `final_commit` instructions in the executor spec explicitly commit `.planning/STATE.md` and `.planning/ROADMAP.md`. The current `.gitignore` state appears to be a recent change that conflicts with the GSD workflow, but that's a larger scoped issue for a different task. For this task, force-adding the one required deliverable satisfies the plan's atomic-commit constraint without touching unrelated files.

**2. [Tightening pass] Post body trimmed on second write**

- **Found during**: Task 1 verification
- **Issue**: First draft came in at 645 words total — above the plan's soft 300-500 body-word target.
- **Fix**: Rewrote tighter, landing at 575 words total (~555 body). Still slightly over the soft target, but the plan explicitly says "reasonable target" and prioritizes scannability, which the bullet-heavy structure delivers. All required anchor facts preserved.
- **Not tracked as a separate commit** (same task, pre-commit edit).

### Architectural Changes

None.

### Authentication Gates

None.

## Deferred Issues

None related to this task.

Out-of-scope observation (NOT fixed, logged here for visibility only): The repo-root `.gitignore` has `.planning/` which conflicts with the GSD workflow's expectation that STATE.md, ROADMAP.md, and SUMMARY.md files get committed. This should be addressed by a separate task — likely a narrower `.gitignore` rule that excludes transient planning state while preserving artifacts meant for commit. Not in scope for this quick task.

## Next Steps for the User

1. **Open** `.planning/quick/260410-0np-draft-gsd-discussions-post-introducing-p/DISCUSSION-POST.md`
2. **Confirm the repo URL** in the Links section: currently `https://github.com/jnuyens/gsd-plugin`. There is an HTML comment (`<!-- confirm this URL before posting -->`) next to it as a reminder. If the repo has moved or a different canonical URL is preferred, replace it.
3. **Copy the entire file contents** (the file contains only the post — no frontmatter, no meta-commentary).
4. **Paste into a new GitHub Discussion** in the upstream GSD repository (`gsd-build/get-shit-done`). Choose a category like "Ideas" or "Show and tell" depending on what the upstream repo uses.
5. **Remove the HTML comment** after confirming the URL — GitHub Discussions will render it invisibly, but it's cleaner without.
6. **If the community shows interest**, write up a follow-up Feature Request with the full spec — the discussion thread will tell you which parts resonated most.

## Success Criteria Check

- [x] Single markdown file at the required path, ready to paste into GitHub Discussions unchanged (modulo the user confirming the repo URL)
- [x] Every metric in the post traces back to PROJECT.md or STATE.md
- [x] The post reads as "here's what I made, is this interesting to you?" rather than "please merge my work"
- [x] The user can open the file, copy all of it, paste into GitHub Discussions, and have a complete post

## Self-Check: PASSED

- File at `.planning/quick/260410-0np-draft-gsd-discussions-post-introducing-p/DISCUSSION-POST.md`: FOUND (verified via `test -s`)
- All required anchors present: FOUND (`claude-code-gsd`/`gsd-plugin`, `92%`/`2,338`/`174`, `60 skills`, `21 agents`, `MCP`, `community`/`Discussion`)
- Commit `56f8a73`: FOUND (`docs(quick-260410-0np): draft GSD Discussions post introducing claude-code-gsd`)
- Line count 41 >= min_lines 40: PASS
- No emojis: PASS
- No marketing superlatives: PASS
