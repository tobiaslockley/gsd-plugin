---
phase: 02-mcp-server
plan: 02
subsystem: infra
tags: [mcp, tools, mutations, workflow, new-project]

requires:
  - phase: 02-mcp-server
    provides: MCP server with resources (Plan 01)
provides:
  - 10 MCP tools for workflow mutations (init, status, advance, metric, transition, decision, blocker, session, commit)
  - Updated new-project workflow creates .mcp.json for all new GSD projects
affects: [workflows, mcp-server]

tech-stack:
  added: [zod/v3 schemas for MCP tool input validation]
  patterns: [captureCmd wrapper for safe cmd* invocation, execSync for git operations]

key-files:
  created: []
  modified:
    - ~/.claude/get-shit-done/mcp/server.cjs
    - ~/.claude/get-shit-done/workflows/new-project.md

key-decisions:
  - "Used captureCmd wrapper to intercept process.stdout.write and process.exit for safe cmd* invocation"
  - "Used zod/v3 for tool input schemas (bundled with MCP SDK, compatible with McpServer.tool())"
  - "gsd_commit_docs uses child_process.execSync instead of captureCmd (git needs real process context)"
  - "gsd_advance_plan takes no arguments (operates on current state)"

patterns-established:
  - "captureCmd pattern for wrapping GSD lib functions that call process.exit"
  - "MCP tool error handling: try/catch returning isError:true content"

requirements-completed: [MCP-02]

duration: 10min
completed: 2026-04-04
---

# Phase 02 Plan 02: MCP Tools for Workflow Operations Summary

**10 MCP tools for GSD workflow mutations with captureCmd wrapper for safe cmd* invocation, plus new-project workflow updated to create .mcp.json**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-03T22:08:10Z
- **Completed:** 2026-04-04T22:18:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- 10 coarse-grained MCP tools registered: gsd_init_phase, gsd_plan_status, gsd_advance_plan, gsd_record_metric, gsd_transition_phase, gsd_add_decision, gsd_add_blocker, gsd_resolve_blocker, gsd_record_session, gsd_commit_docs
- captureCmd helper intercepts process.stdout.write + process.exit for safe cmd* invocation
- All tools have typed Zod input schemas and descriptive docstrings
- new-project workflow creates .mcp.json in both auto and interactive modes
- Handles both commit_docs=yes (commit) and commit_docs=no (gitignore) paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Add MCP tools for workflow operations** - (no git commit — ~/.claude files outside repo)
2. **Task 2: Update new-project workflow to create .mcp.json** - (no git commit — ~/.claude files outside repo)

## Files Created/Modified
- `~/.claude/get-shit-done/mcp/server.cjs` - Added captureCmd helper + 10 MCP tool registrations
- `~/.claude/get-shit-done/workflows/new-project.md` - Added .mcp.json creation in both auto and interactive modes

## Decisions Made
- Used captureCmd pattern (intercept stdout + exit) rather than child_process for most tools — faster and avoids spawning subprocesses
- Exception: gsd_commit_docs uses execSync because git operations need real process context
- Used zod/v3 for schemas (both v3 and v4 are bundled by MCP SDK; v3 is more widely documented)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- All modified files are at ~/.claude/get-shit-done/ which is outside the project git repo, so no git commits for the implementation code itself

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 02 complete: MCP server has both resources (Plan 01) and tools (Plan 02)
- Ready for verification

---
*Phase: 02-mcp-server*
*Completed: 2026-04-04*
