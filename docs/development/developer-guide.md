# 👨‍💻 Developer Guide

This guide is intended for developers who want to contribute to or modify the Kanban MCP project.

## 🏗️ Project Architecture

The Kanban MCP project consists of several modular layers:

1. **🖥️ MCP Server (`index.ts`)**: Initializes `@modelcontextprotocol/sdk` `McpServer`, defines tool schemas with Zod, and binds request handlers.
2. **🔌 Operations Layer (`operations/`)**: Pure TypeScript functions wrapping Planka REST API endpoints (`cards.ts`, `tasks.ts`, `boards.ts`, `lists.ts`, `labels.ts`, `comments.ts`, `projects.ts`, `boardMemberships.ts`, `importExport.ts`).
3. **🛠️ Higher-Level Tools (`tools/`)**: Workflow aggregators combining multiple operations (e.g. `batch-create-cards.ts`, `board-summary.ts`, `card-details.ts`, `query-and-labels.ts`).
4. **📦 Common Utilities & Types (`common/`)**: Shared types, Zod schemas, HTTP request client with auto-reauthentication, and error handlers.

### 📁 Directory Structure

```
kanban-mcp/
├── common/                     # Common types, schemas, and utility functions
│   ├── errors.ts               # Error handling classes and utilities
│   ├── setup.ts                # Admin/agent authentication and ID resolution
│   ├── types.ts                # Zod schemas & TypeScript type definitions
│   ├── utils.ts                # plankaRequest HTTP client & authentication
│   └── version.ts              # Server version constant
├── operations/                 # Direct Planka API operation modules
│   ├── boardMemberships.ts     # Board membership & roles
│   ├── boards.ts               # Board management
│   ├── cards.ts                # Card CRUD, move, duplicate, position, stopwatch
│   ├── comments.ts             # Card comments
│   ├── importExport.ts         # Board export & import
│   ├── labels.ts               # Label management & card labeling
│   ├── lists.ts                # Board columns/lists
│   ├── projects.ts             # Projects
│   └── tasks.ts                # Checklists (task-lists) and step tasks
├── tools/                      # Consolidated high-level tools
│   ├── batch-create-cards.ts   # Batch card creation with checklists & labels
│   ├── board-summary.ts        # Comprehensive board overview & stats
│   ├── card-details.ts         # Card details with checklists & comments
│   ├── create-card-with-tasks.ts # Single card creation with checklist tasks
│   ├── query-and-labels.ts     # Label discovery & complex task/card search
│   └── workflow-actions.ts     # Workflow transitions & state helpers
├── tests/                      # Jest test suites
│   ├── integration.test.ts     # Live Planka integration tests
│   └── query-and-labels.test.ts# Unit tests for query and label mapping
├── index.ts                    # Main MCP server entry point & tool registration
├── package.json                # Project dependencies and npm scripts
└── tsconfig.json               # TypeScript configuration
```

## 🚀 Development Setup

### 📋 Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Docker and Docker Compose
- Git

### 🛠️ Setting Up the Development Environment

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd kanban-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Planka in development mode**:
   ```bash
   npm run up
   ```

4. **Build and test the MCP server**:
   ```bash
   npm run build
   npm test
   ```

5. **Test with MCP Inspector**:
   ```bash
   npm run inspector
   ```

## ✨ Adding or Modifying Tools

### 🆕 Adding a New Tool

1. **Implement API operations** in `operations/` (e.g. `operations/cards.ts`, `operations/tasks.ts`).
2. **Implement high-level tool logic** in `tools/` (e.g. `tools/batch-create-cards.ts`, `tools/query-and-labels.ts`).
3. **Register the tool** in `index.ts` using `server.tool(...)` with Zod parameter schemas and descriptions:
   ```typescript
   server.tool(
     "tool_name",
     "Tool description explaining what it does...",
     {
       cardId: z.string().describe("Card ID"),
       position: z.number().optional().describe("Vertical position (lower = top, higher = bottom)"),
     },
     async (args) => {
       const result = await someOperation(args);
       return {
         content: [{ type: "text", text: JSON.stringify(result) }],
       };
     }
   );
   ```
4. **Export schemas and types** from `tools/index.ts` or `common/types.ts`.
5. **Run tests**:
   ```bash
   npm test
   ```
6. **Build**:
   ```bash
   npm run build
   ```

## 🧪 Testing

### 🔬 Unit Tests
Run unit tests with Jest:
```bash
npm test -- tests/query-and-labels.test.ts
```

### 🔄 Integration Tests
Integration tests test the live Planka container endpoints:
```bash
npm test -- tests/integration.test.ts
```

## 🤝 Contributing Guidelines

1. **Hierarchy Discipline**:
   - Board List (Column) -> Card -> Checklist -> Task (Step item).
2. **Minimal Diff Principle**:
   - Surgical changes only; reuse existing operations and utilities before creating new ones.
3. **Type Safety**:
   - Always define and validate with Zod schemas in `common/types.ts` and `operations/`.
4. **Position Semantics**:
   - Always preserve ascending sort order (smaller numbers = top of list/checklist, larger numbers = bottom).
5. **Documentation**:
   - Keep `README.md` and the canonical `docs/` documentation up to date with all supported tool capabilities.