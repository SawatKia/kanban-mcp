import { z } from "zod";
import { createCard } from "../operations/cards.js";
import {
    createTask,
    updateTask,
} from "../operations/tasks.js";
import { createComment } from "../operations/comments.js";
import {
    addLabelToCard,
    createLabel,
    getLabels,
    VALID_LABEL_COLORS,
} from "../operations/labels.js";
import { getList } from "../operations/lists.js";

/**
 * Zod schema for a single card in the batch.
 */
export const batchCardInputSchema = z.object({
    name: z.string().describe("The name of the card"),
    listId: z
        .string()
        .optional()
        .describe("The ID of the list to create this card in (overrides the top-level listId)"),
    description: z.string().optional().describe("The description of the card"),
    checklistName: z.string().optional().describe("Optional name for the card's checklist (default: 'Checklist')"),
    checklist: z
        .array(z.union([z.string(), z.object({ name: z.string(), isCompleted: z.boolean().optional() })]))
        .optional()
        .describe("Step-by-step tasks / checklist items for the card (alias for 'tasks')"),
    tasks: z
        .array(z.union([z.string(), z.object({ name: z.string(), isCompleted: z.boolean().optional() })]))
        .optional()
        .describe("Step-by-step tasks / checklist items inside the card's checklist: plain strings or {name, isCompleted} objects (task ∈ checklist ∈ card)"),
    labels: z
        .array(
            z.object({
                name: z.string().optional().describe("Existing label name to attach (matched case-insensitively)"),
                labelId: z.string().optional().describe("Explicit label ID to attach"),
                color: z
                    .enum(VALID_LABEL_COLORS)
                    .optional()
                    .describe("Color used only when creating a label that does not exist yet (default: gun-metal)"),
            }),
        )
        .optional()
        .describe("Labels to attach to the card; missing labels are created on the board"),
    comment: z.string().optional().describe("Optional comment to add to the card"),
    position: z.number().optional().describe(
        "Card vertical position in the list column. Lower numbers (e.g. 0, 1000, 65535) = higher up / top, higher numbers = lower down / bottom.",
    ),
});

export const batchCreateCardsSchema = z.object({
    boardId: z
        .string()
        .describe("The ID of the board (required to resolve/create labels)"),
    listId: z
        .string()
        .optional()
        .describe("Default list ID for all cards in the batch (each card may override it)"),
    cards: z
        .array(batchCardInputSchema)
        .min(1)
        .max(50)
        .describe("The cards to create in order"),
});

export type BatchCardInput = z.infer<typeof batchCardInputSchema>;
export type BatchCreateCardsParams = z.infer<typeof batchCreateCardsSchema>;

/**
 * Creates multiple cards in a single operation, aggregating card, task-list,
 * label, and comment operations per card.
 *
 * Labels are resolved against the board by name (case-insensitive); if a label
 * with that name doesn't exist yet it is created automatically. Each card is
 * created independently: a failure on one card is recorded in `errors` and
 * does not abort the rest of the batch.
 *
 * @param {BatchCreateCardsParams} params - Batch parameters
 * @returns {Promise<object>} Created cards plus any per-card errors
 */
export async function batchCreateCards(params: BatchCreateCardsParams) {
    const { boardId, listId: defaultListId, cards } = params;

    if (!defaultListId && cards.some((c) => !c.listId)) {
        throw new Error(
            "Every card needs a listId when no top-level listId is provided",
        );
    }

    // Resolve boardId from the first list if not supplied explicitly is not
    // possible via the API used here, so boardId stays required.

    // Load existing labels once so we can match by name without extra calls per card.
    let existingLabels: Array<{ id: string; name?: string | null }> = [];
    try {
        existingLabels = await getLabels(boardId);
    } catch {
        existingLabels = [];
    }

    // Cache of label-name -> labelId (includes labels we create during the run).
    const labelCache = new Map<string, string>();
    for (const l of existingLabels) {
        if (l.name) labelCache.set(l.name.toLowerCase(), l.id);
    }

    async function resolveLabelId(labelSpec: {
        name?: string;
        labelId?: string;
        color?: (typeof VALID_LABEL_COLORS)[number];
    }): Promise<string> {
        if (labelSpec.labelId) return labelSpec.labelId;
        if (!labelSpec.name) {
            throw new Error("Each label needs either 'labelId' or 'name'");
        }
        const key = labelSpec.name.toLowerCase();
        const cached = labelCache.get(key);
        if (cached) return cached;

        const created = await createLabel({
            boardId,
            name: labelSpec.name,
            color: labelSpec.color || "gun-metal",
        });
        labelCache.set(key, created.id);
        return created.id;
    }

    const results: Array<{
        cardName: string;
        ok: boolean;
        card?: unknown;
        taskIdOrder?: string[];
        error?: string;
    }> = [];

    let positionCursor = 65535;
    for (const [index, spec] of cards.entries()) {
        const targetListId = spec.listId || defaultListId;
        if (!targetListId) {
            results.push({
                cardName: spec.name,
                ok: false,
                error: "No listId available",
            });
            continue;
        }

        try {
            const card = await createCard({
                listId: targetListId,
                name: spec.name,
                description: spec.description || "",
                position:
                    spec.position !== undefined ? spec.position : positionCursor,
            });
            // Space positions so cards land in submission order unless overridden.
            positionCursor += 65535;

            // Step tasks within card's checklist
            const taskIdOrder: string[] = [];
            const rawTasks = spec.tasks || spec.checklist;
            if (rawTasks && rawTasks.length > 0) {
                for (let i = 0; i < rawTasks.length; i++) {
                    const raw = rawTasks[i];
                    const t: { name: string; isCompleted?: boolean } =
                        typeof raw === "string" ? { name: raw } : raw;
                    const task = await createTask({
                        cardId: card.id,
                        checklistName: spec.checklistName,
                        name: t.name,
                        position: 65535 * (i + 1),
                        isCompleted: t.isCompleted,
                    });
                    taskIdOrder.push(task.id);
                }
            }

            // Labels
            if (spec.labels && spec.labels.length > 0) {
                for (const labelSpec of spec.labels) {
                    const labelId = await resolveLabelId(labelSpec);
                    try {
                        await addLabelToCard(card.id, labelId);
                    } catch {
                        // Likely already attached (duplicate in payload) - ignore.
                    }
                }
            }

            // Comment
            if (spec.comment) {
                await createComment({ cardId: card.id, text: spec.comment });
            }

            results.push({
                cardName: spec.name,
                ok: true,
                card,
                taskIdOrder,
            });
        } catch (error) {
            results.push({
                cardName: spec.name,
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    const succeeded = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);

    return {
        total: cards.length,
        created: succeeded.length,
        failed: failed.length,
        cards: succeeded.map((r) => r.card),
        errors: failed.map((r) => ({
            cardName: r.cardName,
            error: r.error,
        })),
    };
}
