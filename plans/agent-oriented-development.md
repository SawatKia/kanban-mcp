# Kanban MCP — Agent-Oriented Development Plan

## Purpose

Transform the MCP surface from a consolidated Planka CRUD wrapper into an API designed around how AI coding agents discover, claim, execute, review, and finish work.

Do not optimize for the minimum number of tools. Optimize for correct tool selection, low unnecessary tool-call count, predictable context, safe retries, and recoverable errors.

## Current State

The current project already consolidated many low-level operations into manager tools: projects/boards, lists, cards, tasks/checklists, labels, comments, memberships, batch card creation, label discovery, and card/task querying.

The main remaining problem is that manager tools still make the agent reason through a second-level action enum and large shared parameter schemas. For example, card_manager and task_manager combine many unrelated intents behind one tool.

## Target Architecture

Planka API -> domain operations -> agent-oriented service layer -> semantic MCP tools -> AI agent

Keep domain operations reusable. Design the agent-facing layer around intent rather than database entities.

## Design Principles

### 1. One primary intent per tool

Prefer a semantic operation such as kanban_move_card(card_id, target_list_id) over card_manager(action='move', id=..., listId=...).

A tool may execute multiple backend calls when those calls form one coherent agent intent.

### 2. Design around agent intent

The MCP should answer questions such as:

- What work can I do next?
- What is the context of this card?
- Can I claim this work?
- Why is this work blocked?
- Can I submit this work for review?
- What changed since my last checkpoint?

Do not force the agent to reconstruct these concepts from raw CRUD calls.

### 3. Keep low-level escape hatches

Advanced query/update operations may remain available, but normal agent workflows should not require them.

## Proposed Tool Surface

### Discovery

- kanban_get_workspace
- kanban_get_board_context
- kanban_get_card
- kanban_search
- kanban_get_next_work
- kanban_get_workflow

### Direct mutations

- kanban_create_card
- kanban_update_card
- kanban_move_card
- kanban_delete_card
- kanban_create_tasks
- kanban_update_task
- kanban_complete_task
- kanban_add_comment
- kanban_set_labels

### Agent workflow

- kanban_claim_work
- kanban_start_work
- kanban_checkpoint
- kanban_submit_work
- kanban_finish_work

### Batch

- kanban_batch_create_cards

This is a target surface, not a requirement to implement everything in one change.

## Highest-Priority Capabilities

### kanban_get_next_work(role)

Resolve actionable work server-side using role, workflow state, dependencies, blocked status, priority/position, and readiness. Return enough context for the agent to begin work without a chain of unnecessary discovery calls.

### kanban_claim_work(card_id)

Atomically verify that work is actionable, prevent incompatible concurrent claims, record the claim, perform any required workflow transition, and return the resulting work context. It must be safe to retry.

### kanban_start_work(card_id)

Represent one coherent intent rather than exposing a sequence such as validate -> resolve target list -> move card -> start stopwatch.

### kanban_submit_work(card_id)

Validate required tasks, dependencies, and workflow requirements before transitioning to the appropriate review state.

### kanban_finish_work(card_id)

Validate completion requirements before transitioning to DONE. Do not rely on the model to remember every completion rule.

## Response Contract

All tools should eventually use a consistent machine-readable envelope.

Success fields:

- success: true
- operation
- data
- context
- nextActions

Failure fields:

- success: false
- error.code
- error.message
- error.details

Avoid returning only a JSON string when structured information can be represented directly in the response contract.

## Machine-Actionable Errors

Introduce stable error codes, including:

- MISSING_PARAMETER
- NOT_FOUND
- INVALID_PARAMETER
- PERMISSION_DENIED
- INVALID_WORKFLOW_TRANSITION
- CARD_NOT_READY
- DEPENDENCY_BLOCKED
- ALREADY_CLAIMED
- CONFLICT
- DUPLICATE_OPERATION
- UPSTREAM_ERROR

Errors should identify the affected resource and parameter whenever possible.

## Idempotency and Retry Safety

AI agents can retry after timeouts or ambiguous responses. Mutation semantics therefore need explicit idempotency rules.

At minimum, make claim work, start work, move card, complete task, submit work, finish work, and set labels retry-safe.

Comments and batch operations need special handling to prevent accidental duplicates.

## Workflow as a First-Class Domain

Represent valid workflow transitions explicitly rather than making agents infer them from list names or labels.

Example states currently relevant to the agent workflow include:

- TODO
- IN_PROGRESS
- WAITING_REVIEW
- WAITING_TEST
- DONE
- BLOCKED
- NEEDS_CLARIFICATION
- FAILED

The exact transition matrix must be derived from the real project requirements before implementation.

Expose allowed transitions to the agent instead of making it guess.

## Search Strategy

Keep a powerful low-level query capability as an escape hatch, but add intent-oriented operations such as:

- kanban_search — arbitrary search
- kanban_get_next_work — actionable work
- kanban_get_blocked_work — blocked work
- kanban_get_recent_changes — session recovery

## Tool Description Standard

Every agent-facing tool should concisely explain:

1. PURPOSE
2. WHEN TO USE
3. WHEN NOT TO USE
4. INPUT
5. OUTPUT
6. SIDE EFFECTS
7. RETRY / IDEMPOTENCY behavior

Descriptions should optimize tool selection instead of duplicating the full API reference.

## Batch Operations

Keep kanban_batch_create_cards. Return per-item success/failure information and explicitly define whether the batch is atomic or partially successful.

## Capability Duplication

The current surface exposes duplicate aliases for some capabilities, including scheduler_list_labels / mcp_kanban_list_labels and scheduler_query_tasks / mcp_kanban_query_tasks.

Choose one canonical agent-visible name. Compatibility aliases may remain internally if necessary, but should not unnecessarily increase the model-visible tool surface.

## Upstream Issues and Compatibility Requirements

The upstream repository currently has four open GitHub issues plus an open pull request that directly affect the development roadmap. These are treated as source requirements, not as proof that every proposed fix is correct.

### Upstream issue #7 — Claude Code support and agent handoff

Request: make the project usable from Claude Code, allow Claude Code agents to be assigned to columns, and automatically move a card to the next agent when work finishes.

Development implications:

- Treat agent roles/assignment as a first-class workflow concept rather than encoding it only in prompts or column names.
- Define explicit role-to-workflow mapping and ownership/claim semantics.
- Support safe handoff between agents, including the identity/role of the current and next worker.
- Make completion/submission transitions capable of triggering deterministic next-step routing.
- Add Claude Code integration documentation and end-to-end scenarios.
- Do not make automatic handoff destructive or irreversible; expose the resulting transition and next assignee in the response.

Related target capabilities: kanban_get_next_work, kanban_claim_work, kanban_submit_work, kanban_finish_work, and workflow/assignment context.

### Upstream issue #6 — Practical strategy examples

Request: provide concrete examples for Human-Driven Development with LLM Support and Collaborative Grooming and Planning.

Development implications:

- Add copy-pasteable end-to-end agent scenarios to the repository documentation.
- Show the intended sequence of MCP calls, expected responses, human checkpoints, and handoff behavior.
- Include both human-driven and agent-driven workflows so users can understand when each tool should be used.
- Treat these examples as executable scenario specifications where practical, so documentation does not drift from actual tool behavior.

Related plan areas: Phase 1 Agent Scenarios, Tool Description Standard, and MCP contract tests.

### Upstream issue #4 — README/wiki documentation mismatch

Request: clarify whether the project intends to keep using the GitHub Wiki or move the referenced content elsewhere. The README currently references wiki content while the repository itself also contains documentation.

Development implications:

- Establish one canonical documentation source for agent usage, architecture, API reference, and workflow strategies.
- Remove or explicitly redirect stale README/wiki references.
- Prefer repository-versioned documentation for agent contracts, examples, and development requirements so documentation changes can be reviewed with code.
- Add documentation consistency checks where practical.

Related plan areas: Phase 0 Tool Contract, Phase 4 Compatibility, and documentation migration.

### Upstream issue #3 — Planka v2 compatibility

Request: support Planka v2; the reporter specifically lost MCP functionality, including card creation, after upgrading to Planka v2.

This is a compatibility requirement with direct impact on the operation layer. The upstream issue is still visible, and the repository also has an open PR #10 proposing Planka v2.1.1 route changes. That PR describes route changes for comments, board memberships, card labels, and task creation, plus the new first-class comment response shape and task-list nesting in Planka v2.

Development implications:

- Define the supported Planka version explicitly.
- Add a compatibility boundary/version-aware operation layer rather than scattering Planka-version assumptions through MCP tools.
- Add integration tests against the supported Planka v2 API for every operation used by MCP tools.
- Preserve stable domain-level signatures where possible even when Planka API routes change.
- Treat task-list nesting and changed comment representations as domain translation concerns, not agent-facing schema changes.
- Verify all existing operations, not only the routes listed in the upstream PR, before declaring v2 support complete.
- Track PR #10 as upstream reference material to validate against; do not assume an open upstream PR has been merged or is the final implementation.

### Upstream issue-derived priority

These upstream requests reinforce the existing agent-oriented roadmap in four directions:

1. Agent workflow and handoff — roles, claims, transitions, and automatic next-agent routing.
2. Executable documentation — concrete strategy examples and scenario-based documentation.
3. Documentation consistency — one canonical, versioned source of truth.
4. Planka compatibility — isolate upstream API churn behind a stable domain layer and test it explicitly.

These should be incorporated into Tool Contract v1 and the Phase 1 scenarios before the main refactor.

## Implementation Plan

### Phase 0 — Tool Contract

Before major implementation changes:

- define canonical tool names
- define input conventions
- define response envelopes
- define error codes
- define workflow transitions
- define idempotency rules
- define backward-compatibility policy

### Phase 1 — Agent Scenarios

Create realistic scenarios:

1. New agent session
2. Discover available work
3. Claim work
4. Load card context
5. Execute implementation
6. Record checkpoint
7. Submit for review
8. Handle review rejection
9. Resume blocked work
10. Finish work

Measure tool-call count, invalid calls, invalid parameters, unnecessary reads, duplicate mutations, response/context size, and recovery behavior.

### Phase 2 — Service Layer

Extract reusable domain operations from the large MCP registration layer. Suggested conceptual areas:

- domain/cards
- domain/tasks
- domain/workflow
- domain/search
- agent/context
- agent/readiness
- agent/claims
- mcp/discovery
- mcp/mutations
- mcp/workflow
- mcp/batch
- schemas
- errors
- responses

The final directory layout must follow the existing project conventions rather than blindly applying this structure.

### Phase 3 — First Agent Tools

Implement in this order:

1. kanban_get_next_work
2. kanban_get_card
3. kanban_claim_work
4. kanban_start_work
5. kanban_submit_work
6. kanban_finish_work
7. kanban_search

### Phase 4 — Compatibility

Keep existing manager tools temporarily if required. Mark them as compatibility/low-level capabilities and migrate documentation and examples to the semantic tools.

### Phase 5 — Removal

Remove legacy tools only after scenario tests pass, tool selection has been validated, compatibility impact is understood, and project documentation has migrated.

## Testing Strategy

### Schema tests
Verify invalid combinations are rejected before execution.

### Domain tests
Verify workflow transitions, dependencies, claims, idempotency, and conflict handling.

### MCP contract tests
Verify tool names, descriptions, schemas, response envelopes, and error codes.

### Agent scenario tests
Run realistic multi-step workflows and record tool-call traces.

The important metric is not only code coverage. Measure whether an agent completes workflows with fewer incorrect and unnecessary calls.

## Success Criteria

The redesign is successful when an AI agent can:

- discover actionable work without reconstructing readiness rules
- obtain sufficient context in a small number of calls
- execute common workflow transitions through semantic operations
- recover from validation and conflict errors without guessing
- safely retry mutations
- understand why work is blocked
- avoid duplicate operations
- use advanced query tools only when necessary

## Non-Goals

- Do not optimize solely for minimum MCP tool count.
- Do not expose every Planka API endpoint as an MCP tool.
- Do not force agents to understand Planka's internal API model.
- Do not put all workflow logic into tool descriptions.
- Do not silently mutate unrelated cards as a side effect.
- Do not remove capabilities merely to make the tool list smaller.

## Immediate Next Step

Before implementation, inspect the existing operation layer and tests and produce Tool Contract v1 containing the canonical tool list, exact schemas, response schemas, error codes, workflow transition matrix, idempotency rules, and mapping from current tools to the new tools.

Only after Tool Contract v1 is approved should the implementation refactor begin.