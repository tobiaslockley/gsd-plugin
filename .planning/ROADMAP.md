# Roadmap: GSD Performance Optimization

## Milestones

- [x] **v1.0 MVP** -- Phases 1-3 (shipped 2026-04-06)
- [ ] **v1.1 Session Continuity** -- Phases 4-6

## Phases

<details>
<summary>v1.0 MVP (Phases 1-3) -- SHIPPED 2026-04-06</summary>

- [x] Phase 1: Skill and Agent Optimization (3/3 plans) -- completed 2026-04-01
- [x] Phase 2: MCP Server (2/2 plans) -- completed 2026-04-04
- [x] Phase 3: Plugin Packaging and Memory (5/5 plans) -- completed 2026-04-06

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### v1.1 Session Continuity

- [ ] **Phase 4: Checkpoint and Resume** - PreCompact hook saves state, SessionStart hook detects and auto-resumes
- [ ] **Phase 5: Backup Trigger and Lifecycle** - CLAUDE.md fallback path, checkpoint cleanup, staleness detection, manual save
- [ ] **Phase 6: Upstream Compatibility and Documentation** - Format compatibility, versioning, patch generation, README and CHANGELOG

## Phase Details

### Phase 4: Checkpoint and Resume
**Goal**: GSD work survives context resets -- state is captured before compaction and restored automatically on next session
**Depends on**: Phase 3 (plugin packaging provides hooks infrastructure and gsd-tools binary)
**Requirements**: CKPT-01, CKPT-02, CKPT-03, RESM-01, RESM-02, RESM-03
**Success Criteria** (what must be TRUE):
  1. When Claude Code fires PreCompact, a HANDOFF.json file appears in .planning/ containing current phase, plan, task, and status
  2. HANDOFF.json includes a list of uncommitted files and the in-progress task context so the next session knows what was being worked on
  3. HANDOFF.json includes recent decisions and context notes so the resuming session can restore the mental model
  4. When a new session starts and HANDOFF.json exists, /gsd-resume-work fires automatically with zero user intervention
  5. After auto-resume, the session is positioned at the correct phase/plan/task and can continue work immediately
**Plans**: TBD

### Phase 5: Backup Trigger and Lifecycle
**Goal**: Session continuity is robust -- works even when hooks fail, cleans up after itself, and gives users manual control
**Depends on**: Phase 4
**Requirements**: BKUP-01, BKUP-02, LIFE-01, LIFE-02, LIFE-03
**Success Criteria** (what must be TRUE):
  1. CLAUDE.md contains an instruction that causes Claude to check for HANDOFF.json at session start, independent of the SessionStart hook
  2. If SessionStart hook does not fire, the CLAUDE.md instruction alone is sufficient to trigger resume
  3. After successful resume, HANDOFF.json is deleted so subsequent sessions start fresh
  4. Stale checkpoints (older than a configurable threshold) are detected and handled rather than blindly resumed
  5. User can manually trigger a checkpoint save via a GSD command at any time, not only during PreCompact
**Plans**: TBD

### Phase 6: Upstream Compatibility and Documentation
**Goal**: Session continuity feature is documented, versioned clearly, and packaged as patches ready for upstream GSD contribution
**Depends on**: Phase 5
**Requirements**: UPST-01, UPST-02, UPST-03, UPST-04, DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
  1. The HANDOFF.json format produced by the plugin is compatible with upstream GSD's existing /gsd-pause-work checkpoint format
  2. Plugin version (v1.1) and GSD base version (1.33.0) are clearly distinguished in README, CHANGELOG, and any version-reporting output
  3. All session continuity changes are structured as isolated, reviewable patches (or PR-ready diffs) suitable for upstream contribution
  4. Plugin README documents the session continuity feature, its configuration options, and how it interacts with Claude Code hooks
  5. CHANGELOG reflects v1.1 changes with clear attribution to plugin vs base
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Skill and Agent Optimization | v1.0 | 3/3 | Complete | 2026-04-01 |
| 2. MCP Server | v1.0 | 2/2 | Complete | 2026-04-04 |
| 3. Plugin Packaging and Memory | v1.0 | 5/5 | Complete | 2026-04-06 |
| 4. Checkpoint and Resume | v1.1 | 0/? | Not started | - |
| 5. Backup Trigger and Lifecycle | v1.1 | 0/? | Not started | - |
| 6. Upstream Compatibility and Documentation | v1.1 | 0/? | Not started | - |
