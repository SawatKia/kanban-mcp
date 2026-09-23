import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { z } from "zod";

// Import Planka operations
import * as boardMemberships from "./operations/boardMemberships.js";
import * as boards from "./operations/boards.js";
import * as cards from "./operations/cards.js";
import * as comments from "./operations/comments.js";
import * as labels from "./operations/labels.js";
import * as lists from "./operations/lists.js";
import * as projects from "./operations/projects.js";
import * as tasks from "./operations/tasks.js";

// Import custom tools
import {
  createCardWithTasks,
  getBoardSummary,
  getCardDetails,
  batchCreateCards,
  listLabels,
  queryTasks,
} from "./tools/index.js";

import { VERSION } from "./common/version.js";

const server = new McpServer(
  {
    name: "planka-mcp-server",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ----- CONSOLIDATED KANBAN TOOLS -----

// 1. Project and Board Manager
server.tool(
  "mcp_kanban_project_board_manager",
  "Manage projects and boards with various operations (retrieve projects/boards, create, update, delete, or get board summary). Note: A board contains column lists of cards.",
  {
    action: z
      .enum([
        "get_projects",
        "get_project",
        "create_project",
        "delete_project",
        "get_boards",
        "create_board",
        "get_board",
        "update_board",
        "delete_board",
        "get_board_summary",
      ])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the project or board"),
    projectId: z.string().optional().describe("The ID of the project"),
    name: z.string().optional().describe("The name of the board"),
    position: z.number().optional().describe("The position of the board"),
    type: z.string().optional().describe("The type of the board"),
    page: z
      .number()
      .optional()
      .describe("The page number for pagination (1-indexed)"),
    perPage: z.number().optional().describe("The number of items per page"),
    boardId: z
      .string()
      .optional()
      .describe("The ID of the board to get a summary for"),
    includeTaskDetails: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Whether to include detailed task / checklist item information (sub-tasks with isCompleted status across all card task-lists) for each card"
      ),
    includeComments: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to include comments for each card"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_projects":
        if (!args.page || !args.perPage)
          throw new Error(
            "page and perPage are required for get_projects action"
          );
        result = await projects.getProjects(args.page, args.perPage);
        break;

      case "get_project":
        if (!args.id) throw new Error("id is required for get_project action");
        result = await projects.getProject(args.id);
        break;

      case "create_project":
        if (!args.name)
          throw new Error("name is required for create_project action");
        result = await projects.createProject(args.name);
        break;

      case "delete_project":
        if (!args.id)
          throw new Error("id is required for delete_project action");
        result = await projects.deleteProject(args.id);
        break;

      case "get_boards":
        if (!args.projectId)
          throw new Error("projectId is required for get_boards action");
        result = await boards.getBoards(args.projectId);
        break;

      case "create_board":
        if (!args.projectId || !args.name || args.position === undefined)
          throw new Error(
            "projectId, name, and position are required for create_board action"
          );
        result = await boards.createBoard({
          projectId: args.projectId,
          name: args.name,
          position: args.position,
        });
        break;

      case "get_board":
        if (!args.id) throw new Error("id is required for get_board action");
        result = await boards.getBoard(args.id);
        break;

      case "update_board":
        if (!args.id || !args.name || args.position === undefined)
          throw new Error(
            "id, name, and position are required for update_board action"
          );
        const boardUpdateOptions = {
          name: args.name,
          position: args.position,
        } as any; // Use type assertion to avoid TypeScript errors

        if (args.type) {
          boardUpdateOptions.type = args.type;
        }

        result = await boards.updateBoard(args.id, boardUpdateOptions);
        break;

      case "delete_board":
        if (!args.id) throw new Error("id is required for delete_board action");
        result = await boards.deleteBoard(args.id);
        break;

      case "get_board_summary":
        if (!args.boardId)
          throw new Error("boardId is required for get_board_summary action");
        result = await getBoardSummary({
          boardId: args.boardId,
          includeTaskDetails: args.includeTaskDetails,
          includeComments: args.includeComments,
        });
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 2. List Manager
server.tool(
  "mcp_kanban_list_manager",
  "Manage kanban board lists/columns (columns/lanes on a board such as 'Backlog', 'To Do', 'In Progress', 'Done'). IMPORTANT: This manages top-level board columns containing cards. This is NOT for card task-lists (checklists) or individual sub-tasks inside cards.",
  {
    action: z
      .enum(["get_all", "create", "update", "delete", "get_one"])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the board list (column/lane)"),
    boardId: z
      .string()
      .optional()
      .describe("The ID of the board containing the list (column/lane)"),
    name: z.string().optional().describe("The name of the board list (column/lane, e.g. 'To Do', 'In Progress')"),
    position: z
      .number()
      .optional()
      .describe("The position of the list (column/lane) on the board"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.boardId)
          throw new Error("boardId is required for get_all action");
        result = await lists.getLists(args.boardId);
        break;

      case "create":
        if (!args.boardId || !args.name || args.position === undefined)
          throw new Error(
            "boardId, name, and position are required for create action"
          );
        result = await lists.createList({
          boardId: args.boardId,
          name: args.name,
          position: args.position,
        });
        break;

      case "get_one":
        if (!args.id) throw new Error("id is required for get_one action");
        result = await lists.getList(args.id);
        break;

      case "update":
        if (!args.id || !args.name || args.position === undefined)
          throw new Error(
            "id, name, and position are required for update action"
          );
        const { id, ...updateOptions } = args;
        result = await lists.updateList(id, {
          name: args.name,
          position: args.position,
        });
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await lists.deleteList(args.id);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 3. Card Manager
server.tool(
  "mcp_kanban_card_manager",
  "Manage kanban cards (tickets/items inside board columns/lists). Supports creating, updating, moving, duplicating, deleting cards, and setting/updating card vertical position/order (lower numbers like 0, 65535 appear higher up at the top of the column, and higher numbers appear lower down at the bottom). Each card can contain its own checklist (task-list) with step-by-step tasks.",
  {
    action: z
      .enum([
        "get_all",
        "create",
        "get_one",
        "update",
        "move",
        "duplicate",
        "delete",
        "create_with_tasks",
        "get_details",
      ])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the card"),
    listId: z.string().optional().describe("The ID of the board list/column where the card is placed"),
    boardId: z
      .string()
      .optional()
      .describe("The ID of the board (if moving between boards)"),
    projectId: z
      .string()
      .optional()
      .describe("The ID of the project (if moving between projects)"),
    name: z.string().optional().describe("The name of the card"),
    description: z.string().optional().describe("The description of the card"),
    position: z
      .number()
      .optional()
      .describe(
        "The vertical position/sort order of the card within its list column (default: 65535). Lower/smaller numbers (e.g. 0, 1000, 65535) place the card HIGHER up (near the top of the column). Higher/larger numbers (e.g. 131070, 196605) place the card LOWER down (near the bottom of the column)."
      ),
    dueDate: z
      .string()
      .optional()
      .describe("The due date for the card (ISO format)"),
    isCompleted: z
      .boolean()
      .optional()
      .describe("Whether the card itself is marked as completed"),
    tasks: z
      .array(z.string())
      .optional()
      .describe(
        "Array of task (checklist step item) names to create inside the card's checklist for create_with_tasks action"
      ),
    comment: z
      .string()
      .optional()
      .describe("Optional comment to add to the card"),
    cardId: z
      .string()
      .optional()
      .describe("The ID of the card to get details for"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.listId)
          throw new Error("listId is required for get_all action");
        result = await cards.getCards(args.listId);
        break;

      case "create":
        if (!args.listId || !args.name)
          throw new Error("listId and name are required for create action");
        result = await cards.createCard({
          listId: args.listId,
          name: args.name,
          description: args.description || "",
          position: args.position !== undefined ? args.position : 65535,
        });
        if (args.comment && result?.id) {
          const addedComment = await comments.createComment({
            cardId: result.id,
            text: args.comment,
          });
          result = {
            ...result,
            comment: addedComment,
          };
        }
        break;

      case "get_one":
        if (!args.id) throw new Error("id is required for get_one action");
        result = await cards.getCard(args.id);
        break;

      case "update":
        if (!args.id) throw new Error("id is required for update action");
        const cardUpdateOptions = {} as any; // Use type assertion to avoid TypeScript errors

        if (args.name !== undefined) cardUpdateOptions.name = args.name;
        if (args.description !== undefined)
          cardUpdateOptions.description = args.description;
        if (args.position !== undefined)
          cardUpdateOptions.position = args.position;
        if (args.dueDate !== undefined)
          cardUpdateOptions.dueDate = args.dueDate;
        if (args.isCompleted !== undefined)
          cardUpdateOptions.isCompleted = args.isCompleted;

        result = await cards.updateCard(args.id, cardUpdateOptions);
        if (args.comment) {
          const addedComment = await comments.createComment({
            cardId: args.id,
            text: args.comment,
          });
          result = {
            ...result,
            comment: addedComment,
          };
        }
        break;

      case "move":
        if (!args.id || !args.listId || args.position === undefined)
          throw new Error(
            "id, listId, and position are required for move action"
          );
        result = await cards.moveCard(
          args.id,
          args.listId,
          args.position,
          args.boardId,
          args.projectId
        );
        break;

      case "duplicate":
        if (!args.id || args.position === undefined)
          throw new Error("id and position are required for duplicate action");
        result = await cards.duplicateCard(args.id, args.position);
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await cards.deleteCard(args.id);
        break;

      case "create_with_tasks":
        if (!args.listId || !args.name)
          throw new Error(
            "listId and name are required for create_with_tasks action"
          );
        result = await createCardWithTasks({
          listId: args.listId,
          name: args.name,
          description: args.description,
          tasks: args.tasks,
          comment: args.comment,
          position: args.position,
        });
        break;

      case "get_details":
        if (!args.cardId)
          throw new Error("cardId is required for get_details action");
        result = await getCardDetails({
          cardId: args.cardId,
        });
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 4. Stopwatch Manager
server.tool(
  "mcp_kanban_stopwatch",
  "Manage card stopwatches for time tracking",
  {
    action: z
      .enum(["start", "stop", "get", "reset"])
      .describe("The action to perform"),
    id: z.string().describe("The ID of the card"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "start":
        result = await cards.startCardStopwatch(args.id);
        break;

      case "stop":
        result = await cards.stopCardStopwatch(args.id);
        break;

      case "get":
        result = await cards.getCardStopwatch(args.id);
        break;

      case "reset":
        result = await cards.resetCardStopwatch(args.id);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 5. Label Manager
server.tool(
  "mcp_kanban_label_manager",
  "Manage kanban labels with various operations (create, update, delete, get_all, add_to_card, remove_from_card). Can add or remove single or multiple labels to/from a card at a time.",
  {
    action: z
      .enum([
        "get_all",
        "create",
        "update",
        "delete",
        "add_to_card",
        "remove_from_card",
      ])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the label"),
    boardId: z.string().optional().describe("The ID of the board"),
    cardId: z.string().optional().describe("The ID of the card"),
    labelId: z
      .string()
      .optional()
      .describe("The ID of the label (for card operations, single ID or comma-separated IDs)"),
    labelIds: z
      .array(z.string())
      .optional()
      .describe("Array of label IDs (for batch card label operations)"),
    name: z.string().optional().describe("The name of the label"),
    color: z
      .enum([
        "berry-red",
        "pumpkin-orange",
        "lagoon-blue",
        "pink-tulip",
        "light-mud",
        "orange-peel",
        "bright-moss",
        "antique-blue",
        "dark-granite",
        "lagune-blue",
        "sunny-grass",
        "morning-sky",
        "light-orange",
        "midnight-blue",
        "tank-green",
        "gun-metal",
        "wet-moss",
        "red-burgundy",
        "light-concrete",
        "apricot-red",
        "desert-sand",
        "navy-blue",
        "egg-yellow",
        "coral-green",
        "light-cocoa",
      ])
      .optional()
      .describe("The color of the label"),
    position: z.number().optional().describe("The position of the label"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.boardId)
          throw new Error("boardId is required for get_all action");
        result = await labels.getLabels(args.boardId);
        break;

      case "create":
        if (
          !args.boardId ||
          !args.name ||
          !args.color ||
          args.position === undefined
        )
          throw new Error(
            "boardId, name, color, and position are required for create action"
          );
        result = await labels.createLabel({
          boardId: args.boardId,
          name: args.name,
          color: args.color,
          position: args.position,
        });
        break;

      case "update":
        if (
          !args.id ||
          !args.name ||
          !args.color ||
          args.position === undefined
        )
          throw new Error(
            "id, name, color, and position are required for update action"
          );
        result = await labels.updateLabel(args.id, {
          name: args.name,
          color: args.color,
          position: args.position,
        });
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await labels.deleteLabel(args.id);
        break;

      case "add_to_card": {
        if (!args.cardId || (!args.labelId && (!args.labelIds || args.labelIds.length === 0)))
          throw new Error(
            "cardId and at least one labelId or labelIds are required for add_to_card action"
          );

        const targetLabelIds: string[] = [];
        if (args.labelIds && Array.isArray(args.labelIds)) {
          targetLabelIds.push(...args.labelIds.map((id) => id.trim()).filter(Boolean));
        }
        if (args.labelId) {
          args.labelId
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
            .forEach((id) => {
              if (!targetLabelIds.includes(id)) {
                targetLabelIds.push(id);
              }
            });
        }

        if (targetLabelIds.length === 1) {
          result = await labels.addLabelToCard(args.cardId, targetLabelIds[0]);
        } else {
          result = await labels.addLabelsToCard(args.cardId, targetLabelIds);
        }
        break;
      }

      case "remove_from_card": {
        if (!args.cardId || (!args.labelId && (!args.labelIds || args.labelIds.length === 0)))
          throw new Error(
            "cardId and at least one labelId or labelIds are required for remove_from_card action"
          );

        const removeLabelIds: string[] = [];
        if (args.labelIds && Array.isArray(args.labelIds)) {
          removeLabelIds.push(...args.labelIds.map((id) => id.trim()).filter(Boolean));
        }
        if (args.labelId) {
          args.labelId
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
            .forEach((id) => {
              if (!removeLabelIds.includes(id)) {
                removeLabelIds.push(id);
              }
            });
        }

        if (removeLabelIds.length === 1) {
          result = await labels.removeLabelFromCard(args.cardId, removeLabelIds[0]);
        } else {
          result = await labels.removeLabelsFromCard(args.cardId, removeLabelIds);
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 6. Task Manager (Checklist / Sub-task Item Manager)
server.tool(
  "mcp_kanban_task_manager",
  "Manage step-by-step tasks (actionable checklist items with isCompleted boolean status) inside a card's checklist (task-list). Hierarchy: Board -> Board Column (List) -> Card -> Checklist (Task-List #1, #2...) -> Tasks (Individual checklist step items). A single card can contain multiple checklists, and each checklist contains multiple step tasks.",
  {
    action: z
      .enum([
        "get_all",
        "create",
        "batch_create",
        "get_one",
        "update",
        "delete",
        "complete_task",
        "sync_referenced_card",
        "get_checklists",
        "create_checklist",
        "delete_checklist",
      ])
      .describe("The action to perform: get_all (list tasks on card), create (add a task to card's checklist), batch_create (add multiple tasks), get_one (get task by ID), update (update task name/position/isCompleted), delete (delete task), complete_task (mark task isCompleted: true), sync_referenced_card (mark tasks referencing completed card as done), get_checklists (list all checklists on card), create_checklist (add new checklist to card), delete_checklist (delete a checklist)"),
    id: z
      .string()
      .optional()
      .describe("The ID of the individual task (or checklist ID when deleting a checklist)"),
    cardId: z
      .string()
      .optional()
      .describe(
        "The ID of the card containing the checklist and tasks (or completed card ID when using sync_referenced_card)"
      ),
    taskListId: z
      .string()
      .optional()
      .describe("The ID of the specific checklist (task-list) containing the tasks"),
    checklistName: z
      .string()
      .optional()
      .describe("The name of the checklist to add the task to or create (e.g. 'Checklist', 'Implementation Steps')"),
    boardId: z
      .string()
      .optional()
      .describe(
        "The ID of the board (used with sync_referenced_card to search for referencing tasks across all cards)"
      ),
    name: z
      .string()
      .optional()
      .describe("The name/title of the individual task (or checklist name when creating a checklist)"),
    isCompleted: z
      .boolean()
      .optional()
      .describe("Whether the task (checklist step item) is completed (true) or pending (false)"),
    position: z
      .number()
      .optional()
      .describe("The vertical sort position of the task within its checklist (default: 65535). Lower numbers = higher up / top, higher numbers = lower down / bottom."),
    tasks: z
      .array(
        z.object({
          cardId: z
            .string()
            .optional()
            .describe("The ID of the card for this task"),
          taskListId: z
            .string()
            .optional()
            .describe("The ID of the checklist for this task"),
          checklistName: z
            .string()
            .optional()
            .describe("The name of the checklist (default: 'Checklist')"),
          name: z
            .string()
            .describe("The name of this task (checklist step item)"),
          position: z
            .number()
            .optional()
            .describe("The vertical sort position of this task within the checklist"),
          isCompleted: z
            .boolean()
            .optional()
            .describe("Whether the task is completed (true) or pending (false)"),
        })
      )
      .optional()
      .describe("Array of tasks (checklist step items) to create in batch for a card"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.cardId)
          throw new Error("cardId is required for get_all action");
        result = await tasks.getTasks(args.cardId);
        break;

      case "create":
        if ((!args.cardId && !args.taskListId) || !args.name)
          throw new Error("cardId (or taskListId) and name are required for create action");
        result = await tasks.createTask({
          cardId: args.cardId,
          taskListId: args.taskListId,
          checklistName: args.checklistName,
          name: args.name,
          position: args.position,
          isCompleted: args.isCompleted,
        });
        break;

      case "batch_create":
        if (!args.tasks || args.tasks.length === 0)
          throw new Error("tasks array is required for batch_create action");
        result = await tasks.batchCreateTasks({ tasks: args.tasks });
        break;

      case "get_one":
        if (!args.id) throw new Error("id is required for get_one action");
        result = await tasks.getTask(args.id, args.cardId);
        break;

      case "update":
        if (!args.id) throw new Error("id is required for update action");
        const taskUpdateOptions = {} as any;

        if (args.name !== undefined) taskUpdateOptions.name = args.name;
        if (args.position !== undefined)
          taskUpdateOptions.position = args.position;
        if (args.isCompleted !== undefined)
          taskUpdateOptions.isCompleted = args.isCompleted;

        result = await tasks.updateTask(args.id, taskUpdateOptions);
        break;

      case "complete_task":
        if (!args.id)
          throw new Error("id is required for complete_task action");
        result = await tasks.updateTask(args.id, { isCompleted: true } as any);
        break;

      case "sync_referenced_card":
        if (!args.cardId)
          throw new Error(
            "cardId (the completed card ID) is required for sync_referenced_card action"
          );
        result = await tasks.syncReferencedTasksOnCardDone(
          args.cardId,
          args.boardId
        );
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await tasks.deleteTask(args.id);
        break;

      case "get_checklists":
        if (!args.cardId)
          throw new Error("cardId is required for get_checklists action");
        result = await tasks.getChecklists(args.cardId);
        break;

      case "create_checklist":
        if (!args.cardId || !args.name)
          throw new Error("cardId and name are required for create_checklist action");
        result = await tasks.createChecklist({
          cardId: args.cardId,
          name: args.name,
          position: args.position,
        });
        break;

      case "delete_checklist":
        if (!args.id)
          throw new Error("id (checklist ID) is required for delete_checklist action");
        result = await tasks.deleteChecklist(args.id);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 7. Comment Manager
server.tool(
  "mcp_kanban_comment_manager",
  "Manage card comments with various operations",
  {
    action: z
      .enum(["get_all", "create", "get_one", "update", "delete"])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the comment"),
    cardId: z.string().optional().describe("The ID of the card"),
    text: z.string().optional().describe("The text content of the comment"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.cardId)
          throw new Error("cardId is required for get_all action");
        result = await comments.getComments(args.cardId);
        break;

      case "create":
        if (!args.cardId || !args.text)
          throw new Error("cardId and text are required for create action");
        result = await comments.createComment({
          cardId: args.cardId,
          text: args.text,
        });
        break;

      case "get_one":
        if (!args.id) throw new Error("id is required for get_one action");
        result = await comments.getComment(args.id, args.cardId);
        break;

      case "update":
        if (!args.id || !args.text)
          throw new Error("id and text are required for update action");
        result = await comments.updateComment(args.id, {
          text: args.text,
        });
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await comments.deleteComment(args.id);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 8. Membership Manager
server.tool(
  "mcp_kanban_membership_manager",
  "Manage board memberships with various operations",
  {
    action: z
      .enum(["get_all", "create", "get_one", "update", "delete"])
      .describe("The action to perform"),
    id: z.string().optional().describe("The ID of the membership"),
    boardId: z.string().optional().describe("The ID of the board"),
    userId: z.string().optional().describe("The ID of the user"),
    role: z
      .enum(["editor", "viewer"])
      .optional()
      .describe("The role of the user in the board"),
    canComment: z
      .boolean()
      .optional()
      .describe("Whether the user can comment on the board"),
  },
  async (args) => {
    let result;

    switch (args.action) {
      case "get_all":
        if (!args.boardId)
          throw new Error("boardId is required for get_all action");
        result = await boardMemberships.getBoardMemberships(args.boardId);
        break;

      case "create":
        if (!args.boardId || !args.userId || !args.role)
          throw new Error(
            "boardId, userId, and role are required for create action"
          );
        result = await boardMemberships.createBoardMembership({
          boardId: args.boardId,
          userId: args.userId,
          role: args.role,
        });
        break;

      case "get_one":
        if (!args.id) throw new Error("id is required for get_one action");
        result = await boardMemberships.getBoardMembership(args.id);
        break;

      case "update":
        if (!args.id) throw new Error("id is required for update action");
        const membershipUpdateOptions = {} as any;

        if (args.role !== undefined) membershipUpdateOptions.role = args.role;
        if (args.canComment !== undefined)
          membershipUpdateOptions.canComment = args.canComment;

        result = await boardMemberships.updateBoardMembership(
          args.id,
          membershipUpdateOptions
        );
        break;

      case "delete":
        if (!args.id) throw new Error("id is required for delete action");
        result = await boardMemberships.deleteBoardMembership(args.id);
        break;

      default:
        throw new Error(`Unknown action: ${args.action}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 9. Batch Card Creator
server.tool(
  "mcp_kanban_batch_cards",
  "Create multiple cards at once from a single JSON payload. Each card can include a description, vertical position, step-by-step checklist tasks (plain strings or {name, isCompleted} objects: task ∈ checklist ∈ card), labels (auto-created on the board if missing), and an optional comment — all in one call.",
  {
    boardId: z
      .string()
      .describe("The ID of the board (required to resolve/create labels)"),
    listId: z
      .string()
      .optional()
      .describe("Default list ID for all cards (each card may override)"),
    cards: z
      .array(
        z.object({
          name: z.string().describe("Card name"),
          listId: z
            .string()
            .optional()
            .describe("Per-card list override"),
          description: z.string().optional().describe("Card description"),
          checklistName: z
            .string()
            .optional()
            .describe("Optional custom name for the checklist on the card (default: 'Checklist')"),
          checklist: z
            .array(
              z.union([
                z.string(),
                z.object({
                  name: z.string(),
                  isCompleted: z.boolean().optional(),
                }),
              ])
            )
            .optional()
            .describe(
              "Step-by-step tasks / checklist items for the card (alias for 'tasks')"
            ),
          tasks: z
            .array(
              z.union([
                z.string(),
                z.object({
                  name: z.string(),
                  isCompleted: z.boolean().optional(),
                }),
              ])
            )
            .optional()
            .describe(
              "Step-by-step tasks / checklist items inside the card's checklist (task ∈ checklist ∈ card)"
            ),
          labels: z
            .array(
              z.object({
                name: z.string().optional(),
                labelId: z.string().optional(),
                color: z
                  .enum([
                    "berry-red",
                    "pumpkin-orange",
                    "lagoon-blue",
                    "pink-tulip",
                    "light-mud",
                    "orange-peel",
                    "bright-moss",
                    "antique-blue",
                    "dark-granite",
                    "lagune-blue",
                    "sunny-grass",
                    "morning-sky",
                    "light-orange",
                    "midnight-blue",
                    "tank-green",
                    "gun-metal",
                    "wet-moss",
                    "red-burgundy",
                    "light-concrete",
                    "apricot-red",
                    "desert-sand",
                    "navy-blue",
                    "egg-yellow",
                    "coral-green",
                    "light-cocoa",
                  ])
                  .optional()
                  .describe(
                    "Color used only when creating a label that does not exist yet"
                  ),
              })
            )
            .optional()
            .describe("Labels to attach; missing ones are created by name"),
          comment: z.string().optional().describe("Optional comment"),
          position: z
            .number()
            .optional()
            .describe(
              "Optional vertical sort position for the card in the list column (default: 65535). Lower numbers = higher up / top, higher numbers = lower down / bottom."
            ),
        })
      )
      .min(1)
      .max(50)
      .describe("The cards to create, in order"),
  },
  async (args) => {
    const result = await batchCreateCards(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

// 10. Label Discovery (scheduler_list_labels / mcp_kanban_list_labels)
const listLabelsToolConfig = {
  name: "scheduler_list_labels",
  description:
    "List all existing labels across all cards in the board(s) with card counts and state breakdowns (e.g. TODO, IN_PROGRESS, DONE).",
  parameters: {
    boardId: z
      .string()
      .optional()
      .describe(
        "Optional board ID to scope label discovery (searches all boards if omitted)"
      ),
  },
  handler: async (args: any) => {
    const result = await listLabels(args);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
    };
  },
};

server.tool(
  listLabelsToolConfig.name,
  listLabelsToolConfig.description,
  listLabelsToolConfig.parameters,
  listLabelsToolConfig.handler
);

server.tool(
  "mcp_kanban_list_labels",
  listLabelsToolConfig.description,
  listLabelsToolConfig.parameters,
  listLabelsToolConfig.handler
);

// 11. Card/Task Query & Search (scheduler_query_tasks / mcp_kanban_query_tasks)
const queryTasksToolConfig = {
  name: "scheduler_query_tasks",
  description:
    "Search and filter cards (and their checklist tasks/sub-tasks) across the Kanban board by criteria: cardId/taskId substring, labels (with matchMode any/all), keyword text in title/objective/description/allowed files, state (e.g. TODO, IN_PROGRESS, WAITING_REVIEW, WAITING_TEST, DONE), assignedPosition role, isReady, or isBlocked.",
  parameters: {
    boardId: z
      .string()
      .optional()
      .describe("Board ID to scope the query (searches all boards if omitted)"),
    taskId: z
      .string()
      .optional()
      .describe("Filter by specific Card ID, Checklist Task ID, or substring match"),
    labels: z
      .array(z.string())
      .optional()
      .describe("Filter by labels (e.g. ['backend', 'auth'])"),
    labelMatchMode: z
      .enum(["any", "all"])
      .optional()
      .default("any")
      .describe("Match 'any' (OR) or 'all' (AND) specified labels"),
    text: z
      .string()
      .optional()
      .describe(
        "Search keyword across Title/Name, Objective/Description, Expected Output, Allowed Files, or Checklist Task names"
      ),
    state: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .describe(
        "Filter by state: TODO, IN_PROGRESS, WAITING_REVIEW, WAITING_TEST, DONE, BLOCKED, NEEDS_CLARIFICATION, FAILED"
      ),
    assignedPosition: z
      .enum([
        "PLANNER",
        "CODER",
        "REVIEWER",
        "TESTER",
        "RESEARCHER",
        "ARCHITECT",
      ])
      .optional()
      .describe(
        "Filter by assigned agent role (PLANNER, CODER, REVIEWER, TESTER, RESEARCHER, ARCHITECT)"
      ),
    isReady: z
      .boolean()
      .optional()
      .describe(
        "true = Only tasks/cards whose dependencies are fully DONE and ready to be worked on"
      ),
    isBlocked: z
      .boolean()
      .optional()
      .describe("true = Only tasks/cards blocked by unmet dependencies"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of results to return"),
  },
  handler: async (args: any) => {
    const result = await queryTasks(args);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
    };
  },
};

server.tool(
  queryTasksToolConfig.name,
  queryTasksToolConfig.description,
  queryTasksToolConfig.parameters,
  queryTasksToolConfig.handler
);

server.tool(
  "mcp_kanban_query_tasks",
  queryTasksToolConfig.description,
  queryTasksToolConfig.parameters,
  queryTasksToolConfig.handler
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((err) => {
  console.error("Error running server:", err);
  process.exit(1);
});
