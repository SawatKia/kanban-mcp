# Repository Instructions

## Source of Truth

Read these files before making architecture or workflow changes:

- `CONTEXT.md` — canonical domain terminology and entity relationships.
- `DECISIONS.md` — accepted architectural and implementation decisions.
- `TASK_PROGRESS.md` — current implementation state.
- `plans/README.md` — implementation planning conventions.
- `plans/agent-oriented-development.md` — strategic roadmap for the agent-oriented redesign.
- `docs/` — canonical repository documentation.

## Domain Terminology

Use the canonical hierarchy:

```text
Board
└── List
    └── Card
        └── Checklist
            └── Task
```

- **Board** contains Lists.
- **List** is a workflow stage containing Cards; `column` and `lane` are aliases.
- **Card** is the main unit of work.
- **Checklist** contains Tasks belonging to a Card.
- **Task** is a Checklist sub-task.
- **Comment** is an update/log associated with a Card.
- **Label** is a tag attached to one or more Cards.

Never use `Task` ambiguously to mean a Card when both Cards and Checklist Tasks are in scope.

Planka API names are infrastructure terminology. Keep names such as `taskListId` at the Planka compatibility boundary rather than leaking them into agent-facing domain APIs unless there is a compatibility reason.

## Architecture Rules

- Prefer agent-intent and workflow semantics over raw Planka CRUD when designing agent-facing tools.
- Preserve the domain boundary between agent-facing concepts and Planka API details.
- Workflow transitions, claims, handoffs, validation, idempotency, retry safety, and concurrency behavior must be explicit and testable.
- Avoid unrelated side effects in tool operations.
- Standardize successful and failed tool responses so agents can act on them reliably.
- Keep batch operations explicit about per-item failures and atomicity/partial-success behavior.

## Documentation Rules

- `CONTEXT.md` is the canonical terminology source.
- Record non-trivial architectural decisions in `DECISIONS.md`.
- Keep `TASK_PROGRESS.md` synchronized with implementation state.
- Keep `docs/` synchronized with behavior and public interfaces.
- Do not treat the upstream repository or its issues/PRs as authoritative for this repository; validate compatibility requirements before implementation.

## Security Rules

Never commit:

- `.env` files containing real values;
- credentials, API keys, access tokens, or private keys;
- local MCP configuration;
- `.serena/`, `.kilo/`, `.vscode/`, or other machine-local agent state;
- database dumps, backups, or generated local data.

Use `.env.example` for configuration documentation.

## Validation

Before publishing or opening a pull request, run:

```bash
npm ci
npm run build
npm test
git diff --check
```

Do not claim the repository is passing if a check fails.

## Git Hygiene

Keep commits focused by intent. Do not use `git add .` for unrelated changes. Review staged content before committing.

For the new public repository, do not carry forward the upstream Git history containing old local configuration files. Create a fresh repository history from the cleaned working tree after the public-repo preflight is complete.
