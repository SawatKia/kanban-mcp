/**
 * @fileoverview Comment operations for the MCP Kanban server
 *
 * This module provides functions for interacting with comments in the Planka Kanban board,
 * including creating, retrieving, updating, and deleting comments on cards.
 */

import { z } from "zod";
import { plankaRequest } from "../common/utils.js";

// Schema definitions
/**
 * Schema for creating a new comment
 * @property {string} cardId - The ID of the card to create the comment on
 * @property {string} text - The text content of the comment
 */
export const CreateCommentSchema = z.object({
    cardId: z.string().describe("Card ID"),
    text: z.string().describe("Comment text"),
});

/**
 * Schema for retrieving comments from a card
 * @property {string} cardId - The ID of the card to get comments from
 */
export const GetCommentsSchema = z.object({
    cardId: z.string().describe("Card ID"),
});

/**
 * Schema for retrieving a specific comment
 * @property {string} id - The ID of the comment to retrieve
 * @property {string} [cardId] - Optional ID of the card containing the comment
 */
export const GetCommentSchema = z.object({
    id: z.string().describe("Comment ID"),
    cardId: z.string().optional().describe("Card ID"),
});

/**
 * Schema for updating a comment
 * @property {string} id - The ID of the comment to update
 * @property {string} text - The new text content for the comment
 */
export const UpdateCommentSchema = z.object({
    id: z.string().describe("Comment ID"),
    text: z.string().describe("Comment text"),
});

/**
 * Schema for deleting a comment
 * @property {string} id - The ID of the comment to delete
 */
export const DeleteCommentSchema = z.object({
    id: z.string().describe("Comment ID"),
});

// Type exports
/**
 * Type definition for comment creation options
 */
export type CreateCommentOptions = z.infer<typeof CreateCommentSchema>;

/**
 * Type definition for comment update options
 */
export type UpdateCommentOptions = z.infer<typeof UpdateCommentSchema>;

// Comment schema
export const CommentSchema = z.object({
    id: z.string(),
    cardId: z.string(),
    userId: z.string(),
    text: z.string(),
    data: z.object({
        text: z.string(),
    }).optional(),
    createdAt: z.string(),
    updatedAt: z.string().nullable().optional(),
});

export type Comment = z.infer<typeof CommentSchema>;

// Cache mapping comment ID to card ID for efficient single-comment lookups
const commentCardIdMap: Record<string, string> = {};

/**
 * Normalizes comment response to provide both modern Planka fields (.text)
 * and legacy action compatibility fields (.data.text)
 */
function normalizeComment(raw: any, fallbackCardId?: string): Comment {
    const text = raw?.text ?? raw?.data?.text ?? "";
    const cardId = raw?.cardId ?? fallbackCardId ?? "";
    return {
        id: String(raw?.id || ""),
        cardId: String(cardId),
        userId: String(raw?.userId || ""),
        text,
        data: {
            text,
        },
        createdAt: raw?.createdAt || new Date().toISOString(),
        updatedAt: raw?.updatedAt ?? null,
    };
}

// Function implementations
/**
 * Creates a new comment on a card
 *
 * @param {CreateCommentOptions} options - Options for creating the comment
 * @param {string} options.cardId - The ID of the card to create the comment on
 * @param {string} options.text - The text content of the comment
 * @returns {Promise<Comment>} The created comment
 * @throws {Error} If the comment creation fails
 */
export async function createComment(options: CreateCommentOptions): Promise<Comment> {
    try {
        const response: any = await plankaRequest(
            `/api/cards/${options.cardId}/comments`,
            {
                method: "POST",
                body: {
                    text: options.text,
                },
            },
        );

        const item = response?.item || response;
        const normalized = normalizeComment(item, options.cardId);
        if (normalized.id) {
            commentCardIdMap[normalized.id] = options.cardId;
        }
        return normalized;
    } catch (error) {
        throw new Error(
            `Failed to create comment: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Retrieves all comments for a specific card
 *
 * @param {string} cardId - The ID of the card to get comments for
 * @returns {Promise<Array<Comment>>} Array of comments on the card
 */
export async function getComments(cardId: string): Promise<Comment[]> {
    try {
        const response: any = await plankaRequest(`/api/cards/${cardId}/comments`);
        let commentsList: any[] = [];
        if (response && Array.isArray(response.items)) {
            commentsList = response.items;
        } else if (Array.isArray(response)) {
            commentsList = response;
        }

        return commentsList.map((item) => {
            const normalized = normalizeComment(item, cardId);
            if (normalized.id) {
                commentCardIdMap[normalized.id] = cardId;
            }
            return normalized;
        });
    } catch (error) {
        console.error(`Failed to get comments for card ${cardId}:`, error);
        return [];
    }
}

/**
 * Retrieves a specific comment by ID
 *
 * @param {string} id - The ID of the comment to retrieve
 * @param {string} [cardId] - Optional card ID to quickly locate the comment
 * @returns {Promise<Comment>} The requested comment
 * @throws {Error} If retrieving the comment fails
 */
export async function getComment(id: string, cardId?: string): Promise<Comment> {
    try {
        const targetCardId = cardId || commentCardIdMap[id];
        if (targetCardId) {
            const cardComments = await getComments(targetCardId);
            const found = cardComments.find((c) => c.id === id);
            if (found) {
                return found;
            }
        }

        // Search across projects and boards if cardId is not provided or not in cache
        const projectsResponse: any = await plankaRequest(`/api/projects`);
        const included = projectsResponse?.included as Record<string, unknown> | undefined;
        const boards = (included?.boards as any[]) || [];

        for (const board of boards) {
            if (!board || typeof board !== "object" || !board.id) continue;
            const boardResponse: any = await plankaRequest(`/api/boards/${board.id}`);
            const boardIncluded = boardResponse?.included as Record<string, unknown> | undefined;
            const cards = (boardIncluded?.cards as any[]) || [];

            for (const card of cards) {
                if (!card || typeof card !== "object" || !card.id) continue;
                const cardComments = await getComments(card.id);
                const found = cardComments.find((c) => c.id === id);
                if (found) {
                    commentCardIdMap[id] = card.id;
                    return found;
                }
            }
        }

        throw new Error(`Comment not found: ${id}`);
    } catch (error) {
        throw new Error(
            `Failed to get comment: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Updates a comment's text content
 *
 * @param {string} id - The ID of the comment to update
 * @param {Partial<Omit<CreateCommentOptions, "cardId">>} options - The properties to update
 * @param {string} options.text - The new text content for the comment
 * @returns {Promise<Comment>} The updated comment
 * @throws {Error} If updating the comment fails
 */
export async function updateComment(
    id: string,
    options: Partial<Omit<CreateCommentOptions, "cardId">>,
): Promise<Comment> {
    try {
        const response: any = await plankaRequest(`/api/comments/${id}`, {
            method: "PATCH",
            body: {
                text: options.text,
            },
        });

        const item = response?.item || response;
        const normalized = normalizeComment(item, commentCardIdMap[id]);
        return normalized;
    } catch (error) {
        throw new Error(
            `Failed to update comment: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Deletes a comment by ID
 *
 * @param {string} id - The ID of the comment to delete
 * @returns {Promise<{success: boolean}>} Success indicator
 * @throws {Error} If deleting the comment fails
 */
export async function deleteComment(id: string): Promise<{ success: boolean }> {
    try {
        await plankaRequest(`/api/comments/${id}`, {
            method: "DELETE",
        });

        delete commentCardIdMap[id];
        return { success: true };
    } catch (error) {
        throw new Error(
            `Failed to delete comment: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}
