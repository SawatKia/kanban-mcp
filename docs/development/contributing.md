# Contributing

## Before changing code
1. Read `AGENTS.md`.
2. Read `CONTEXT.md` for domain terminology.
3. Check `DECISIONS.md` for accepted architectural decisions.
4. Check `TASK_PROGRESS.md` and the active plan.
5. Identify compatibility and migration implications.

## Change discipline
- Prefer the smallest coherent change.
- Preserve existing behavior unless a contract change is intentional.
- Keep agent-facing semantics separate from Planka API details.
- Add or update tests for contract, workflow, and compatibility changes.
- Record non-trivial decisions.
- Update progress when handing work off.

## Pull requests
Explain what changed and why, affected tool/domain contracts, compatibility implications, tests run, and known limitations or migration requirements.

Do not commit secrets, `.env` files, local MCP configuration, generated artifacts, or private agent state.
