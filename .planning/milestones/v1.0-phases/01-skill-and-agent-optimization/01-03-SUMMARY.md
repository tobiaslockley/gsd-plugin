---
phase: 01-skill-and-agent-optimization
plan: 03
subsystem: config
tags: [claude-md, token-optimization, minimal-mode, context-reduction]

# Dependency graph
requires:
  - phase: 01-skill-and-agent-optimization
    provides: "Fork-isolated orchestrator commands (Plan 01) and enhanced agent definitions (Plan 02)"
provides:
  - "Minimal CLAUDE.md (~174 words vs ~2338) reducing per-query token overhead by ~92%"
  - "generate-claude-md --minimal flag for regeneration without reverting to full mode"
affects: [mcp-server, plugin-packaging]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "--minimal flag on generate-claude-md replaces 4 heavy sections with one-line placeholders"
    - "Marker-bounded sections preserved so --force regeneration works in both full and minimal modes"

key-files:
  created: []
  modified:
    - "CLAUDE.md"
    - "~/.claude/get-shit-done/bin/lib/profile-output.cjs"
    - "~/.claude/get-shit-done/bin/gsd-tools.cjs"

key-decisions:
  - "Placeholder text 'Loaded on demand by GSD commands.' chosen to signal context is available but deferred"
  - "Workflow and profile sections preserved in minimal mode -- workflow enforcement needed for all queries, profile is user-configured"

patterns-established:
  - "Minimal vs full CLAUDE.md modes: --minimal for daily use, default for full regeneration"

requirements-completed: [SKILL-02]

# Metrics
duration: 2min
completed: 2026-04-01
---

# Phase 01 Plan 03: CLAUDE.md Minimal Mode Summary

**Reduced CLAUDE.md from ~2,338 to ~174 words (~92% reduction) by adding --minimal flag to generate-claude-md that replaces project/stack/conventions/architecture sections with on-demand placeholders**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T12:18:16Z
- **Completed:** 2026-04-01T12:20:04Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 3

## Accomplishments
- Added `--minimal` flag to `gsd-tools.cjs` and `profile-output.cjs` so `generate-claude-md --minimal` produces a lightweight CLAUDE.md
- Reduced CLAUDE.md from ~2,338 words to ~174 words -- project, stack, conventions, and architecture sections replaced with "Loaded on demand by GSD commands."
- Workflow enforcement section and developer profile section preserved intact
- Regeneration with `--minimal --force` produces stable output (does not revert to full mode)
- Default behavior (without --minimal) unchanged -- full CLAUDE.md still generated when needed

## Task Commits

1. **Task 1: Update generate-claude-md to support --minimal flag** - Applied to `~/.claude/get-shit-done/` (non-git tool directory)
2. **Task 2: Regenerate CLAUDE.md in minimal mode** - `c054d33` (feat)
3. **Task 3: Verify GSD commands still work** - Auto-approved checkpoint

**Plan metadata:** (see final docs commit)

## Files Created/Modified
- `CLAUDE.md` - Reduced from ~2,338 to ~174 words with minimal placeholders for 4 sections
- `~/.claude/get-shit-done/bin/lib/profile-output.cjs` - Added `options.minimal` conditional in `cmdGenerateClaudeMd` to skip heavy sections
- `~/.claude/get-shit-done/bin/gsd-tools.cjs` - Added `--minimal` flag parsing in `generate-claude-md` case

## Decisions Made
- Placeholder text is "Loaded on demand by GSD commands." -- concise signal that context exists but is deferred to skill execution
- Workflow and profile sections are never minimized -- workflow enforcement is needed for all queries regardless of GSD context, and profile is user-configured content
- The `source:minimal` marker attribute in GSD section comments enables future tooling to detect minimal vs full mode

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all changes are complete with no placeholder values that affect functionality.

## Next Phase Readiness
- Phase 01 is now complete: all 3 plans (skill fork, agent enhancement, CLAUDE.md slimming) delivered
- SKILL-01 and SKILL-02 requirements satisfied
- Ready for Phase 02 (MCP server for structured state exposure) or phase transition

---
*Phase: 01-skill-and-agent-optimization*
*Completed: 2026-04-01*

## Self-Check: PASSED

- CLAUDE.md: FOUND (174 words)
- 01-03-SUMMARY.md: FOUND
- profile-output.cjs: FOUND with minimal flag
- gsd-tools.cjs: FOUND with minimal flag
- Commit c054d33: FOUND
- Note: Tool files in ~/.claude/get-shit-done/ are non-git, verified on filesystem
