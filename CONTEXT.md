# CONTEXT.md

## Purpose
Canonical Ubiquitous Language, domain terms, aliases, and entity relationships for Kanban MCP.

## Canonical Terminology

The hierarchy is intentionally strict:

**Board → List → Card → Checklist → Task**

Do not use these terms interchangeably. In particular, **Card** and **Task** are different domain entities.

### Board

A **Board** is the top-level work area.

- A board contains multiple **Lists**.
- A board is the primary scope for workflow organization.

### List

A **List** is a workflow column/stage inside a board.

- Each list contains multiple **Cards**.
- **Canonical term:** List.
- **Aliases:** column, lane, list.
- In agent-facing documentation and tool contracts, prefer **List**. The aliases may be mentioned only when mapping existing Planka terminology or user language.

### Card

A **Card** is the unit of work being worked on.

From a human/project-management point of view, a card represents a **task/work item**. However, the canonical domain term is **Card**, not Task.

A card can contain:

- **Checklist(s)**
- **Comment(s)**
- **Label(s)**

Typically, a card contains **one Checklist**, although the domain should not assume that this is an absolute invariant unless enforced by a separate contract.

### Checklist

A **Checklist** is a collection of sub-tasks/checkable work items belonging to a Card.

- A checklist contains multiple **Tasks**.
- A checklist is the parent container for Tasks.

### Task

A **Task** is a sub-task belonging to a Checklist.

- **Canonical term:** Task.
- **Aliases:** task, sub-task.
- In contexts where both Cards and Tasks are present, never use “task” to refer to a Card.
- A Task should always be understood as a child of a Checklist unless a specific legacy/API context is being discussed.

### Comment

A **Comment** is a log/message associated with a Card.

- Comments are used to record updates, decisions, progress, or other relevant information about a particular card.
- A comment belongs to a specific Card.

### Label

A **Label** is a tag attached to a Card for classification/filtering.

- A Card can have one or more Labels.
- Relationship: **Card 1:N Label** from the Card perspective.
- A Label can be associated with multiple Cards.

## Aliases and Disambiguation

| User/API term | Canonical domain term | Meaning |
|---|---|---|
| board | **Board** | Top-level work area |
| column | **List** | Workflow stage containing Cards |
| lane | **List** | Workflow stage containing Cards |
| list | **List** | Canonical term |
| task (human/project-management sense) | **Card** | A work item being worked on |
| task (checklist sense) | **Task** | A sub-task under a Checklist |
| sub-task | **Task** | A child work item under a Checklist |

When ambiguity exists, qualify the term explicitly: **Card/work item** or **Checklist Task/sub-task**.

## Other Domain Terms

- **Membership**: relationship between a user/agent identity and a Board.
- **Agent role**: a functional worker identity such as PLANNER, CODER, REVIEWER, TESTER, RESEARCHER, or ARCHITECT.
- **Claim**: an ownership operation that reserves actionable work for a worker and must be safe under concurrency.
- **Handoff**: a workflow transition that makes work available to another role/agent.
- **Workflow transition**: a validated state change between defined work stages.
- **Readiness**: whether a Card satisfies the conditions required for a role to begin work.
- **Blocked**: work that cannot currently proceed because of an explicit dependency, validation failure, or workflow condition.

## Entity Relationships

- A Board contains multiple Lists.
- Each List contains multiple Cards.
- A Card belongs to a Board and is positioned in a List.
- A Card typically contains one Checklist and may contain multiple Checklists where supported.
- A Checklist contains Tasks.
- A Card contains Comments.
- A Card can have one or more Labels.
- A Label can be associated with multiple Cards.
- A Board has Memberships.
- A Card may be claimed by one compatible worker at a time according to workflow rules.
- Agent roles participate in workflow transitions and may determine which work is actionable next.

## Domain Boundary

Planka API concepts are infrastructure details. Agent-facing tools and documentation should expose the canonical domain concepts above rather than require agents to understand Planka route structure or version-specific payloads.

When an existing Planka/API field uses ambiguous terminology, translate it at the domain boundary instead of leaking the ambiguity into agent-facing contracts.

## Versioning Principle

When Planka changes routes or response shapes, translate those changes inside the operation/compatibility boundary while preserving stable agent-facing semantics wherever possible.
