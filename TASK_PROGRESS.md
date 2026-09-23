# TASK_PROGRESS.md

## Current Status
Planning / architecture preparation.

## Completed
- Inspected the existing MCP tool surface and operation structure.
- Identified manager-tool cognitive load and duplicated capabilities.
- Added the agent-oriented development roadmap.
- Reviewed upstream open issues and incorporated their requirements into the roadmap.
- Added repository rules, domain context, planning, and decision-log foundations.
- Reorganized documentation into versioned `docs/` and `plans/` structures.
- Migrated the former `wiki/` documents into canonical repository documentation.
- Updated README documentation navigation to point to the canonical docs.
- Removed the tracked `.env` from Git index while keeping it locally ignored.
- Removed hardcoded demo credentials from `package.json` and made the demo inspector use normal environment configuration.

## In Progress
- Tool Contract v1.
- Workflow state/transition definition.
- Agent role, claim, and handoff semantics.
- Planka version compatibility boundary and test matrix.

## Next Steps
1. Produce Tool Contract v1.
2. Map current tools to canonical semantic tools.
3. Define workflow transition and idempotency matrices.
4. Define agent scenarios and acceptance criteria.
5. Inspect current tests/operations for compatibility gaps.
6. Implement only after the contracts are approved.

## Handoff Notes
Do not begin a broad MCP registration refactor until the contract and workflow semantics are explicit. Preserve current behavior where migration requirements are not yet understood.
