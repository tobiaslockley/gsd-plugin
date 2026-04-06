# Phase 2: MCP Server - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 02-mcp-server
**Mode:** auto
**Areas discussed:** Transport protocol, Resource vs Tool boundary, Tool granularity, Auto-start mechanism

---

## Transport Protocol

| Option | Description | Selected |
|--------|-------------|----------|
| stdio transport | Standard pattern for local MCP servers in Claude Code. Simple, no network config. Claude Code manages server lifecycle. | [auto] |
| HTTP transport | Enables multi-client access but adds network complexity | |
| Both with runtime selection | Flexibility but unnecessary complexity for single-user local tool | |

**User's choice:** stdio transport (auto-selected, recommended default)
**Notes:** All reference MCP servers in the Claude Code plugin ecosystem (context7, firebase, imessage) use stdio. HTTP is unnecessary for GSD's local single-user operation model.

---

## Resource vs Tool Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Resources for read-only state, Tools for mutations | Clean separation per MCP protocol semantics. Resources for queries, tools for state changes. | [auto] |
| Everything as tools | Simpler but loses MCP's resource/tool distinction | |
| Everything as resources with mutation methods | Misuses MCP protocol semantics | |

**User's choice:** Resources for read-only, Tools for mutations (auto-selected, recommended default)
**Notes:** MCP protocol design separates resources (data to read) from tools (actions to take). Following this convention makes the server predictable and aligns with how Claude Code's MCP client handles resources vs tool calls.

---

## Tool Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Coarse tools wrapping workflow operations | 8-12 high-level tools. Fewer tools = fewer tokens for descriptions. Aligns with token reduction goal. | [auto] |
| 1:1 mirror of gsd-tools.cjs commands | 40+ tools. Complete coverage but heavy token overhead from tool descriptions. | |
| Mixed -- coarse for workflows, fine-grained for atomic ops | Compromise but higher tool count than option 1 | |

**User's choice:** Coarse tools wrapping workflow operations (auto-selected, recommended default)
**Notes:** The primary goal of Phase 2 is reducing token overhead. Having 40+ MCP tools would add significant tokens to each turn's context (tool descriptions). 8-12 coarse tools keeps the overhead manageable while covering the key workflow operations. The MCP server internally calls bin/lib/*.cjs for fine-grained operations.

---

## Auto-Start Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Project-level .mcp.json | Standard Claude Code pattern. Created by /gsd:new-project alongside .planning/. No user config needed. | [auto] |
| User-level settings.json mcpServers entry | Requires manual user configuration. Not automatic per-project. | |
| Plugin-managed registration | More complex. Depends on Phase 3 plugin packaging. | |

**User's choice:** Project-level .mcp.json (auto-selected, recommended default)
**Notes:** .mcp.json is the standard mechanism for project-specific MCP server registration in Claude Code. It requires no user intervention -- Claude Code reads it automatically when opening a project. The GSD init workflow creates it alongside .planning/.

---

## Claude's Discretion

- MCP resource URI naming scheme
- Error response formatting
- Whether to include a gsd_health diagnostic tool
- Resource caching strategy
- Exact Zod schema shapes per tool

## Deferred Ideas

None -- analysis stayed within phase scope.
