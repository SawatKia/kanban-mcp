# 📖 API Reference (MCP Tools)

This page provides comprehensive documentation for all 11 consolidated tools provided by the Kanban MCP server.

---

## 🧭 Kanban Hierarchy & Terminology

To prevent confusion across the system, Kanban MCP strictly uses the following terms:

| Term | Scope | Description |
| :--- | :--- | :--- |
| **Board List (Column/Lane)** | Board-level | Top-level column lanes on the board (e.g. `Backlog`, `To Do`, `In Progress`, `Done`). Managed by `mcp_kanban_list_manager`. |
| **Card** | List-level | A ticket or task item residing in a Board Column. Managed by `mcp_kanban_card_manager`. |
| **Checklist (Task-List)** | Card-level | A checklist container attached to a Card (e.g., `Checklist`, `QA Verification`). Managed by `mcp_kanban_task_manager`. |
| **Task (Checklist Item / Step)** | Checklist-level | An actionable step-by-step item inside a Checklist with boolean `isCompleted` status (`task ∈ checklist ∈ card`). |

---

## ↕️ Card Vertical Position Semantics

In Planka / Kanban MCP, vertical positions (`position`) within a list column or checklist are numeric and sorted in **ascending order**:

- **Lower / Smaller numbers** (e.g. `0`, `1000`, `65535`): Place the card/task **HIGHER up** (near the top / top of the column).
- **Higher / Larger numbers** (e.g. `131070`, `196605`, `262140`): Place the card/task **LOWER down** (near the bottom / towards the bottom of the column).

---

## 🛠️ MCP Tool Index

1. [`mcp_kanban_project_board_manager`](#1-mcp_kanban_project_board_manager) - Manage projects, boards, and get board summaries
2. [`mcp_kanban_list_manager`](#2-mcp_kanban_list_manager) - Manage board columns/lanes
3. [`mcp_kanban_card_manager`](#3-mcp_kanban_card_manager) - Manage cards, vertical positions, and card details
4. [`mcp_kanban_stopwatch`](#4-mcp_kanban_stopwatch) - Time tracking stopwatches on cards
5. [`mcp_kanban_label_manager`](#5-mcp_kanban_label_manager) - Manage board labels and attach/detach from cards
6. [`mcp_kanban_task_manager`](#6-mcp_kanban_task_manager) - Manage checklists and step-by-step checklist tasks
7. [`mcp_kanban_comment_manager`](#7-mcp_kanban_comment_manager) - Manage card comments and discussions
8. [`mcp_kanban_membership_manager`](#8-mcp_kanban_membership_manager) - Manage board user memberships and permissions
9. [`mcp_kanban_batch_cards`](#9-mcp_kanban_batch_cards) - Create multiple cards with checklists, labels, and comments in one call
10. [`scheduler_list_labels` / `mcp_kanban_list_labels`](#10-scheduler_list_labels--mcp_kanban_list_labels) - Discover labels with state breakdowns
11. [`scheduler_query_tasks` / `mcp_kanban_query_tasks`](#11-scheduler_query_tasks--mcp_kanban_query_tasks) - Search and filter cards and checklist tasks

---

## 1. `mcp_kanban_project_board_manager`

Manage projects and boards with various operations.

### Actions
- `get_projects`: Retrieve all projects (requires `page`, `perPage`).
- `get_project`: Retrieve project details by `id`.
- `create_project`: Create a new project (`name`).
- `delete_project`: Delete project by `id`.
- `get_boards`: Retrieve all boards in a project (`projectId`).
- `create_board`: Create a new board (`projectId`, `name`, `position`).
- `get_board`: Retrieve board details by `id`.
- `update_board`: Update board properties (`id`, `name`, `position`, optional `type`).
- `delete_board`: Delete board by `id`.
- `get_board_summary`: Get detailed board overview including cards and statistics (`boardId`, optional `includeTaskDetails`, `includeComments`).

---

## 2. `mcp_kanban_list_manager`

Manage Kanban board lists/columns (e.g. 'Backlog', 'To Do', 'In Progress', 'Done').

### Actions
- `get_all`: List all columns on a board (`boardId`).
- `create`: Create a new column (`boardId`, `name`, `position`).
- `get_one`: Get column details by `id`.
- `update`: Update column title and order (`id`, `name`, `position`).
- `delete`: Delete column by `id`.

---

## 3. `mcp_kanban_card_manager`

Manage Kanban cards (tickets) in board columns. Supports creating, updating, moving, duplicating, deleting, and positioning cards.

### Parameters
- `action`: `get_all`, `create`, `get_one`, `update`, `move`, `duplicate`, `delete`, `create_with_tasks`, `get_details`.
- `id`: Card ID.
- `listId`: Board list/column ID.
- `boardId`: Board ID (for cross-board moves).
- `projectId`: Project ID (for cross-project moves).
- `name`: Card title.
- `description`: Card markdown description.
- `position`: Vertical sort order. **Lower numbers = higher up / top**, **higher numbers = lower down / bottom**.
- `dueDate`: ISO date string.
- `isCompleted`: Boolean completion status.
- `tasks`: Array of step task names (for `create_with_tasks`).
- `comment`: Optional comment text.
- `cardId`: Card ID (for `get_details`).

---

## 4. `mcp_kanban_stopwatch`

Manage card stopwatches for real-time tracking.

### Actions
- `start`: Start timer for card (`id`).
- `stop`: Pause/stop timer for card (`id`).
- `get`: Get elapsed duration and current timer status (`id`).
- `reset`: Reset total duration to 0 (`id`).

---

## 5. `mcp_kanban_label_manager`

Manage board labels and assign/remove single or multiple labels to/from cards.

### Actions
- `get_all`: List all labels on board (`boardId`).
- `create`: Create a label (`boardId`, `name`, `color`, `position`).
- `update`: Update label (`id`, `name`, `color`, `position`).
- `delete`: Delete label (`id`).
- `add_to_card`: Attach label(s) to card (`cardId`, `labelId` or `labelIds`).
- `remove_from_card`: Remove label(s) from card (`cardId`, `labelId` or `labelIds`).

---

## 6. `mcp_kanban_task_manager`

Manage step-by-step tasks (actionable checklist items) inside a card's checklist (`task ∈ checklist ∈ card`).

### Actions
- `get_all`: List all tasks for card (`cardId`).
- `create`: Add task to card's checklist (`cardId` or `taskListId`, `name`, optional `checklistName`, `position`, `isCompleted`).
- `batch_create`: Add multiple tasks in one call (`tasks`).
- `get_one`: Get task by `id` (and optional `cardId`).
- `update`: Update task (`id`, optional `name`, `position`, `isCompleted`).
- `delete`: Delete task (`id`).
- `complete_task`: Mark task as done (`id`).
- `sync_referenced_card`: Mark tasks across the board referencing a completed card as done (`cardId`, optional `boardId`).
- `get_checklists`: List all checklists on a card (`cardId`).
- `create_checklist`: Create a new checklist on a card (`cardId`, `name`, optional `position`).
- `delete_checklist`: Delete a checklist container (`id`).

---

## 7. `mcp_kanban_comment_manager`

Manage card comments and threaded discussions.

### Actions
- `get_all`: List comments on card (`cardId`).
- `create`: Post a new comment (`cardId`, `text`).
- `get_one`: Get comment by `id`.
- `update`: Edit comment text (`id`, `text`).
- `delete`: Delete comment (`id`).

---

## 8. `mcp_kanban_membership_manager`

Manage user memberships and role access for boards.

### Actions
- `get_all`: List board memberships (`boardId`).
- `create`: Add user to board (`boardId`, `userId`, `role`: `editor`|`viewer`).
- `get_one`: Get membership details (`id`).
- `update`: Update member permissions (`id`, optional `role`, `canComment`).
- `delete`: Remove user from board (`id`).

---

## 9. `mcp_kanban_batch_cards`

Create multiple cards in a single atomic batch payload with checklists, labels, positions, and comments.

### Parameters
- `boardId`: Board ID (required for label auto-resolution).
- `listId`: Default column ID for cards.
- `cards`: Array of card objects:
  - `name`: Card title.
  - `listId`: Optional list override.
  - `description`: Card description.
  - `position`: Vertical position (lower = higher up, higher = lower down).
  - `checklistName`: Optional checklist name (default: "Checklist").
  - `tasks` / `checklist`: Step tasks as strings or `{ name, isCompleted }` objects.
  - `labels`: Array of label objects (`{ name, labelId, color }`). Missing labels are automatically created.
  - `comment`: Optional initial comment.

---

## 10. `scheduler_list_labels` / `mcp_kanban_list_labels`

List all existing labels across boards with total task counts and state breakdowns (e.g. `TODO`, `IN_PROGRESS`, `DONE`, `WAITING_REVIEW`, `WAITING_TEST`).

### Parameters
- `boardId`: Optional board ID to scope search.

---

## 11. `scheduler_query_tasks` / `mcp_kanban_query_tasks`

Search and filter cards and checklist tasks across the Kanban board by complex criteria.

### Parameters
- `boardId`: Optional board ID.
- `taskId`: Filter by Card ID or Checklist Task ID substring.
- `labels`: Array of label names.
- `labelMatchMode`: `'any'` (OR) or `'all'` (AND).
- `text`: Keyword search across Title, Description, Allowed Files, and Checklist tasks.
- `state`: Filter by state: `TODO`, `IN_PROGRESS`, `WAITING_REVIEW`, `WAITING_TEST`, `DONE`, `BLOCKED`, `NEEDS_CLARIFICATION`, `FAILED`.
- `assignedPosition`: Filter by agent role: `PLANNER`, `CODER`, `REVIEWER`, `TESTER`, `RESEARCHER`, `ARCHITECT`.
- `isReady`: `true` for cards whose dependencies are fully completed.
- `isBlocked`: `true` for cards blocked by unmet dependencies.
- `limit`: Maximum number of results.
}
```

## Task Commands

### List Tasks

Lists all tasks in a card.

**Command:**
```json
{
  "command": "list_tasks",
  "params": {
    "cardId": "card_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_id",
      "name": "Task Name",
      "completed": false,
      "position": 1,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    // More tasks...
  ]
}
```

### Create Task

Creates a new task in a card.

**Command:**
```json
{
  "command": "create_task",
  "params": {
    "cardId": "card_id",
    "name": "New Task Name",
    "completed": false, // Optional
    "position": 1 // Optional
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_task_id",
    "name": "New Task Name",
    "completed": false,
    "position": 1,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "cardId": "card_id"
  }
}
```

### Update Task

Updates an existing task.

**Command:**
```json
{
  "command": "update_task",
  "params": {
    "taskId": "task_id",
    "name": "Updated Task Name", // Optional
    "completed": true // Optional
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task_id",
    "name": "Updated Task Name",
    "completed": true,
    "position": 1,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "cardId": "card_id"
  }
}
```

### Delete Task

Deletes a task.

**Command:**
```json
{
  "command": "delete_task",
  "params": {
    "taskId": "task_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task_id"
  }
}
```

## Comment Commands

### List Comments

Lists all comments on a card.

**Command:**
```json
{
  "command": "list_comments",
  "params": {
    "cardId": "card_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment_id",
      "text": "Comment text",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "user": {
        "id": "user_id",
        "name": "User Name",
        "username": "username"
      }
    },
    // More comments...
  ]
}
```

### Create Comment

Creates a new comment on a card.

**Command:**
```json
{
  "command": "create_comment",
  "params": {
    "cardId": "card_id",
    "text": "New comment text"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_comment_id",
    "text": "New comment text",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "cardId": "card_id",
    "userId": "user_id"
  }
}
```

### Delete Comment

Deletes a comment.

**Command:**
```json
{
  "command": "delete_comment",
  "params": {
    "commentId": "comment_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "comment_id"
  }
}
```

## Error Handling

When an error occurs, the MCP server will return a response with `success: false` and an error message:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common error messages include:

- "Invalid credentials": The agent's email or password is incorrect
- "Access denied": The agent doesn't have permission to access the requested resource
- "Resource not found": The requested project, board, list, card, task, or comment doesn't exist
- "Invalid parameters": The command parameters are missing or invalid