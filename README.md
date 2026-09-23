# Kanban MCP

An MCP server for interacting with Kanban boards through an agent-friendly interface.

This repository is a community-maintained derivative of the original [kanban-mcp](https://github.com/bradrisse/kanban-mcp) project. It keeps the original MIT license and attribution while focusing on agent-oriented MCP design, workflow semantics, canonical domain terminology, and Planka compatibility.

## Domain Model

The agent-facing domain uses this hierarchy:

```text
Board
└── List
    └── Card
        └── Checklist
            └── Task
```

- **Board** — contains multiple Lists.
- **List** — a workflow stage containing Cards. Also commonly called a column or lane.
- **Card** — the main unit of work. A Card can contain Checklists, Comments, and Labels.
- **Checklist** — a collection of Tasks belonging to a Card.
- **Task** — an individual Checklist item or sub-task.
- **Comment** — a progress/update log associated with a Card.
- **Label** — a tag that can be attached to Cards.

When both Cards and Checklist Tasks are present, the word **Task** means only the Checklist-level sub-task. A project-management "task" that represents a unit of work is a **Card**.

Planka-specific names such as `taskListId` remain internal compatibility terminology where required by the upstream API.

## Why This Project Exists

The original project provides a useful MCP bridge to Planka. This repository is being developed around a different optimization target: making Kanban operations easier for AI agents to discover, understand, execute, verify, and recover from.

The project therefore emphasizes:

- intent-oriented MCP tools;
- explicit workflow transitions;
- safe claims and handoffs;
- machine-actionable errors;
- idempotent and retry-safe mutations;
- context-efficient responses;
- batch operations with explicit result semantics;
- a clear compatibility boundary around Planka API details.

The goal is not to minimize the number of tools. The goal is to make the tool surface understandable and reliable for agents.

## Documentation

- [Repository rules](./AGENTS.md)
- [Domain context](./CONTEXT.md)
- [Architecture decisions](./DECISIONS.md)
- [Current progress](./TASK_PROGRESS.md)
- [Documentation index](./docs/README.md)
- [Development architecture](./docs/development/architecture.md)
- [Agent workflows](./docs/agents/agent-workflows.md)
- [Tool selection](./docs/agents/tool-selection.md)
- [Tool reference](./docs/reference/tool-reference.md)
- [Planka compatibility](./docs/reference/planka-compatibility.md)
- [Implementation plans](./plans/README.md)
- [Security policy](./SECURITY.md)
- [Contributing](./CONTRIBUTING.md)

## Quick Start

### Prerequisites

- Node.js 18 or newer.
- A running Planka instance, or the included Docker Compose setup.
- npm.

### Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Then replace the placeholder values in `.env`. Never commit the resulting `.env` file.

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### Install and Build

```bash
npm ci
npm run build
```

The compiled MCP server is written to `dist/index.js`.

### Run with an Existing Planka Instance

Set these variables in `.env`:

```env
PLANKA_BASE_URL=http://localhost:3333
PLANKA_AGENT_EMAIL=agent@example.com
PLANKA_AGENT_PASSWORD=replace-me
SERVER_PORT=3008
```

Then run:

```bash
node dist/index.js
```

### Run Planka and MCP Together with Docker Compose

```bash
cp .env.example .env
# edit .env
docker compose --env-file .env up -d --build
```

The default local endpoints are:

- Planka: http://localhost:3333
- MCP server: http://localhost:3008

Do not expose these development services directly to the public internet without reviewing authentication, network binding, credentials, and reverse-proxy configuration.

### MCP Inspector

Build first, then run:

```bash
npm run inspector
```

The inspector uses the same environment-based Planka credentials as the server.

## Testing

Run the build:

```bash
npm run build
```

Run the default test suite:

```bash
npm test
```

The integration suite requires a running Planka instance and test credentials:

```bash
npm run test:integration
```

Also run:

```bash
git diff --check
```

before submitting changes.

## Docker

The repository includes a multi-stage Dockerfile for the MCP server and a Docker Compose setup for local Planka + PostgreSQL + MCP development.

Build the MCP image:

```bash
npm run build-docker
```

## Development

This project is under active architectural development. Read [TASK_PROGRESS.md](./TASK_PROGRESS.md) and the current plans before making structural changes.

Non-trivial architecture decisions belong in [DECISIONS.md](./DECISIONS.md). The canonical domain terminology is maintained in [CONTEXT.md](./CONTEXT.md).

## Upstream

This repository is derived from [bradrisse/kanban-mcp](https://github.com/bradrisse/kanban-mcp).

The upstream project remains the source of the original implementation and MIT attribution. This repository maintains its own development history and may diverge substantially in architecture and behavior.

## License

This project is distributed under the MIT License. See [LICENSE](./LICENSE).
