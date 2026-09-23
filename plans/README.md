# Plans and ExecPlans

## Status
Planning baseline. Detailed implementation must be approved before major refactoring.

## Implementation Blueprint / ExecPlan

### Objective
Transform Kanban MCP from a consolidated Planka CRUD wrapper into an agent-oriented API optimized for correct tool selection, workflow execution, context efficiency, safe retries, and recoverable errors.

### Phase 0 — Contract
- Define canonical tool names and schemas.
- Define response envelopes and stable error codes.
- Define workflow transition matrix.
- Define role/assignment semantics.
- Define idempotency and concurrency rules.
- Define backward-compatibility policy.
- Define supported Planka versions.

### Phase 1 — Scenarios
Specify and test: session recovery, next-work discovery, claim, start, implementation, checkpoint, submit, review rejection, blocked work, handoff, and finish.

### Phase 2 — Service Layer
Separate reusable domain operations from MCP registration and schemas. Isolate Planka compatibility concerns from agent-facing contracts.

### Phase 3 — First Agent Tools
Implement and validate next-work discovery, card context, claim, start, submit, finish, and search.

### Phase 4 — Compatibility
Keep legacy manager tools temporarily where needed. Migrate documentation/examples to semantic tools and preserve compatibility deliberately.

### Phase 5 — Removal
Remove legacy capabilities only after scenario tests, contract tests, compatibility validation, and migration checks pass.

## Required Deliverables
- Tool Contract v1
- Workflow transition matrix
- Error contract
- Idempotency contract
- Agent scenario suite
- Planka compatibility test matrix
- Documentation/examples
- Migration/deprecation plan

## Detailed Roadmap
See `plans/agent-oriented-development.md` for the strategic roadmap, upstream issue-derived requirements, testing strategy, and success criteria.
