# Claude Code + GSD Integration Feasibility Study

## What This Is

A feasibility analysis comparing approaches for integrating the GSD ("Get Shit Done") workflow system directly into the Claude Code CLI codebase. The goal is to determine whether a deeper integration would reduce the token overhead and wall-clock time of GSD's orchestration layer, and if so, which integration approach offers the best tradeoff.

## Core Value

Determine whether integrating GSD into Claude Code is worth pursuing, with a clear recommendation backed by evidence from both codebases.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Analyse GSD's current architecture and how it interfaces with Claude Code
- [ ] Quantify the token/time overhead of GSD running as an external layer
- [ ] Identify integration points in Claude Code's internals (tool system, commands, state)
- [ ] Compare integration approaches: fork & merge, tight plugin, native extension
- [ ] Assess maintenance burden for each approach given Claude Code's update cadence
- [ ] Produce a clear recommendation: integrate or don't bother

### Out of Scope

- Actually implementing any integration — this is analysis only
- Modifying the Claude Code codebase — read-only analysis
- Benchmarking GSD against other workflow tools — not a comparison study
- UI/UX redesign of GSD — focus is on architecture and performance

## Context

**Claude Code** is Anthropic's official CLI for Claude — a large TypeScript/React/Ink terminal application with a streaming query engine, modular tool system, and plugin architecture via MCP. It updates roughly monthly.

**GSD** is a workflow orchestration layer that runs on top of Claude Code via slash commands, CLAUDE.md injection, and subagent spawning. It manages project planning (PROJECT.md, ROADMAP.md, REQUIREMENTS.md), phase execution with parallel agents, and verification loops.

**Current integration:** GSD lives in `~/.claude/get-shit-done/` and hooks into Claude Code through:
- Custom slash commands (skills) registered in settings
- CLAUDE.md files for context injection
- The Agent tool for spawning subagents (gsd-planner, gsd-executor, etc.)
- Node.js CLI tools (`gsd-tools.cjs`) for state management

**Pain point:** Both token cost and wall-clock time. GSD orchestration prompts consume significant context, and agent spawning adds latency. A tighter integration could reduce this overhead.

**User profile:** Solo developer, daily GSD user, exploring out of curiosity rather than commitment.

## Constraints

- **Read-only**: Analysis only, no code changes to either codebase
- **Solo effort**: Any recommended integration must be maintainable by one person
- **Update cadence**: Claude Code updates ~monthly; integration must survive upstream changes
- **GSD compatibility**: GSD also works with other AI CLIs (not just Claude Code)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Feasibility study first | Understand cost/benefit before investing effort | -- Pending |
| Compare all approaches | Fork, plugin, and native — evaluate each fairly | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 after initialization*
