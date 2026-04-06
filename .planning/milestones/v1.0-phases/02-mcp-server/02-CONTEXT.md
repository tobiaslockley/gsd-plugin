# Phase 2: MCP Server - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a GSD MCP server that exposes project state (current phase, requirements, roadmap, config) as queryable MCP resources and workflow operations (init, plan, execute, read-state, transition, verify) as structured MCP tools. The server auto-starts when a `.planning/` directory is detected in the project. This replaces BashTool-to-gsd-tools roundtrips and eliminates prompt-injected orchestration context for state queries.

</domain>

<decisions>
## Implementation Decisions

### Transport Protocol
- **D-01:** Use stdio transport for the MCP server. This is the standard pattern for local MCP servers in Claude Code (see context7, firebase, imessage plugins). stdio is simpler than HTTP, requires no network configuration, and Claude Code manages the server lifecycle (spawn/kill) automatically. HTTP transport is unnecessary since GSD targets local single-user operation.

### Resource vs Tool Boundary
- **D-02:** MCP resources expose read-only project state: current phase info, roadmap overview, requirements status, STATE.md content, config values, and phase CONTEXT.md files. These are queryable without side effects.
- **D-03:** MCP tools expose operations that mutate state: phase transitions, plan advancement, decision recording, blocker management, commit operations, state updates, and session recording. Tools use typed Zod schemas matching gsd-tools.cjs validation.

### Tool Granularity
- **D-04:** Provide coarse-grained MCP tools that wrap workflow-level operations rather than mirroring every gsd-tools.cjs atomic command 1:1. This reduces tool count in the model's context (fewer tools = fewer tokens for tool descriptions) and aligns with the project goal of reducing token overhead. Example: a single `gsd_init_phase` tool instead of separate `find-phase` + `state load` + `roadmap get-phase` calls.
- **D-05:** Expose 8-12 high-level tools (init, plan-status, advance-plan, record-metric, transition-phase, add-decision, add-blocker, resolve-blocker, record-session, commit-docs) rather than 40+ atomic operations. The MCP server internally calls gsd-tools.cjs library functions (imported from `bin/lib/*.cjs`) for implementation.

### Auto-Start Mechanism
- **D-06:** Use a project-level `.mcp.json` file in the project root to register the GSD MCP server. This is the standard Claude Code pattern for project-specific MCP servers (no user-level config needed, works automatically when cloning the project). The `.mcp.json` points to the server entry point in `~/.claude/get-shit-done/mcp/` (or wherever the GSD MCP server lives).
- **D-07:** The requirement "auto-starts when `.planning/` directory is detected" is satisfied by the `.mcp.json` being present in the project root. For non-GSD projects (no `.planning/`), the `.mcp.json` is simply not present. The GSD init workflow (`/gsd:new-project`) creates `.mcp.json` alongside `.planning/`.

### Server Implementation
- **D-08:** Implement the MCP server in Node.js/JavaScript (CommonJS) to match the existing gsd-tools.cjs ecosystem. The server reuses `bin/lib/*.cjs` modules directly rather than shelling out to the CLI. This eliminates the BashTool roundtrip that is the primary latency and token cost of the current architecture.
- **D-09:** The MCP server is a single-file entry point (e.g., `~/.claude/get-shit-done/mcp/server.cjs`) that imports from `bin/lib/` and registers resources and tools via the MCP SDK (`@modelcontextprotocol/sdk`).

### Claude's Discretion
- Exact MCP resource URI naming scheme (e.g., `gsd://state/current-phase` vs `gsd:///roadmap`)
- Error response formatting in MCP tool results
- Whether to include a `gsd_health` diagnostic tool
- Resource caching strategy (if any) for frequently-read state files
- Exact Zod schema shapes for each tool's input parameters

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### GSD Tools Implementation
- `~/.claude/get-shit-done/bin/gsd-tools.cjs` -- Main CLI entry point; documents all available commands and their arguments in the header comment. MCP tools should wrap a subset of these.
- `~/.claude/get-shit-done/bin/lib/core.cjs` -- Core utilities (findProjectRoot, error handling) needed by MCP server
- `~/.claude/get-shit-done/bin/lib/state.cjs` -- State management operations (load, update, patch, record-session)
- `~/.claude/get-shit-done/bin/lib/phase.cjs` -- Phase operations (next-decimal, add, insert, remove, complete)
- `~/.claude/get-shit-done/bin/lib/roadmap.cjs` -- Roadmap operations (get-phase, analyze, update-plan-progress)
- `~/.claude/get-shit-done/bin/lib/init.cjs` -- Compound initialization commands (init phase-op, init execute-phase, etc.)
- `~/.claude/get-shit-done/bin/lib/config.cjs` -- Configuration management

### MCP Protocol References
- MCP SDK: `@modelcontextprotocol/sdk` npm package -- Standard MCP server implementation library
- `.mcp.json` format: See existing examples at `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/context7/.mcp.json` and `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/firebase/.mcp.json` for stdio server registration patterns

### Prior Research
- `.planning/research/ARCHITECTURE.md` -- Documents Claude Code's integration seams, including MCP server integration at HIGH stability
- `.planning/research/FEATURES.md` -- Feasibility assessment showing MCP as the primary integration path for structured state access

### Project Requirements
- `.planning/REQUIREMENTS.md` -- MCP-01, MCP-02, MCP-03 requirements for this phase
- `.planning/ROADMAP.md` -- Phase 2 success criteria and dependencies

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/*.cjs` modules -- All GSD operations already implemented as importable CommonJS modules. The MCP server wraps these directly, no reimplementation needed.
- `bin/lib/core.cjs` -- `findProjectRoot()` locates the `.planning/` directory, essential for the MCP server to know which project it serves.
- `bin/lib/init.cjs` -- Compound `init` commands that bundle multiple operations into single calls, providing the right granularity model for MCP tools.

### Established Patterns
- **CommonJS throughout**: GSD tools use `require()` / `module.exports`. MCP server should follow the same pattern.
- **JSON output**: gsd-tools.cjs already outputs JSON for compound commands (e.g., `init phase-op` returns structured JSON). MCP tools can return this same JSON.
- **Error handling**: gsd-tools.cjs uses `core.error()` for fatal errors and `process.exit(1)`. MCP server will need to catch these and return MCP error responses instead.

### Integration Points
- `.mcp.json` in project root -- New file that wires up the MCP server to Claude Code
- `~/.claude/get-shit-done/mcp/server.cjs` -- New server entry point (to be created)
- `/gsd:new-project` workflow -- Must be updated to create `.mcp.json` alongside `.planning/`
- GSD update mechanism -- Must include MCP server files in the distribution

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 02-mcp-server*
*Context gathered: 2026-03-31*
