# Phase 3: Plugin Packaging and Memory - Research

**Researched:** 2026-04-07
**Domain:** Claude Code plugin packaging, hook/MCP integration, and memdir-backed project memory
**Confidence:** MEDIUM

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Write `project`-type memories containing: phase goal achievement, non-obvious decisions (with rationale), surprising blocker resolutions
- Don't write: anything derivable from git log, code inspection, or CLAUDE.md
- One memory file per completed phase
- extractMemories background service handles fine-grained capture organically

- Write memory at verification/completion time when outcomes are crystallized
- No hooks, plan-level writes, or session-pause writes needed
- Implementation: add memory-write step to verify-work or complete-phase workflow
- The resume file already captures session continuity context

- Eliminate `~/.claude/get-shit-done/` directory entirely
- Embed workflow content directly in skill files (no `execution_context` indirection)
- Package as a standard Claude Code plugin with `.claude-plugin/plugin.json` manifest
- Plugin declares: commands (skills), agents, hooks, mcpServers
- `bin/gsd-tools.cjs` and `bin/lib/*.cjs` bundled in plugin directory
- MCP server declared in plugin manifest's `mcpServers` field
- Templates and references live in plugin directory, referenced via plugin-relative paths

- `claude plugin install gsd` handles everything
- Plugin system manages versioning, caching, and updates
- Custom update workflow (`/gsd:update`) becomes unnecessary
- npm package `get-shit-done-cc` replaced by plugin distribution
- GitHub repo serves as plugin source (github marketplace entry)

### Claude's Discretion
None stated in [03-CONTEXT.md](/Users/jnuyens/claude-code-gsd/.planning/phases/03-plugin-packaging-and-memory/03-CONTEXT.md). [VERIFIED: 03-CONTEXT.md]

### Deferred Ideas (OUT OF SCOPE)
None stated in [03-CONTEXT.md](/Users/jnuyens/claude-code-gsd/.planning/phases/03-plugin-packaging-and-memory/03-CONTEXT.md). [VERIFIED: 03-CONTEXT.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MEM-01 | GSD phase outcomes and key decisions written to Claude Code's `memdir/` auto-memory system | Use one `project` memory file per completed phase plus a `MEMORY.md` index entry under the auto-memory directory. [VERIFIED: memdir/memoryTypes.ts] [VERIFIED: memdir/memdir.ts] |
| MEM-02 | Project context auto-recalled across sessions without manual CLAUDE.md loading | Claude Code auto-loads the memdir `MEMORY.md` entrypoint when auto-memory is enabled, so GSD only needs to write compatible files. [VERIFIED: utils/claudemd.ts] [VERIFIED: memdir/paths.ts] |
| PLUG-01 | GSD packaged as a Claude Code plugin bundling skills, agents, MCP server, and hooks | Use `.claude-plugin/plugin.json` plus standard `skills/`, `agents/`, `hooks/hooks.json`, and manifest `mcpServers`. [VERIFIED: utils/plugins/schemas.ts] [VERIFIED: utils/plugins/pluginLoader.ts] |
| PLUG-02 | Single-step installation via plugin manifest | Claude Code installs plugins into `~/.claude/plugins/cache/{marketplace}/{plugin}/{version}/` and exposes `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_DATA}` to packaged components. [VERIFIED: utils/plugins/pluginLoader.ts] [VERIFIED: utils/plugins/pluginDirectories.ts] |
</phase_requirements>

## Summary

Phase 3 should be planned as a packaging-and-migration phase, not just a manifest-writing phase. Claude Code's current plugin loader already supports the exact component mix GSD needs: plugin metadata in `.claude-plugin/plugin.json`, skills in `skills/`, agents in `agents/`, auto-loaded hooks from `hooks/hooks.json`, and MCP server declarations either inline or via referenced JSON from the manifest. Paths are plugin-root-relative and must start with `./`; `..` traversal is explicitly rejected during validation. [VERIFIED: utils/plugins/schemas.ts] [VERIFIED: utils/plugins/validatePlugin.ts] [VERIFIED: utils/plugins/pluginLoader.ts]

The core implementation constraint is path migration. The legacy GSD install at `/Users/jnuyens/.claude/get-shit-done` is real on this machine and still drives repo-local MCP config plus user-global hooks. The repo's `.mcp.json` points to `/Users/jnuyens/.claude/get-shit-done/mcp/server.cjs`, and `~/.claude/settings.json` registers GSD hook scripts from `~/.claude/hooks/*.js`. Planning must therefore split work into: plugin scaffold, workflow content migration, MCP migration, hook migration, memdir writer integration, and legacy cleanup/back-compat. [VERIFIED: /Users/jnuyens/claude-code-gsd/.mcp.json] [VERIFIED: /Users/jnuyens/.claude/settings.json] [VERIFIED: filesystem audit of ~/.claude/get-shit-done]

For memory, GSD does not need a private integration API. Claude Code's memdir system is file-based: it auto-loads the memory entrypoint, expects one memory per file plus a `MEMORY.md` index, and defines a `project` memory type whose body should lead with the fact/decision, then `Why:` and `How to apply:`. That matches the phase decision to persist lean phase outcomes at verification/completion time. [VERIFIED: memdir/memoryTypes.ts] [VERIFIED: memdir/memdir.ts] [VERIFIED: utils/claudemd.ts]

**Primary recommendation:** Plan this phase as five executable plans: plugin scaffold, resource-path migration, hooks/MCP migration, memdir write integration, and legacy install migration/cleanup. [VERIFIED: codebase and runtime audit]

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` file exists at the project root, so there are no additional project-level directives to honor beyond the planning artifacts. [VERIFIED: filesystem check for `./CLAUDE.md`]

## Standard Stack

### Core
| Library / System | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude Code plugin manifest under `.claude-plugin/plugin.json` | Current repo schema, 2026-04-07 | Declares plugin metadata and bundled components | This is the loader and validator schema actually used by Claude Code in this checkout. [VERIFIED: utils/plugins/schemas.ts] [VERIFIED: utils/plugins/pluginLoader.ts] |
| Standard plugin directories: `skills/`, `agents/`, `hooks/hooks.json` | Current repo behavior, 2026-04-07 | Default discovery for packaged components | Loader auto-detects these directories and auto-loads `hooks/hooks.json`; using defaults minimizes manifest complexity. [VERIFIED: utils/plugins/pluginLoader.ts] |
| Manifest `mcpServers` field | Current repo schema, 2026-04-07 | Bundles MCP server config directly into the plugin | Public MCP docs and the current loader both support plugin-defined MCP servers. [CITED: https://docs.anthropic.com/en/docs/claude-code/mcp] [VERIFIED: utils/plugins/schemas.ts] |
| Node.js runtime | v22.21.1 on this machine | Runs `bin/gsd-tools.cjs` and `mcp/server.cjs` | The existing legacy install already uses Node-based CommonJS entrypoints, so no language/runtime migration is needed. [VERIFIED: `node --version`] [VERIFIED: filesystem audit of ~/.claude/get-shit-done] |

### Supporting
| Library / System | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` plugin variables | Current repo behavior, 2026-04-07 | Resolve packaged binaries/templates and persistent plugin state | Use for hook commands, MCP env, and any remaining external file references that cannot be embedded. `${CLAUDE_PLUGIN_DATA}` should hold persistent migration state if needed. [VERIFIED: utils/plugins/pluginOptionsStorage.ts] [VERIFIED: utils/hooks.ts] [VERIFIED: utils/plugins/mcpPluginIntegration.ts] |
| Existing GSD MCP package dependency `@modelcontextprotocol/sdk` | `^1.29.0` in legacy install | Current Phase 2 server dependency | Reuse unless Phase 2 code already vendored or moved it; this phase is packaging, not SDK churn. [VERIFIED: /Users/jnuyens/.claude/get-shit-done/mcp/package.json] |
| Claude Code auto-memory / memdir | Current repo behavior, 2026-04-07 | Cross-session recall of GSD phase outcomes | Use the existing file contract instead of inventing a parallel memory store. [VERIFIED: memdir/paths.ts] [VERIFIED: memdir/memdir.ts] [VERIFIED: utils/claudemd.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Standard plugin directories plus minimal manifest | Manifest-only custom component paths everywhere | Supported, but increases path surface area and migration risk for 59 workflow files. [VERIFIED: utils/plugins/schemas.ts] |
| Plugin-managed MCP registration | Keep per-project `.mcp.json` pointing at legacy server path | Works short-term, but it fails PLUG-02 and leaves a live dependency on `~/.claude/get-shit-done`. [VERIFIED: /Users/jnuyens/claude-code-gsd/.mcp.json] |
| File-based memdir writes at phase completion | Custom memory service or hook-driven writes | Unnecessary because auto-memory already loads `MEMORY.md` and supports direct file writes. [VERIFIED: memdir/memdir.ts] [VERIFIED: utils/claudemd.ts] |

**Installation shape:**
```bash
claude plugin install gsd
```
[ASSUMED] The final marketplace/install identifier will be `gsd`; the context requires marketplace-first install, but no public marketplace entry exists in this repo yet.

## Architecture Patterns

### Recommended Project Structure
```text
plugin-root/
├── .claude-plugin/
│   └── plugin.json        # plugin metadata + mcpServers + optional hooks/userConfig
├── skills/
│   └── gsd-*/SKILL.md     # self-contained skills; no execution_context indirection
├── agents/
│   └── *.md               # agent definitions
├── hooks/
│   └── hooks.json         # default plugin hooks
├── bin/
│   ├── gsd-tools.cjs
│   └── lib/*.cjs
├── mcp/
│   └── server.cjs
├── templates/
├── references/
└── migrations/
    └── legacy-install.cjs # optional one-shot migration helper
```
[VERIFIED: utils/plugins/pluginLoader.ts] [VERIFIED: 03-CONTEXT.md] [VERIFIED: filesystem audit of ~/.claude/get-shit-done]

### Pattern 1: Prefer default plugin discovery over manifest sprawl
**What:** Put skills in `skills/`, agents in `agents/`, and hooks in `hooks/hooks.json`; use manifest fields only for metadata, `mcpServers`, and truly non-standard paths. [VERIFIED: utils/plugins/pluginLoader.ts]

**When to use:** For nearly all GSD content, because the loader auto-detects those directories and the validator already knows how to lint them. [VERIFIED: utils/plugins/pluginLoader.ts] [VERIFIED: utils/plugins/validatePlugin.ts]

**Example:**
```json
{
  "name": "gsd",
  "version": "1.0.0",
  "description": "Get Shit Done for Claude Code",
  "mcpServers": {
    "gsd": {
      "type": "stdio",
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/server.cjs"]
    }
  }
}
```
// Source: current plugin manifest schema + MCP plugin substitution
[VERIFIED: utils/plugins/schemas.ts] [VERIFIED: utils/plugins/mcpPluginIntegration.ts]

### Pattern 2: Use plugin variables for remaining external references
**What:** Replace absolute `~/.claude/get-shit-done/...` references with `${CLAUDE_PLUGIN_ROOT}` for versioned packaged assets and `${CLAUDE_PLUGIN_DATA}` for persistent mutable state. [VERIFIED: utils/plugins/pluginOptionsStorage.ts] [VERIFIED: utils/hooks.ts]

**When to use:** For hook commands, MCP server commands/env, skill shell snippets, and any template/reference lookups that stay file-based. [VERIFIED: utils/hooks.ts] [VERIFIED: utils/plugins/loadPluginCommands.ts]

**Example:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/bin/gsd-tools.cjs\" plugin-session-start"
          }
        ]
      }
    ]
  }
}
```
// Source: plugin hook command substitution path
[VERIFIED: utils/hooks.ts]

### Pattern 3: Write memdir-compatible phase memories directly
**What:** On phase verification/completion, write one `project` memory file and add or update one concise `MEMORY.md` index line. The memory body should contain the phase outcome/decision, then `Why:` and `How to apply:`. [VERIFIED: memdir/memoryTypes.ts] [VERIFIED: memdir/memdir.ts]

**When to use:** Only at the end of a completed phase, matching the locked decision in context. [VERIFIED: 03-CONTEXT.md]

**Example:**
```markdown
---
name: phase-03-plugin-packaging-and-memory
description: GSD moved to Claude Code plugin packaging and stopped depending on ~/.claude/get-shit-done
type: project
---

Phase 3 completed on 2026-04-07: GSD now ships as a Claude Code plugin and no longer depends on ~/.claude/get-shit-done for runtime loading.
**Why:** Single-step install and update handling moved to Claude Code's plugin system; absolute user-home paths were brittle and blocked marketplace distribution.
**How to apply:** When changing GSD packaging, update the plugin manifest and bundled assets first; do not reintroduce user-home absolute paths or project-local .mcp.json requirements.
```
// Source: memory type/body guidance
[VERIFIED: memdir/memoryTypes.ts]

### Anti-Patterns to Avoid
- **Reusing `hooks/hooks.json` through `manifest.hooks`:** The standard hooks file is auto-loaded; re-declaring it via manifest creates a duplicate-hook error in strict mode. [VERIFIED: utils/plugins/pluginLoader.ts]
- **Keeping `execution_context` indirection:** The locked decision is to eliminate it, and the runtime audit shows many legacy files still hard-reference `templates/`, `references/`, `workflows/`, and `bin/gsd-tools.cjs` under `~/.claude/get-shit-done`. [VERIFIED: 03-CONTEXT.md] [VERIFIED: grep audit of legacy workflows/templates/references]
- **Saving derivable phase summaries to memory:** Claude Code memory explicitly excludes code patterns, git history, file paths, and anything already in `CLAUDE.md`. [VERIFIED: memdir/memoryTypes.ts]
- **Depending on project `.mcp.json` after packaging:** That leaves install incomplete and keeps the legacy runtime live. [VERIFIED: /Users/jnuyens/claude-code-gsd/.mcp.json]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plugin component discovery | Custom scanner for skills/agents/hooks | Claude Code plugin loader conventions | The loader already supports the required directories and validates them. [VERIFIED: utils/plugins/pluginLoader.ts] |
| Memory persistence | Separate GSD memory store | Claude Code memdir file contract | Auto-recall already happens by loading `MEMORY.md`; duplicating this would fragment context. [VERIFIED: utils/claudemd.ts] [VERIFIED: memdir/memdir.ts] |
| Plugin state storage | Ad hoc files under project or home | `${CLAUDE_PLUGIN_DATA}` | Plugin data dir survives plugin updates; `${CLAUDE_PLUGIN_ROOT}` does not. [VERIFIED: utils/plugins/pluginDirectories.ts] |
| Hook registration | Manual `~/.claude/settings.json` edits | Packaged `hooks/hooks.json` | Manual settings edits are exactly what PLUG-02 is intended to replace. [VERIFIED: /Users/jnuyens/.claude/settings.json] [VERIFIED: utils/plugins/pluginLoader.ts] |

**Key insight:** The safe plan is to migrate GSD onto Claude Code's existing plugin and memory contracts, not to reproduce them inside GSD. [VERIFIED: codebase and runtime audit]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Repo-local `.mcp.json` points `gsd` to `/Users/jnuyens/.claude/get-shit-done/mcp/server.cjs`. Legacy install tree exists at `/Users/jnuyens/.claude/get-shit-done/` with `bin/`, `mcp/`, `workflows/`, `templates/`, and `references/`; version file is `1.30.0`. [VERIFIED: /Users/jnuyens/claude-code-gsd/.mcp.json] [VERIFIED: filesystem audit of ~/.claude/get-shit-done] | Code edit: remove project dependence on `.mcp.json` for GSD. Data migration / cleanup: install plugin, optionally import needed assets/state, then delete or tombstone legacy tree after verification. |
| Live service config | `~/.claude/settings.json` registers GSD hook commands `gsd-check-update.js`, `gsd-context-monitor.js`, `gsd-prompt-guard.js`, and `gsd-statusline.js` from `~/.claude/hooks/`. [VERIFIED: /Users/jnuyens/.claude/settings.json] [VERIFIED: filesystem audit of ~/.claude/hooks] | Code edit: move supported behaviors into plugin hooks. Migration: patch/remove user settings entries that point at old hook scripts once plugin hooks are active. |
| OS-registered state | None found in `~/Library/LaunchAgents`, user crontab, or `pm2` output for `get-shit-done` / `gsd`. [VERIFIED: LaunchAgents grep] [VERIFIED: `crontab -l` grep] [VERIFIED: `pm2 jlist` grep] | None. Re-check only if legacy installer is known to have created launch agents on other machines. [ASSUMED] |
| Secrets/env vars | No active environment variables matching `GSD`, `GET_SHIT_DONE`, `CLAUDE_PLUGIN`, `CLAUDE_CODE_REMOTE_MEMORY_DIR`, `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`, or `CLAUDE_CODE_DISABLE_AUTO_MEMORY` were present in this shell. [VERIFIED: environment grep] | Code edit only. If legacy users exported GSD-specific env vars in shell profiles outside this machine, document them in migration notes. [ASSUMED] |
| Build artifacts | Legacy `mcp/node_modules/` and `mcp/package-lock.json` are present under `~/.claude/get-shit-done/mcp/`; these are install artifacts, not source-of-truth. [VERIFIED: filesystem audit of ~/.claude/get-shit-done] | Rebuild/bundle from repo-owned plugin contents; do not treat legacy `node_modules` as canonical. Cleanup legacy artifacts after plugin validation. |

## Common Pitfalls

### Pitfall 1: Paths that are valid in legacy skills but invalid in plugins
**What goes wrong:** Absolute `$HOME/.claude/get-shit-done/...` references continue to work on the author's machine but fail plugin portability and single-install packaging. [VERIFIED: grep audit of legacy workflows/templates/references]
**Why it happens:** Legacy GSD treated the user-home install as its content root. Plugin packaging changes the root to the plugin cache directory. [VERIFIED: filesystem audit of ~/.claude/get-shit-done] [VERIFIED: utils/plugins/pluginDirectories.ts]
**How to avoid:** Replace every user-home path with embedded markdown content or `${CLAUDE_PLUGIN_ROOT}` references. [VERIFIED: utils/plugins/pluginOptionsStorage.ts]
**Warning signs:** `rg` still finds `get-shit-done/bin/gsd-tools.cjs`, `get-shit-done/workflows`, `get-shit-done/templates`, or `execution_context:` after migration. [VERIFIED: legacy grep audit]

### Pitfall 2: Hook duplication and hook-source confusion
**What goes wrong:** `hooks/hooks.json` loads automatically, then the same file is loaded again via `manifest.hooks`, causing duplicate or failing hook registration. [VERIFIED: utils/plugins/pluginLoader.ts]
**Why it happens:** Manifest hooks are additive, not declarative replacement. [VERIFIED: utils/plugins/schemas.ts] [VERIFIED: utils/plugins/pluginLoader.ts]
**How to avoid:** Put default hooks in `hooks/hooks.json`; use `manifest.hooks` only for additional hook files or inline supplemental hooks. [VERIFIED: utils/plugins/pluginLoader.ts]
**Warning signs:** `claude plugin validate` reports hook errors or duplicate hook-file warnings. [VERIFIED: cli/handlers/plugins.ts] [VERIFIED: utils/plugins/validatePlugin.ts]

### Pitfall 3: Writing memories that Claude Code explicitly tells itself not to keep
**What goes wrong:** GSD saves git-log-style summaries, code patterns, or file paths, which are excluded by the memory taxonomy and likely to go stale. [VERIFIED: memdir/memoryTypes.ts]
**Why it happens:** It is tempting to dump phase summaries directly into memory instead of extracting only the non-obvious durable part. [VERIFIED: memdir/memoryTypes.ts]
**How to avoid:** Limit writes to phase outcome, non-obvious decisions, and surprising blocker resolution, exactly as locked in context. [VERIFIED: 03-CONTEXT.md]
**Warning signs:** Proposed memory content can be reconstructed from `.planning/`, git history, or code inspection with no loss. [VERIFIED: memdir/memoryTypes.ts]

### Pitfall 4: Treating `.mcp.json` removal as enough for MCP migration
**What goes wrong:** The plugin installs, but skills or hooks still shell out to legacy paths, so the old tree remains a hidden runtime dependency. [VERIFIED: .mcp.json audit] [VERIFIED: legacy grep audit]
**Why it happens:** Phase 3 touches MCP, hooks, skills, templates, and references simultaneously. [VERIFIED: 03-CONTEXT.md]
**How to avoid:** Plan a dedicated migration audit that must reach zero matches for legacy root references before deprecating the old install. [VERIFIED: runtime audit]
**Warning signs:** Plugin works only on the machine that still has `~/.claude/get-shit-done/` installed. [VERIFIED: runtime audit]

## Code Examples

Verified patterns from official sources and current code:

### Plugin MCP declaration with plugin-root substitution
```json
{
  "name": "gsd",
  "mcpServers": {
    "gsd": {
      "type": "stdio",
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/server.cjs"]
    }
  }
}
```
// Source: plugin manifest schema and runtime MCP env/path substitution
[VERIFIED: utils/plugins/schemas.ts] [VERIFIED: utils/plugins/mcpPluginIntegration.ts]

### Hook command with plugin variables
```json
{
  "description": "GSD plugin hooks",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/bin/gsd-tools.cjs\" plugin-session-start"
          }
        ]
      }
    ]
  }
}
```
// Source: hooks.json wrapper format + hook substitution logic
[VERIFIED: utils/plugins/schemas.ts] [VERIFIED: utils/hooks.ts]

### Skill-side packaged resource reference
```markdown
Base directory for this skill: ${CLAUDE_SKILL_DIR}

Use `${CLAUDE_PLUGIN_ROOT}/templates/research.md` when the template must stay external.
```
// Source: skill loader injects base directory and supports `${CLAUDE_SKILL_DIR}`; plugin-root variables are substituted in plugin-loaded content.
[VERIFIED: skills/loadSkillsDir.ts] [VERIFIED: utils/plugins/loadPluginCommands.ts] [ASSUMED] GSD skill bodies loaded as plugin commands will continue to use the current plugin command loader path for substitution.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-project `.mcp.json` pointing at a user-home server path | Plugin-defined `mcpServers` or settings-scoped MCP config | Current Claude Code docs and loader support plugin MCP declarations as of 2026-04-07. [CITED: https://docs.anthropic.com/en/docs/claude-code/mcp] [VERIFIED: utils/plugins/schemas.ts] | GSD can remove project bootstrap steps and rely on plugin install. |
| Manual `~/.claude/settings.json` hook wiring | Packaged plugin hooks via `hooks/hooks.json` | Current Claude Code hook system reads declarative hook config and plugin loader auto-loads plugin hooks. [CITED: https://docs.anthropic.com/en/docs/claude-code/hooks-guide] [VERIFIED: utils/plugins/pluginLoader.ts] | GSD can stop asking users to patch global settings by hand. |
| Separate GSD knowledge in project files only | Claude Code auto-memory via memdir `MEMORY.md` plus memory files | Current Claude Code codebase auto-loads memdir entrypoint when enabled. [VERIFIED: utils/claudemd.ts] [VERIFIED: memdir/paths.ts] | GSD phase outcomes can be recalled across sessions without manual `CLAUDE.md` loading. |

**Deprecated/outdated:**
- Absolute user-home content roots like `~/.claude/get-shit-done/...`: outdated for marketplace/plugin distribution and directly conflicts with the locked Phase 3 packaging goal. [VERIFIED: 03-CONTEXT.md] [VERIFIED: runtime audit]
- Manual GSD update hook `gsd-check-update.js`: outdated if plugin updates are delegated to Claude Code's plugin system. [VERIFIED: 03-CONTEXT.md] [VERIFIED: /Users/jnuyens/.claude/settings.json]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `node` | Plugin hook commands, `bin/gsd-tools.cjs`, MCP stdio server | ✓ | v22.21.1 | None |
| `npm` | Rebuilding bundled MCP dependency if needed during development | ✓ | 10.9.4 | None |
| Claude Code plugin runtime | Install, validate, enable, and load plugin components | [ASSUMED] | — | Use repo-level validation and source inspection until interactive install testing is done |

**Missing dependencies with no fallback:**
- None verified on this machine. [VERIFIED: environment audit]

**Missing dependencies with fallback:**
- Claude Code plugin install workflow was not executed during this research, so install-time behavior remains to be validated by planning/execution. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No authentication flow is introduced by GSD packaging itself. [VERIFIED: phase scope] |
| V3 Session Management | no | No session token handling is introduced by the planned changes. [VERIFIED: phase scope] |
| V4 Access Control | yes | Keep plugin write operations limited to plugin data dir and memdir; rely on Claude Code hook/tool permissions rather than custom bypasses. [VERIFIED: utils/hooks.ts] [VERIFIED: services/extractMemories/extractMemories.ts] |
| V5 Input Validation | yes | Use existing Zod-based manifest and MCP schemas; do not hand-roll manifest parsing. [VERIFIED: utils/plugins/schemas.ts] |
| V6 Cryptography | no | No cryptographic feature is required for this phase. [VERIFIED: phase scope] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal in plugin component paths | Elevation / Tampering | Plugin validation rejects `..` segments and requires `./`-relative paths. [VERIFIED: utils/plugins/schemas.ts] [VERIFIED: utils/plugins/validatePlugin.ts] |
| Stale orphaned plugin roots after update | Tampering / Reliability | Use `${CLAUDE_PLUGIN_DATA}` for persistent state; treat `${CLAUDE_PLUGIN_ROOT}` as version-scoped and disposable. [VERIFIED: utils/plugins/pluginDirectories.ts] |
| Secret leakage into model prompt through plugin options | Information Disclosure | Sensitive `userConfig` values are for hook/MCP env use; do not interpolate secrets into skill/agent prose. [VERIFIED: utils/plugins/pluginOptionsStorage.ts] |
| Memory over-retention of derivable or sensitive data | Information Disclosure | Follow memdir taxonomy and exclusions; write only lean `project` memories. [VERIFIED: memdir/memoryTypes.ts] |

## Risk Decomposition Into Executable Plans

1. **Plugin scaffold and manifest**
Use default directories, create `.claude-plugin/plugin.json`, and wire `mcpServers` to `${CLAUDE_PLUGIN_ROOT}/mcp/server.cjs`. Validate with `claude plugin validate` once execution starts. [VERIFIED: utils/plugins/pluginLoader.ts] [VERIFIED: cli/handlers/plugins.ts]

2. **Workflow and resource-path migration**
Convert every legacy `execution_context`, `@.../workflows/*.md`, `templates/*.md`, `references/*.md`, and `bin/gsd-tools.cjs` absolute path to embedded content or plugin-relative references. This is the biggest surface area and should likely be its own plan. [VERIFIED: 03-CONTEXT.md] [VERIFIED: legacy grep audit]

3. **Hook and MCP migration**
Move user-global hook behavior into plugin hooks where appropriate, update or remove repo `.mcp.json`, and make sure plugin install alone activates the Phase 2 server. [VERIFIED: /Users/jnuyens/.claude/settings.json] [VERIFIED: /Users/jnuyens/claude-code-gsd/.mcp.json]

4. **Phase-memory writer integration**
Add one explicit write step at verify/complete transition time that emits a memdir-compatible `project` memory file and index entry. Do not add background hooks or session-pause writes. [VERIFIED: 03-CONTEXT.md] [VERIFIED: memdir/memoryTypes.ts]

5. **Legacy migration and cleanup**
Ship a one-shot migration path for users with `~/.claude/get-shit-done`, `~/.claude/hooks/gsd-*.js`, and global settings entries. Cleanup must happen only after plugin validation so old installs are not removed prematurely. [VERIFIED: runtime audit]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The final install command / identifier will be `claude plugin install gsd` rather than a marketplace-qualified variant. | Standard Stack | Low; affects docs and install copy, not architecture. |
| A2 | Machines other than this one may also have shell-profile env vars or non-standard registration state that did not appear in this audit. | Runtime State Inventory | Medium; migration docs may miss edge-case cleanup. |
| A3 | Plugin-loaded GSD skill content will continue to pass through the current plugin command loader that substitutes plugin variables in content. | Code Examples | Medium; if loader behavior differs, some template/resource references may need embedding instead. |
| A4 | Claude Code plugin runtime is available and supports the researched schema on the target execution environment without additional feature flags. | Environment Availability | Medium; if disabled, install validation needs a different execution path. |

## Open Questions (RESOLVED)

1. **Should GSD keep `bin/gsd-tools.cjs` as an internal implementation detail or replace more of it with MCP tools?**
   - Resolution: Keep `bin/gsd-tools.cjs` bundled for Phase 3 as a compatibility layer and migrate path resolution first. Reducing its remaining call surface is follow-up cleanup, not a prerequisite for plugin packaging. [VERIFIED: 03-CONTEXT.md] [VERIFIED: legacy grep audit]
   - Planning impact: the phase plan should package `bin/gsd-tools.cjs`, remove legacy path assumptions, and only then audit whether additional MCP conversion is still worth doing.

2. **How aggressive should legacy cleanup be on first install?**
   - Resolution: Do not auto-delete legacy state on first install. Use an explicit migration or cleanup command with dry-run output first, then allow opt-in cleanup after the packaged plugin validates successfully. [VERIFIED: runtime audit]
   - Planning impact: legacy cleanup belongs in a dedicated final migration plan, not in the install bootstrap path.

3. **Where should the phase memory writer live?**
   - Resolution: The primary write step should live in the terminal verification/completion flow after a phase is verified and before final transition bookkeeping. `complete-milestone` should only act as a fallback/finalizer if a verified phase has not yet emitted its durable memory file. [VERIFIED: 03-CONTEXT.md]
   - Planning impact: the plan should add the write step to `verify-work` first and keep milestone completion as a safety net rather than the primary writer.

## Sources

### Primary (HIGH confidence)
- [03-CONTEXT.md](/Users/jnuyens/claude-code-gsd/.planning/phases/03-plugin-packaging-and-memory/03-CONTEXT.md) - locked Phase 3 decisions and requirements mapping
- [REQUIREMENTS.md](/Users/jnuyens/claude-code-gsd/.planning/REQUIREMENTS.md) - MEM-01, MEM-02, PLUG-01, PLUG-02
- [ROADMAP.md](/Users/jnuyens/claude-code-gsd/.planning/ROADMAP.md) - Phase 3 goal and success criteria
- [utils/plugins/schemas.ts](/Users/jnuyens/claude-code-gsd/utils/plugins/schemas.ts) - manifest schema, hooks schema, MCP schema, path rules
- [utils/plugins/pluginLoader.ts](/Users/jnuyens/claude-code-gsd/utils/plugins/pluginLoader.ts) - directory auto-discovery, hook loading, manifest/path behavior
- [utils/plugins/validatePlugin.ts](/Users/jnuyens/claude-code-gsd/utils/plugins/validatePlugin.ts) - path traversal checks, content validation, duplicate-hook behavior
- [utils/plugins/pluginDirectories.ts](/Users/jnuyens/claude-code-gsd/utils/plugins/pluginDirectories.ts) - plugin cache and persistent data directories
- [utils/plugins/pluginOptionsStorage.ts](/Users/jnuyens/claude-code-gsd/utils/plugins/pluginOptionsStorage.ts) - `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_DATA}` and user config substitution
- [utils/hooks.ts](/Users/jnuyens/claude-code-gsd/utils/hooks.ts) - plugin hook command substitution and env export
- [memdir/paths.ts](/Users/jnuyens/claude-code-gsd/memdir/paths.ts) - auto-memory path resolution and enablement
- [memdir/memdir.ts](/Users/jnuyens/claude-code-gsd/memdir/memdir.ts) - memory prompt contract and directory guarantees
- [memdir/memoryTypes.ts](/Users/jnuyens/claude-code-gsd/memdir/memoryTypes.ts) - memory taxonomy and exclusions
- [utils/claudemd.ts](/Users/jnuyens/claude-code-gsd/utils/claudemd.ts) - auto-loading of memory entrypoint
- [/Users/jnuyens/.claude/settings.json](/Users/jnuyens/.claude/settings.json) - live legacy hook registrations
- [/Users/jnuyens/claude-code-gsd/.mcp.json](/Users/jnuyens/claude-code-gsd/.mcp.json) - live repo-local MCP dependency on legacy install
- `/Users/jnuyens/.claude/get-shit-done` runtime audit - live legacy install tree, version, and file layout

### Secondary (MEDIUM confidence)
- https://docs.anthropic.com/en/docs/claude-code/mcp - public MCP docs mentioning plugin-defined MCP servers
- https://docs.anthropic.com/en/docs/claude-code/hooks-guide - public hooks guide for declarative hook configuration
- https://docs.anthropic.com/en/docs/claude-code/settings - public settings scope documentation

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - based mostly on current Claude Code source and live runtime inspection
- Architecture: MEDIUM - plugin schema and memory behavior are verified, but the public plugin install surface is not fully documented
- Pitfalls: HIGH - directly supported by validator/loader behavior and legacy-path grep audit

**Research date:** 2026-04-07
**Valid until:** 2026-05-07
