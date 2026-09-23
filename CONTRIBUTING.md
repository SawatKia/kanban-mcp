# Contributing

Thanks for contributing to Kanban MCP.

## Before You Start

Read these files first:

- [AGENTS.md](./AGENTS.md) — repository rules and engineering workflow.
- [CONTEXT.md](./CONTEXT.md) — canonical domain terminology and entity relationships.
- [DECISIONS.md](./DECISIONS.md) — architectural decisions.
- [TASK_PROGRESS.md](./TASK_PROGRESS.md) — current implementation state.
- [docs/](./docs/) — canonical user, developer, agent, and reference documentation.

## Development Rules

- Keep agent-facing terminology aligned with the canonical hierarchy: **Board → List → Card → Checklist → Task**.
- Treat Planka API terminology as an infrastructure detail. Translate it at the compatibility boundary instead of leaking it into agent-facing APIs.
- Prefer semantic, intent-oriented MCP tools over raw CRUD when both are available.
- Preserve workflow semantics, validation, idempotency, and safe recovery.
- Do not commit secrets, `.env` files, local MCP configuration, agent state, database backups, or generated local state.
- Keep documentation and source-of-truth files synchronized with architectural changes.

## Validation

Before opening a pull request:

```bash
npm ci
npm run build
npm test
npm run test:integration  # requires a running Planka instance and test credentials
git diff --check
```

If a check cannot be run locally, explain why in the pull request.

## Pull Requests

Keep pull requests focused on one intent. Explain:
- what changed;
- why it changed;
- compatibility impact;
- tests run and their results;
- any migration or configuration implications.

For changes affecting Planka compatibility, include the relevant Planka version and API behavior.
