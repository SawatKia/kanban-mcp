/**
 * @fileoverview Task operations for the MCP Kanban server
 *
 * This module provides functions for interacting with checklists (task-lists) and individual tasks (step-by-step checklist items)
 * in the Planka Kanban board.
 * Hierarchy: Board -> Board Column (List) -> Card -> Checklist (Task-List #1, #2...) -> Tasks (Individual checklist step items).
 * A card can contain multiple checklists (task-lists), and each checklist contains multiple tasks/sub-tasks.
 * Each task has an isCompleted boolean flag indicating whether it is done or pending.
 */

import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { PlankaTaskSchema, PlankaTaskListSchema } from "../common/types.js";

/**
 * Schema for creating a new checklist (task-list) for a card
 * @property {string} cardId - The ID of the card to create the checklist in
 * @property {string} name - The name of the checklist (default: "Checklist")
 * @property {number} [position] - The position of the checklist (default: 65535)
 */
export const CreateChecklistSchema = z.object({
    cardId: z.string().describe("Card ID to create the checklist in"),
    name: z.string().describe("Checklist name (e.g. 'Checklist', 'Requirements', 'Deployment Steps')"),
    position: z.number().optional().describe("Checklist position (default: 65535)"),
});

/**
 * Schema for creating a new task (individual checklist step item)
 * @property {string} [cardId] - The ID of the card containing the checklist
 * @property {string} [taskListId] - The ID of the checklist (task-list) to create the task in
 * @property {string} [checklistName] - Optional checklist name to add the task to (defaults to "Checklist" or existing checklist)
 * @property {string} name - The name of the task (individual step / checklist item)
 * @property {number} [position] - The position of the task in the checklist (default: 65535)
 * @property {boolean} [isCompleted] - Whether the task is marked completed
 */
export const CreateTaskSchema = z.object({
    cardId: z.string().optional().describe("Card ID containing the checklist"),
    taskListId: z.string().optional().describe("Checklist (Task-List) ID to create the task in"),
    checklistName: z.string().optional().describe("Checklist name to add task to (default: 'Checklist')"),
    name: z.string().describe("Task name (individual step / checklist item: task ∈ checklist ∈ card)"),
    position: z.number().optional().describe("Task vertical position within checklist (default: 65535)"),
    isCompleted: z.boolean().optional().describe("Whether the task is completed (true) or pending (false)"),
});

/**
 * Schema for batch creating multiple tasks
 * @property {Array<CreateTaskSchema>} tasks - Array of tasks to create
 */
export const BatchCreateTasksSchema = z.object({
    tasks: z.array(CreateTaskSchema).describe("Array of tasks (checklist / step items) to create"),
});

/**
 * Schema for retrieving tasks from a card
 * @property {string} cardId - The ID of the card to get tasks from
 */
export const GetTasksSchema = z.object({
    cardId: z.string().describe("Card ID containing checklists and tasks"),
});

/**
 * Schema for retrieving a specific task
 * @property {string} id - The ID of the task to retrieve
 * @property {string} [cardId] - The ID of the card containing the task
 */
export const GetTaskSchema = z.object({
    id: z.string().describe("Task ID (individual checklist / step item ID)"),
    cardId: z.string().optional().describe("Card ID containing the task"),
});

/**
 * Schema for updating a task
 * @property {string} id - The ID of the task to update
 * @property {string} [name] - The new name for the task
 * @property {boolean} [isCompleted] - Whether the task is completed (true) or pending (false)
 * @property {number} [position] - The new position for the task
 */
export const UpdateTaskSchema = z.object({
    id: z.string().describe("Task ID (individual checklist / step item ID)"),
    name: z.string().optional().describe("Task name (individual checklist / step item name)"),
    isCompleted: z.boolean().optional().describe(
        "Whether the task (checklist / step item) is completed (true) or pending (false)",
    ),
    position: z.number().optional().describe("Task vertical position within checklist"),
});

/**
 * Schema for deleting a task
 * @property {string} id - The ID of the task to delete
 */
export const DeleteTaskSchema = z.object({
    id: z.string().describe("Task ID (individual checklist / step item ID)"),
});

// Type exports
export type CreateChecklistOptions = z.infer<typeof CreateChecklistSchema>;
export type CreateTaskOptions = z.infer<typeof CreateTaskSchema>;
export type BatchCreateTasksOptions = z.infer<typeof BatchCreateTasksSchema>;
export type UpdateTaskOptions = z.infer<typeof UpdateTaskSchema>;

// Response schemas
const TasksResponseSchema = z.object({
    items: z.array(PlankaTaskSchema),
    included: z.record(z.any()).optional(),
});

const TaskResponseSchema = z.object({
    item: PlankaTaskSchema,
    included: z.record(z.any()).optional(),
});

const TaskListResponseSchema = z.object({
    item: PlankaTaskListSchema,
    included: z.record(z.any()).optional(),
});

// Map to store task ID to card ID mapping
const taskCardIdMap: Record<string, string> = {};

/**
 * Retrieves all checklists (task-lists) for a specific card
 *
 * @param {string} cardId - The ID of the card
 * @returns {Promise<Array<object>>} Array of checklists on the card
 */
export async function getChecklists(cardId: string) {
    try {
        const response = await plankaRequest(`/api/cards/${cardId}`) as {
            item: any;
            included?: {
                taskLists?: any[];
            };
        };
        return response?.included?.taskLists || [];
    } catch (error) {
        console.error(`Error getting checklists for card ${cardId}:`, error);
        return [];
    }
}

/**
 * Creates a new checklist (task-list) for a card
 *
 * @param {CreateChecklistOptions} params - Checklist parameters
 * @returns {Promise<object>} The created checklist
 */
export async function createChecklist(params: CreateChecklistOptions) {
    const { cardId, name, position = 65535 } = params;
    const response = await plankaRequest(`/api/cards/${cardId}/task-lists`, {
        method: "POST",
        body: { name, position },
    });
    const parsedResponse = TaskListResponseSchema.parse(response);
    return parsedResponse.item;
}

/**
 * Deletes a checklist (task-list) by ID
 *
 * @param {string} id - The ID of the checklist to delete
 * @returns {Promise<{success: boolean}>} Success indicator
 */
export async function deleteChecklist(id: string) {
    await plankaRequest(`/api/task-lists/${id}`, {
        method: "DELETE",
    });
    return { success: true };
}

/**
 * Finds an existing checklist on a card or creates a new one
 *
 * @param {string} cardId - The ID of the card
 * @param {string} [name="Checklist"] - The desired checklist name
 * @returns {Promise<string>} The ID of the checklist (taskListId)
 */
export async function getOrCreateChecklist(cardId: string, name: string = "Checklist"): Promise<string> {
    try {
        const response = await plankaRequest(`/api/cards/${cardId}`) as {
            item: any;
            included?: {
                taskLists?: any[];
            };
        };

        const taskLists = response?.included?.taskLists || [];
        if (taskLists.length > 0) {
            const matching = taskLists.find(
                (tl: any) => tl.name && tl.name.toLowerCase() === name.toLowerCase()
            );
            if (matching) {
                return matching.id;
            }
            return taskLists[0].id;
        }

        const createRes: any = await plankaRequest(`/api/cards/${cardId}/task-lists`, {
            method: "POST",
            body: { name, position: 65535 },
        });
        return createRes.item.id;
    } catch (error) {
        throw new Error(
            `Failed to get or create checklist for card ${cardId}: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Creates a new task (individual step item) inside a card's checklist
 *
 * @param {CreateTaskOptions} params - Task creation parameters
 * @returns {Promise<object>} The created task
 */
export async function createTask(params: CreateTaskOptions) {
    try {
        const { cardId, checklistName, name, position = 65535, isCompleted } = params;
        let taskListId = params.taskListId;

        if (!taskListId) {
            if (!cardId) {
                throw new Error("Either cardId or taskListId is required to create a task");
            }
            taskListId = await getOrCreateChecklist(cardId, checklistName || "Checklist");
        }

        const response: any = await plankaRequest(
            `/api/task-lists/${taskListId}/tasks`,
            {
                method: "POST",
                body: { name, position },
            },
        );

        let task = response.item;

        if (task && task.id) {
            if (cardId) {
                taskCardIdMap[task.id] = cardId;
                task.cardId = cardId;
            }
            if (isCompleted) {
                const updated = await updateTask(task.id, { isCompleted: true });
                task = { ...task, ...updated };
            }
        }

        return task;
    } catch (error) {
        console.error("Error creating task:", error);
        throw new Error(
            `Failed to create task: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Creates multiple tasks for cards in a single operation
 *
 * @param {BatchCreateTasksOptions} options - The batch create tasks options
 * @returns {Promise<{results: any[], successes: any[], failures: TaskError[]}>} The results of the batch operation
 */
export async function batchCreateTasks(options: BatchCreateTasksOptions) {
    try {
        const results: Array<any> = [];
        const successes: Array<any> = [];
        const failures: Array<any> = [];

        interface TaskError {
            index: number;
            task: CreateTaskOptions;
            error: string;
        }

        for (let i = 0; i < options.tasks.length; i++) {
            const task = options.tasks[i];
            if (task.position === undefined) {
                task.position = 65535 * (i + 1);
            }

            try {
                const result = await createTask(task);
                results.push({
                    success: true,
                    result,
                });
                successes.push(result);
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : String(error);
                results.push({
                    success: false,
                    error: { message: errorMessage },
                });
                failures.push({
                    index: i,
                    task,
                    error: errorMessage,
                });
            }
        }

        return {
            results,
            successes,
            failures,
        };
    } catch (error) {
        throw new Error(
            `Failed to batch create tasks: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Retrieves all tasks for a specific card across all its checklists
 *
 * @param {string} cardId - The ID of the card to get tasks from
 * @returns {Promise<Array<object>>} Array of tasks in the card
 */
export async function getTasks(cardId: string) {
    try {
        const response = await plankaRequest(`/api/cards/${cardId}`) as {
            item: any;
            included?: {
                taskLists?: any[];
                tasks?: any[];
            };
        };

        const taskLists = response?.included?.taskLists || [];
        const taskListIdSet = new Set(taskLists.map((tl: any) => tl.id));
        const tasks = (response?.included?.tasks || [])
            .filter((t: any) => taskListIdSet.has(t.taskListId) || t.cardId === cardId)
            .map((t: any) => {
                taskCardIdMap[t.id] = cardId;
                return {
                    ...t,
                    cardId,
                };
            });

        return tasks;
    } catch (error) {
        console.error(`Error getting tasks for card ${cardId}:`, error);
        return [];
    }
}

/**
 * Retrieves a specific task by ID
 *
 * @param {string} id - The ID of the task to retrieve
 * @param {string} [cardId] - Optional card ID to help find the task
 * @returns {Promise<object>} The requested task
 */
export async function getTask(id: string, cardId?: string) {
    try {
        const taskCardId = cardId || taskCardIdMap[id];

        if (taskCardId) {
            const cardTasks = await getTasks(taskCardId);
            const found = cardTasks.find((task: any) => task.id === id);
            if (found) {
                return found;
            }
        }

        try {
            const response = await plankaRequest(`/api/tasks/${id}`) as any;
            if (response && response.item) {
                return response.item;
            }
        } catch {
            // Direct endpoint not available or item not found directly
        }

        throw new Error(
            `Task with ID ${id} not found${taskCardId ? ` in card ${taskCardId}` : ". Card ID is required to locate the task."}`,
        );
    } catch (error) {
        console.error(`Error getting task with ID ${id}:`, error);
        throw new Error(
            `Failed to get task: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Updates a task's properties
 *
 * @param {string} id - The ID of the task to update
 * @param {Partial<Omit<CreateTaskOptions, "cardId">>} options - The properties to update
 * @returns {Promise<object>} The updated task
 */
export async function updateTask(
    id: string,
    options: Partial<Omit<CreateTaskOptions, "cardId">>,
) {
    const response = await plankaRequest(`/api/tasks/${id}`, {
        method: "PATCH",
        body: options,
    });
    const parsedResponse = TaskResponseSchema.parse(response);
    return parsedResponse.item;
}

/**
 * Deletes a task by ID
 *
 * @param {string} id - The ID of the task to delete
 * @returns {Promise<{success: boolean}>} Success indicator
 */
export async function deleteTask(id: string) {
    await plankaRequest(`/api/tasks/${id}`, {
        method: "DELETE",
    });
    return { success: true };
}

/**
 * Synchronizes tasks that reference a completed card by marking them as completed (isCompleted: true).
 * Searches all cards on the board for any task referencing `completedCardId` in its name.
 *
 * @param {string} completedCardId - The ID of the card that was completed / moved to Done
 * @param {string} [boardId] - The ID of the board containing the cards and tasks
 * @returns {Promise<Array<object>>} Array of updated tasks
 */
export async function syncReferencedTasksOnCardDone(
    completedCardId: string,
    boardId?: string,
) {
    try {
        let targetBoardId = boardId;

        // If boardId is not provided, attempt to resolve it from the card
        if (!targetBoardId) {
            try {
                const cardResponse = await plankaRequest(`/api/cards/${completedCardId}`);
                if (cardResponse && typeof cardResponse === "object" && "item" in cardResponse) {
                    const card = (cardResponse as any).item;
                    if (card.boardId) {
                        targetBoardId = card.boardId;
                    } else if (card.listId) {
                        const listResponse = await plankaRequest(`/api/lists/${card.listId}`);
                        if (listResponse && typeof listResponse === "object" && "item" in listResponse) {
                            targetBoardId = (listResponse as any).item.boardId;
                        }
                    }
                }
            } catch (e) {
                console.error(`Could not resolve boardId for card ${completedCardId}:`, e);
            }
        }

        if (!targetBoardId) {
            return [];
        }

        // Get board lists
        const listsResponse = await plankaRequest(`/api/boards/${targetBoardId}/lists`);
        const lists = Array.isArray(listsResponse)
            ? listsResponse
            : (listsResponse as any)?.items || [];

        const updatedTasks: any[] = [];

        // For each list on the board, inspect cards and their tasks
        for (const list of lists) {
            const cardsResponse = await plankaRequest(`/api/lists/${list.id}/cards`);
            const cards = Array.isArray(cardsResponse)
                ? cardsResponse
                : (cardsResponse as any)?.items || [];

            for (const card of cards) {
                // Skip the completed card itself
                if (card.id === completedCardId) continue;

                try {
                    const cardTasks = await getTasks(card.id);
                    for (const task of cardTasks) {
                        // If task is not completed and references the completedCardId in its name
                        if (!task.isCompleted && task.name && task.name.includes(completedCardId)) {
                            const updated = await updateTask(task.id, {
                                name: task.name,
                                position: task.position,
                                isCompleted: true,
                            } as any);
                            updatedTasks.push(updated);
                        }
                    }
                } catch (taskErr) {
                    console.error(`Error checking tasks for card ${card.id}:`, taskErr);
                }
            }
        }

        return updatedTasks;
    } catch (error) {
        console.error(`Error syncing referenced tasks for card ${completedCardId}:`, error);
        return [];
    }
}
