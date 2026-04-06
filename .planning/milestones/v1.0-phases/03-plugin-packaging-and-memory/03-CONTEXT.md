# Phase 3: Plugin Packaging and Memory — Discussion Context

## Phase Goal
GSD installs in a single step via plugin manifest and persists decisions and context across sessions through Claude Code's memory system.

## Resolved Decisions

### 1. Memory Content Strategy → Lean phase outcomes
- Write `project`-type memories containing: phase goal achievement, non-obvious decisions (with rationale), surprising blocker resolutions
- Don't write: anything derivable from git log, code inspection, or CLAUDE.md
- One memory file per completed phase
- extractMemories background service handles fine-grained capture organically

### 2. Memory Write Timing → Phase transitions only
- Write memory at verification/completion time when outcomes are crystallized
- No hooks, plan-level writes, or session-pause writes needed
- Implementation: add memory-write step to verify-work or complete-phase workflow
- The resume file already captures session continuity context

### 3. Plugin Packaging Scope → All-in pure plugin
- Eliminate `~/.claude/get-shit-done/` directory entirely
- Embed workflow content directly in skill files (no `execution_context` indirection)
- Package as a standard Claude Code plugin with `.claude-plugin/plugin.json` manifest
- Plugin declares: commands (skills), agents, hooks, mcpServers
- `bin/gsd-tools.cjs` and `bin/lib/*.cjs` bundled in plugin directory
- MCP server declared in plugin manifest's `mcpServers` field
- Templates and references live in plugin directory, referenced via plugin-relative paths

### 4. Installation Experience → Marketplace-first
- `claude plugin install gsd` handles everything
- Plugin system manages versioning, caching, and updates
- Custom update workflow (`/gsd:update`) becomes unnecessary
- npm package `get-shit-done-cc` replaced by plugin distribution
- GitHub repo serves as plugin source (github marketplace entry)

## Key Technical Challenges

### Path Resolution (Critical)
Current skills use `execution_context: @$HOME/.claude/get-shit-done/workflows/*.md` — this indirection must be eliminated. Two approaches:
1. **Embed workflows in skills** — each skill .md becomes self-contained (no external reference)
2. **Plugin-relative paths** — use the plugin install location for bin/ and template references

### gsd-tools.cjs Invocation
Current: `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" ...`
Options:
- MCP tools replace most gsd-tools calls (Phase 2 already built this)
- Remaining CLI calls use plugin-relative path via hook-injected env var or npx
- Plugin's SessionStart hook can set `$GSD_HOME` to plugin install dir

### MCP Server Registration
Current: per-project `.mcp.json` pointing to `~/.claude/get-shit-done/mcp/server.cjs`
Plugin: declared in plugin.json `mcpServers` field → auto-registered when plugin enabled

### Hooks Migration
Current: 5 JS files in `~/.claude/hooks/`, registered in `settings.json`
Plugin: `hooks` field in plugin.json or `hooks/hooks.json` in plugin dir

## Carrying Forward from Prior Phases
- stdio MCP transport (Phase 2)
- CommonJS throughout (Phase 2)
- No fork, extension points only (project constraint)
- context: fork on orchestrator skills (Phase 1)
- Agent definitions with typed frontmatter (Phase 1)
- Minimal CLAUDE.md placeholder pattern (Phase 1)

## Requirements Mapping
- PLUG-01: plugin.json manifest bundles all components
- PLUG-02: single install command sets up everything
- MEM-01: phase outcomes written to memdir after transitions
- MEM-02: new sessions auto-recall project context

## Scope Notes
- This is the largest refactor in the milestone — it touches every skill file (59), all hooks, MCP config, and the distribution mechanism
- The npm package `get-shit-done-cc` installer becomes a migration tool or is deprecated
- Backwards compatibility: users on old install should have a migration path
