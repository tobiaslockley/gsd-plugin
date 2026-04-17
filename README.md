# GSD Plugin -- Get Shit Done for Claude Code

**Based on:** [GSD 1.35.0](https://github.com/gsd-build/get-shit-done/releases/tag/v1.35.0) base tree by **TACHES** (Lex Christopherson)

A performance-optimized plugin packaging of [GSD](https://github.com/gsd-build/get-shit-done) for Claude Code. Reduces per-turn token overhead by ~92%, adds MCP-backed project state, and bundles everything into a single-install plugin.

This project repackages the GSD workflow system as a native Claude Code plugin with additional optimizations: skill isolation via `context: fork`, structured MCP tools replacing prompt injection, and cross-session memory via memdir.

## Installation

```bash
# Step 1: Add the marketplace
claude plugin marketplace add jnuyens/gsd-plugin

# Step 2: Install the plugin
claude plugin install gsd@gsd-plugin
```

That's it. This installs everything: slash commands, agent definitions, hooks, and an MCP server for project state. No manual configuration required. Enable auto-update for the marketplace in Claude Code settings to receive updates automatically.

## What GSD Plugin provides

- **59 slash commands** (`/gsd:*`) for project planning, execution, debugging, and verification
- **21 agent definitions** for specialized workflow roles (planner, executor, researcher, verifier, etc.)
- **MCP server** exposing project state as queryable resources and mutation tools
- **Hooks** for session-start context loading, workflow enforcement, checkpoint on compact, and tool-use monitoring
- **Execution context profiles** (dev, research, review) for role-specific behavior
- **Templates and references** for planning artifacts, summaries, verification checklists, and thinking-model guidance
- **Memory integration** -- phase outcomes persist across sessions via Claude Code's memdir

## What changed from upstream GSD

| Aspect | Upstream GSD | This plugin |
|--------|-------------|-------------|
| Install | `npx get-shit-done-cc` | `claude plugin marketplace add jnuyens/gsd-plugin && claude plugin install gsd@gsd-plugin` |
| Context overhead | ~3,000-5,000 tokens/turn via CLAUDE.md | ~200 tokens (92% reduction) |
| Skill isolation | Inline execution | `context: fork` sub-agent isolation |
| State access | BashTool roundtrips to gsd-tools | MCP resources + tools |
| Memory | None | memdir auto-recall across sessions |
| Agent definitions | Inline prompt role descriptions | `.claude/agents/*.md` with typed frontmatter |

## Quick start

1. Install: `claude plugin marketplace add jnuyens/gsd-plugin && claude plugin install gsd@gsd-plugin`
2. Start a new project: `/gsd:new-project`
3. Plan your first phase: `/gsd:plan-phase`
4. Execute: `/gsd:execute-phase`
5. Verify: `/gsd:verify-work`

## Developing this fork

This fork is loaded directly from source via `--plugin-dir`, not from the marketplace.

```bash
# From any project directory:
claude --plugin-dir ~/src/gsd-plugin/
```

No install step, no cache, no automatic migration. Edits to the fork are live on next session.

## Updating

Enable auto-update for the marketplace in Claude Code settings and updates will be applied automatically at startup. For manual updates:

```bash
# Step 1: Pull the latest marketplace catalog from GitHub
claude plugin marketplace update gsd-plugin

# Step 2: Reinstall the plugin to pick up the new version
claude plugin install gsd@gsd-plugin
```

Note: Step 1 refreshes the marketplace index but does not upgrade the installed plugin. Step 2 is needed to install the new version.

## Auditing a legacy GSD install

The plugin never mutates user-owned config. If you previously installed GSD via `get-shit-done-cc` or a manual setup, run the audit command to list any leftover artifacts:

```bash
node bin/gsd-tools.cjs migrate
```

The audit reports legacy paths in `~/.claude/get-shit-done/`, `~/.claude/commands/gsd/`, skill/agent/hook files under `~/.claude/`, GSD entries in project `.mcp.json`, GSD hook entries in `~/.claude/settings.json`, and the retired `get-shit-done-cc` npm package.

Running with `--clean` moves the two plugin-owned directories (`~/.claude/get-shit-done/` and `~/.claude/commands/gsd/`) to `-legacy` backups and prints a manual-removal checklist for everything else — you decide whether to remove user-curated config such as `settings.json`, agent files, or skill dirs.

```bash
node bin/gsd-tools.cjs migrate --clean
```

## Credits

- **[GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done)** by TACHES (Lex Christopherson) -- the original workflow framework this plugin is based on
- Plugin packaging, MCP integration, token optimization, and memory system by Jasper Nuyens

## License

MIT
