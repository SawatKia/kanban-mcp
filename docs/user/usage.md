# ðŸ“ Usage Guide

This guide explains how to use the Kanban MCP tools with Claude in Cursor to manage your Planka kanban board.

## ðŸ› ï¸ Available MCP Tools

Kanban MCP provides 11 consolidated MCP tools:

1. **`mcp_kanban_project_board_manager`**: Manage projects and boards (CRUD, summaries).
2. **`mcp_kanban_list_manager`**: Manage board columns/lanes (`Backlog`, `To Do`, `In Progress`, `Done`).
3. **`mcp_kanban_card_manager`**: Manage cards, reorder vertical positions (`position`), move, duplicate, and delete cards.
4. **`mcp_kanban_stopwatch`**: Track time spent on cards with start/stop/get/reset.
5. **`mcp_kanban_label_manager`**: Manage board labels and attach/detach from cards (batch label support).
6. **`mcp_kanban_task_manager`**: Manage card checklists and individual step-by-step checklist tasks.
7. **`mcp_kanban_comment_manager`**: Add, update, and manage discussion comments on cards.
8. **`mcp_kanban_membership_manager`**: Manage board access and user roles (`editor` or `viewer`).
9. **`mcp_kanban_batch_cards`**: Bulk create cards with descriptions, checklists, labels, positions, and comments in one call.
10. **`scheduler_list_labels` / `mcp_kanban_list_labels`**: Discover all board labels with state counts (`TODO`, `IN_PROGRESS`, `DONE`).
11. **`scheduler_query_tasks` / `mcp_kanban_query_tasks`**: Query and filter cards and checklist tasks by labels, keywords, role, state, and dependency readiness.

---

## â†•ï¸ Position Management

When setting card order or reordering cards in a column list:
- **Smaller numbers** (e.g. `0`, `65535`): Place the card **higher up (at the top)**.
- **Larger numbers** (e.g. `131070`, `196605`): Place the card **lower down (towards the bottom)**.

---

## ðŸ¤” Using Kanban MCP with AI Assistants

Once you've set up Kanban MCP, your AI assistant can use the MCP tools directly:

### ðŸ’¡ Example Interactions

#### 1. Creating and Positioning Cards
```
User: Create a high priority card "Fix auth redirect bug" at the very top of "To Do" list
Assistant: [Calls mcp_kanban_card_manager with position: 0]
```

#### 2. Creating Multiple Cards with Checklists in Batch
```
User: Create 3 frontend cards for the Sprint 2 board in "To Do" list with checklist steps
Assistant: [Calls mcp_kanban_batch_cards with cards array, each having tasks/checklist step items]
```

#### 3. Managing Step Tasks in Card Checklists
```
User: Add steps to card 1850123: "1. Write schema", "2. Run migrations", "3. Verify endpoints"
Assistant: [Calls mcp_kanban_task_manager with action: "batch_create"]
```

#### 4. Querying Tasks by State and Role
```
User: What tasks are currently assigned to CODER role and ready to work on?
Assistant: [Calls scheduler_query_tasks with assignedPosition: "CODER", isReady: true]
```

### ðŸ’¯ Tips for Effective Use

1. **Be specific with your requests**:
   - Include the project, board, and list names when referring to cards
   - Use the exact names of cards, lists, and boards

2. **Use natural language**:
   - You don't need to use specific command syntax
   - Claude will interpret your intent and use the appropriate MCP commands

3. **Chain related actions**:
   - You can ask Claude to perform multiple related actions in a single request
   - Example: "Create a new card called 'Fix bugs' in the 'To Do' list and add three tasks: fix login bug, fix navigation bug, and fix form validation bug"

4. **Track your time**:
   - Use the time tracking features to monitor how long you spend on tasks
   - Ask Claude to start/stop timers as you work on different cards

5. **Ask for help**:
   - If you're unsure about what commands are available, ask Claude for help
   - Example: "What kanban commands can you use?" or "How do I create a new card?"

## ðŸš€ Advanced Usage

### ðŸ“† Using Kanban MCP for Project Management

The Kanban MCP tools can be integrated into your development workflow:

1. **Sprint Planning**:
   - Create a new board for each sprint
   - Set up lists for "To Do", "In Progress", "Review", and "Done"
   - Create cards for all planned tasks with detailed descriptions
   - Use time tracking to estimate and monitor task duration

2. **Daily Stand-ups**:
   - Ask Claude to show you all cards in the "In Progress" list
   - Move cards between lists as work progresses
   - Add comments to cards to document progress or blockers
   - Check time spent on tasks to identify bottlenecks

3. **Code Reviews**:
   - Create a dedicated list for "Ready for Review"
   - Move cards there when code is ready to be reviewed
   - Add comments with review feedback
   - Use labels to categorize review status (approved, changes requested, etc.)

4. **Retrospectives**:
   - Review completed cards in the "Done" list
   - Analyze how long cards spent in each list
   - Use time tracking data to identify areas for improvement
   - Create new cards for action items from the retrospective

### ðŸ’» Integrating with Development Tasks

Claude can help you manage your development tasks using the Kanban MCP:

1. **Task Breakdown**:
   - Ask Claude to help break down a complex feature into smaller tasks
   - Create cards for each task with appropriate descriptions
   - Use the "Create Multiple Tasks" feature to quickly add task lists

2. **Progress Tracking**:
   - Ask Claude to summarize the current state of your board
   - Get insights into what's completed and what's still pending
   - Use time tracking to monitor how long tasks are taking

3. **Documentation**:
   - Use card descriptions and comments to document implementation details
   - Ask Claude to summarize this documentation when needed
   - Duplicate cards with documentation to create templates for similar tasks

### â±ï¸ Time Management Features

Kanban MCP includes powerful time tracking capabilities:

1. **Card Stopwatches**:
   - Start a stopwatch when you begin working on a card
   - Pause the stopwatch when you take breaks or switch tasks
   - Track total time spent on individual cards
   - Reset stopwatches at the beginning of new work sessions

2. **Time Analysis**:
   - Compare estimated vs. actual time spent
   - Identify which tasks are taking longer than expected
   - Use time data to improve future estimates
   - Track productivity over time

3. **Example Workflows**:
   ```
   You: Start timer for "Implement user authentication"
   Claude: [Starts stopwatch]

   ... work on the task ...

   You: Pause timer for "Implement user authentication"
   Claude: [Stops stopwatch and shows elapsed time]

   You: How much time have I spent on "Implement user authentication"?
   Claude: [Shows total tracked time]
   ```

## âš ï¸ Troubleshooting

If you encounter issues while using the Kanban MCP with Claude:

1. **Check the connection**:
   - Ensure the MCP server is running
   - Verify that Claude can connect to the MCP server

2. **Verify permissions**:
   - Make sure the agent user has access to the projects you're trying to manage

3. **Be specific**:
   - If Claude is having trouble understanding your request, try being more specific
   - Include full names and IDs when referring to projects, boards, lists, or cards

For more detailed troubleshooting, see the [Troubleshooting](Troubleshooting) page.
