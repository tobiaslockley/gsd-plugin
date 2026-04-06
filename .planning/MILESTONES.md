# Milestones

## v1.0 MVP (Shipped: 2026-04-06)

**Phases completed:** 3 phases, 10 plans, 27 tasks

**Key accomplishments:**

- Added `context: fork` to all 15 GSD orchestrator commands so skill prompts execute in isolated sub-agent contexts instead of polluting the parent conversation
- All 18 GSD agent definitions enhanced with typed capability frontmatter (maxTurns, effort, permissionMode) for agent spawning via Claude Code's AgentJsonSchema
- Reduced CLAUDE.md from ~2,338 to ~174 words (~92% reduction) by adding --minimal flag to generate-claude-md that replaces project/stack/conventions/architecture sections with on-demand placeholders
- MCP server with stdio transport exposing 6 read-only GSD resources via @modelcontextprotocol/sdk, auto-discovered by Claude Code through .mcp.json
- GSD plugin manifest with MCP metadata, packaged runtime path resolution via CLAUDE_PLUGIN_ROOT/CLAUDE_PLUGIN_DATA, and repo-owned validation
- 60 self-contained skills, 21 agents, 33 templates, 19 references migrated to plugin layout with zero legacy path dependencies
- GSD hooks packaged in hooks/hooks.json and MCP server at mcp/server.cjs with legacy .mcp.json dependency removed
- Phase-completion memory writer using Claude Code memdir with lean project-type memories and auto-recall
- Plugin distribution contract, README with single-step install, legacy migration helper, and clean runtime audit

---
