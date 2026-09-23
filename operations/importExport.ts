/**
 * @fileoverview Board Import/Export operations for the MCP Kanban server
 */

import { plankaRequest } from "../common/utils.js";
import { getBoard } from "./boards.js";

/**
 * Exports a board's full content to a portative JSON format
 *
 * @param {string} boardId - The ID of the board to export
 * @returns {Promise<object>} The exported board data
 */
export async function exportBoard(boardId: string) {
    try {
        const boardDetail: any = await plankaRequest(`/api/boards/${boardId}`);
        if (!boardDetail || !boardDetail.item) {
            throw new Error(`Board ${boardId} not found`);
        }

        const board = boardDetail.item;
        const included = boardDetail.included || {};

        // Extract and filter relevant board elements
        const lists = (included.lists || [])
            .filter((l: any) => l.boardId === boardId && l.type === "active")
            .map((l: any) => ({
                id: l.id,
                name: l.name,
                position: l.position,
                type: l.type
            }));

        const listIds = new Set(lists.map((l: any) => l.id));

        const labels = (included.labels || [])
            .filter((l: any) => l.boardId === boardId)
            .map((l: any) => ({
                id: l.id,
                name: l.name,
                color: l.color,
                position: l.position
            }));

        const cards = (included.cards || [])
            .filter((c: any) => listIds.has(c.listId))
            .map((c: any) => ({
                id: c.id,
                listId: c.listId,
                name: c.name,
                description: c.description,
                position: c.position,
                dueDate: c.dueDate,
                isCompleted: c.isCompleted || c.isDueCompleted || false
            }));

        const cardIds = new Set(cards.map((c: any) => c.id));

        const cardLabels = (included.cardLabels || [])
            .filter((cl: any) => cardIds.has(cl.cardId))
            .map((cl: any) => ({
                cardId: cl.cardId,
                labelId: cl.labelId
            }));

        const taskLists = (included.taskLists || [])
            .filter((tl: any) => cardIds.has(tl.cardId))
            .map((tl: any) => ({
                id: tl.id,
                cardId: tl.cardId,
                name: tl.name,
                position: tl.position
            }));

        const taskListIds = new Set(taskLists.map((tl: any) => tl.id));

        const tasks = (included.tasks || [])
            .filter((t: any) => taskListIds.has(t.taskListId))
            .map((t: any) => ({
                taskListId: t.taskListId,
                name: t.name,
                position: t.position,
                isCompleted: t.isCompleted || false
            }));

        return {
            board: {
                name: board.name,
                defaultView: board.defaultView,
                defaultCardType: board.defaultCardType
            },
            lists,
            labels,
            cards,
            cardLabels,
            taskLists,
            tasks
        };
    } catch (error) {
        throw new Error(
            `Failed to export board: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Imports board content from a JSON representation
 *
 * @param {string} projectId - The ID of the project to import into
 * @param {string} [boardName] - Optional custom name for the board
 * @param {string} [targetBoardId] - Optional existing board ID to import into
 * @param {object} importData - The board JSON data to import
 * @returns {Promise<object>} Result of the import operation
 */
export async function importBoard(
    projectId: string,
    boardName: string | undefined,
    targetBoardId: string | undefined,
    importData: any
) {
    try {
        if (!importData || typeof importData !== "object") {
            throw new Error("Invalid import data: must be an object");
        }

        let board: any;

        if (targetBoardId) {
            // Import into existing board
            board = await getBoard(targetBoardId);
            if (!board) {
                throw new Error(`Target board ${targetBoardId} not found`);
            }
        } else {
            // Create a new board
            const name = boardName || importData.board?.name || "Imported Board";
            const response: any = await plankaRequest(`/api/projects/${projectId}/boards`, {
                method: "POST",
                body: {
                    name,
                    position: 65535
                }
            });
            board = response.item;
        }

        // Get existing lists and labels to map or prevent duplicates
        const boardDetail: any = await plankaRequest(`/api/boards/${board.id}`);
        const existingLists = boardDetail.included?.lists || [];
        const existingLabels = boardDetail.included?.labels || [];

        const listIdMap: Record<string, string> = {};
        const labelIdMap: Record<string, string> = {};
        const cardIdMap: Record<string, string> = {};
        const taskListIdMap: Record<string, string> = {};

        // 1. Map or create lists
        const listsToImport = importData.lists || [];
        for (const listData of listsToImport) {
            let listObj = existingLists.find((l: any) => l.name === listData.name && l.type === "active");
            if (!listObj) {
                const listRes: any = await plankaRequest(`/api/boards/${board.id}/lists`, {
                    method: "POST",
                    body: {
                        name: listData.name,
                        position: listData.position || 65535,
                        type: "active"
                    }
                });
                listObj = listRes.item;
            }
            listIdMap[listData.id] = listObj.id;
        }

        // 2. Map or create labels
        const labelsToImport = importData.labels || [];
        for (const labelData of labelsToImport) {
            let labelObj = existingLabels.find((l: any) => l.name === labelData.name);
            if (!labelObj) {
                const labelRes: any = await plankaRequest(`/api/boards/${board.id}/labels`, {
                    method: "POST",
                    body: {
                        name: labelData.name,
                        color: labelData.color,
                        position: labelData.position || 65535
                    }
                });
                labelObj = labelRes.item;
            }
            labelIdMap[labelData.id] = labelObj.id;
        }

        // 3. Create cards
        const cardsToImport = importData.cards || [];
        // Sort cards by position to maintain order
        cardsToImport.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

        const defaultCardType = board.defaultCardType || importData.board?.defaultCardType || "card";

        for (const cardData of cardsToImport) {
            const newListId = listIdMap[cardData.listId];
            if (!newListId) continue; // Skip cards whose list wasn't imported

            const cardBody: any = {
                name: cardData.name,
                position: cardData.position || 65535,
                type: defaultCardType
            };

            if (cardData.description && cardData.description.trim()) {
                cardBody.description = cardData.description;
            }

            if (cardData.dueDate) {
                cardBody.dueDate = cardData.dueDate;
            }

            const cardRes: any = await plankaRequest(`/api/lists/${newListId}/cards`, {
                method: "POST",
                body: cardBody
            });
            const card = cardRes.item;
            cardIdMap[cardData.id] = card.id;

            // Set isCompleted if true
            if (cardData.isCompleted) {
                await plankaRequest(`/api/cards/${card.id}`, {
                    method: "PATCH",
                    body: {
                        isCompleted: true
                    }
                });
            }
        }

        // 4. Create card-label links
        const cardLabelsToImport = importData.cardLabels || [];
        for (const clData of cardLabelsToImport) {
            const newCardId = cardIdMap[clData.cardId];
            const newLabelId = labelIdMap[clData.labelId];
            if (newCardId && newLabelId) {
                await plankaRequest(`/api/cards/${newCardId}/card-labels`, {
                    method: "POST",
                    body: {
                        labelId: newLabelId
                    }
                });
            }
        }

        // 5. Create task lists
        const taskListsToImport = importData.taskLists || [];
        for (const tlData of taskListsToImport) {
            const newCardId = cardIdMap[tlData.cardId];
            if (!newCardId) continue;

            const tlRes: any = await plankaRequest(`/api/cards/${newCardId}/task-lists`, {
                method: "POST",
                body: {
                    name: tlData.name,
                    position: tlData.position || 65535
                }
            });
            taskListIdMap[tlData.id] = tlRes.item.id;
        }

        // 6. Create tasks (checklist items)
        const tasksToImport = importData.tasks || [];
        for (const tData of tasksToImport) {
            const newTaskListId = taskListIdMap[tData.taskListId];
            if (!newTaskListId) continue;

            const tRes: any = await plankaRequest(`/api/task-lists/${newTaskListId}/tasks`, {
                method: "POST",
                body: {
                    name: tData.name,
                    position: tData.position || 65535
                }
            });
            const taskObj = tRes.item;

            if (tData.isCompleted) {
                await plankaRequest(`/api/tasks/${taskObj.id}`, {
                    method: "PATCH",
                    body: {
                        isCompleted: true
                    }
                });
            }
        }

        return {
            success: true,
            boardId: board.id,
            boardName: board.name,
            stats: {
                listsImported: Object.keys(listIdMap).length,
                labelsImported: Object.keys(labelIdMap).length,
                cardsImported: Object.keys(cardIdMap).length,
                checklistsImported: Object.keys(taskListIdMap).length,
                checklistItemsImported: tasksToImport.length
            }
        };
    } catch (error) {
        throw new Error(
            `Failed to import board: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}
