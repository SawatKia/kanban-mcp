# Agent Workflows

The target MCP interface is organized around what an agent is trying to accomplish, not around every underlying Planka CRUD endpoint.

## Core workflow
1. Discover available work.
2. Read the Card and Checklist Task context.
3. Claim the work when required.
4. Start the work.
5. Checkpoint meaningful progress.
6. Submit the work for the next workflow stage.
7. Handle rejection or blocking explicitly.
8. Finish or hand off according to the workflow rules.

The exact transitions and permissions are defined by Tool Contract v1 and the workflow matrix; do not invent transitions in tool implementations.

## Design requirements
- Claims must have explicit ownership semantics.
- Handoffs must be explicit.
- Workflow transitions must be validated.
- Retries must not accidentally duplicate mutations.
- Errors must tell the agent what failed and, where possible, what it can do next.
