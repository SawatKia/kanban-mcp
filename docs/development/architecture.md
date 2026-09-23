# Architecture

## Current direction
Kanban MCP is evolving from a Planka CRUD wrapper into an **agent-oriented API**.

The agent-facing boundary should expose stable domain semantics such as Cards, work discovery, claims, workflow transitions, handoffs, and checkpoints. Planka API routes and version-specific payloads belong behind the operation/service boundary.

## Layers
1. **MCP interface** — tool names, schemas, descriptions, response envelopes.
2. **Domain/service layer** — agent-oriented operations and workflow semantics.
3. **Operation layer** — reusable Planka operations.
4. **Compatibility layer** — Planka-version-specific routes, payloads, and response translation.
5. **Infrastructure** — HTTP client, configuration, persistence/runtime concerns.

The exact module boundaries will be refined during implementation. Do not start the broad refactor before Tool Contract v1 and workflow semantics are approved.

## Design priorities
1. Correct tool selection.
2. Discoverable workflows.
3. Small, useful context returned to agents.
4. Safe retries and explicit concurrency behavior.
5. Machine-actionable errors.
6. Compatibility without leaking Planka-specific details into the agent contract.

See `CONTEXT.md`, `DECISIONS.md`, and `plans/agent-oriented-development.md`.
