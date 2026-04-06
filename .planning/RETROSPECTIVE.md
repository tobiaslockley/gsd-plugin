# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-06
**Phases:** 3 | **Plans:** 10 | **Tasks:** 27

### What Was Built
- Skill isolation via `context: fork` on 15 orchestrator commands (92% CLAUDE.md reduction)
- MCP server with 6 resources + 10 tools replacing prompt injection for state access
- Plugin packaging: 60 skills, 21 agents, 33 templates, 19 references in plugin layout
- Cross-session memory writer using Claude Code's memdir auto-recall pipeline
- Single-step install via `claude plugin install gsd` with legacy migration helper

### What Worked
- **Coarse phase granularity** (3 phases for entire milestone) kept planning overhead minimal while covering a large scope
- **Research-first approach** — 5 research documents before any coding eliminated false starts
- **Extension points strategy** — all 6 integration seams proved stable and sufficient
- **Self-contained skills** — embedding workflow content directly eliminated runtime file reads and external path dependencies
- **Phase 3 executed all 5 plans in a single session** — tight dependency chain benefited from continuous context

### What Was Inefficient
- **Phase 2/3 progress table not updated** — ROADMAP.md progress table showed 0/2 and 0/5 even though all plans were marked [x] in the plans list
- **Phase 3 VERIFICATION.md skipped during execution** — had to create it retroactively during milestone audit, adding an extra step
- **REQUIREMENTS.md checkboxes stale** — 4 Phase 3 requirements never checked off despite being completed, caught only during audit
- **MCP server rebuilt from scratch in Phase 3** — the Phase 2 server was written outside the git tree (`~/.claude/get-shit-done/mcp/`), so Phase 3 couldn't copy it and had to recreate from spec

### Patterns Established
- `CLAUDE_PLUGIN_ROOT` env var for plugin path resolution with dev-mode fallback
- `hooks/hooks.json` auto-loading (not `manifest.hooks`) to avoid duplicate registration
- Stable `phase-NN-slug.md` naming for idempotent memdir writes
- Self-contained skills with embedded workflow content (no execution_context indirection)
- Migration helpers with audit-first approach (safe by default, --clean requires opt-in)

### Key Lessons
1. **Always commit artifacts to the git tree** — Phase 2's MCP server was written to `~/.claude/get-shit-done/mcp/` outside the repo, forcing Phase 3 to rebuild from spec. Artifacts should live in the repo.
2. **Run verification immediately after execution** — skipping Phase 3 verification created a blocker during milestone audit. The verify step should be non-optional.
3. **Keep traceability table in sync** — automated tools should update checkboxes and progress tables when plans complete, not rely on manual updates.
4. **Research investment pays off** — 1,573 lines of research across 5 documents prevented the fork path entirely, saving an estimated 8-16+ hrs/month of maintenance.

### Cost Observations
- Model mix: ~70% opus (planning, execution), ~30% sonnet (checking, verification)
- Sessions: ~8 across 7 days
- Notable: Phase 1 plans averaged 2-3 min each; Phase 2 averaged 7-10 min; Phase 3 averaged 6-8 min

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~8 | 3 | First milestone — research-first, coarse phases, plugin packaging |

### Top Lessons (Verified Across Milestones)

1. Research before building eliminates costly false starts
2. Commit all artifacts to the git tree — external paths break downstream phases
3. Verification should be non-optional at phase completion
