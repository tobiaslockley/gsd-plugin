<!-- GSD:project-start source:minimal -->
## Project

Loaded on demand by GSD commands.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:minimal -->
## Technology Stack

Loaded on demand by GSD commands.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:minimal -->
## Conventions

Loaded on demand by GSD commands.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:minimal -->
## Architecture

Loaded on demand by GSD commands.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

## Plugin boundaries

The plugin MUST NOT write to any path outside the project's `.planning/` directory.
This includes (but is not limited to):
  - ~/.claude/settings.json
  - ~/.claude/agents/, ~/.claude/skills/, ~/.claude/hooks/, ~/.claude/commands/
  - Project-level .mcp.json (outside .planning/)

For legacy artifacts that need removal, print a manual-removal checklist.
Do not delete or rename user-owned config.

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
