# DECISIONS.md

## Purpose
Decision log for non-trivial architectural and implementation decisions. Record trade-offs and rejected alternatives to prevent context drift and regression into previously rejected designs.

## Decision Record Format

### ADR-XXXX — <Title>
- **Status:** Proposed | Accepted | Superseded | Rejected
- **Date:** YYYY-MM-DD
- **Context:** Why this decision is needed.
- **Decision:** What was chosen.
- **Trade-offs:** Benefits and costs.
- **Rejected alternatives:** Options considered but not chosen, with reasons.
- **Consequences:** Expected impact on architecture, implementation, testing, and migration.
- **References:** Related plans, issues, PRs, or code.

## Initial Decisions

### ADR-0001 — Design MCP tools around agent intent
- **Status:** Accepted
- **Context:** Consolidated manager tools require agents to select a second-level action and infer large shared schemas.
- **Decision:** Prefer semantic, intent-oriented tools for normal agent workflows while retaining low-level escape hatches where justified.
- **Trade-offs:** More MCP tool definitions and a stronger domain layer in exchange for better tool selection and workflow semantics.
- **Rejected alternatives:** Optimizing solely for minimum tool count; exposing every Planka API endpoint directly.
- **Consequences:** Tool contracts must be explicit and workflow operations may encapsulate multiple backend calls.

### ADR-0002 — Keep workflow semantics above Planka API details
- **Status:** Accepted
- **Context:** Planka versions can change routes and response shapes, as demonstrated by the upstream Planka v2 compatibility issue.
- **Decision:** Keep stable domain/agent semantics above the Planka operation layer and isolate version-specific API translation below it.
- **Trade-offs:** Requires compatibility code and integration tests.
- **Rejected alternatives:** Exposing Planka route/payload details directly to agents.
- **Consequences:** Agent-facing tools should remain stable when upstream API details change.

### ADR-0003 — Treat claims and handoffs as explicit workflow operations
- **Status:** Accepted
- **Context:** Upstream issue #7 requests agent assignment by columns and automatic movement to the next agent when work finishes.
- **Decision:** Model role assignment, claims, handoffs, and transition rules explicitly and make them concurrency-safe.
- **Trade-offs:** More domain state and validation; substantially clearer ownership and recovery behavior.
- **Rejected alternatives:** Relying on prompt instructions or column names alone to coordinate agents.
- **Consequences:** Tool Contract v1 must define ownership, transition, and idempotency semantics.

## Rule
Any new non-trivial architectural or implementation decision must be recorded here before it becomes an implicit convention.
