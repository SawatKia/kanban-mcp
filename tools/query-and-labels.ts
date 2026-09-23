import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { getProjects } from "../operations/projects.js";
import { getBoards } from "../operations/boards.js";

/**
 * State enum for task/card lifecycle.
 */
export const TaskStateEnum = z.enum([
  "TODO",
  "IN_PROGRESS",
  "WAITING_REVIEW",
  "WAITING_TEST",
  "DONE",
  "BLOCKED",
  "NEEDS_CLARIFICATION",
  "STALE",
  "FAILED",
]);

export type TaskState = z.infer<typeof TaskStateEnum>;

/**
 * Position enum for agent roles.
 */
export const PositionEnum = z.enum([
  "PLANNER",
  "CODER",
  "REVIEWER",
  "TESTER",
  "RESEARCHER",
  "ARCHITECT",
]);

export type Position = z.infer<typeof PositionEnum>;

/**
 * Maps a Kanban list name to standard TaskState.
 */
export function mapListNameToState(listName: string, isCompleted?: boolean): TaskState {
  if (isCompleted) return "DONE";
  const normalized = (listName || "").toLowerCase().trim();

  if (
    normalized.includes("backlog") ||
    normalized === "todo" ||
    normalized === "to do" ||
    normalized === "open"
  ) {
    return "TODO";
  }
  if (
    normalized.includes("in progress") ||
    normalized === "doing" ||
    normalized === "wip" ||
    normalized === "working"
  ) {
    return "IN_PROGRESS";
  }
  if (
    normalized.includes("review") ||
    normalized.includes("waiting review") ||
    normalized.includes("under review")
  ) {
    return "WAITING_REVIEW";
  }
  if (
    normalized.includes("test") ||
    normalized.includes("qa") ||
    normalized.includes("waiting test") ||
    normalized.includes("verify")
  ) {
    return "WAITING_TEST";
  }
  if (
    normalized.includes("done") ||
    normalized.includes("complete") ||
    normalized.includes("closed") ||
    normalized.includes("finished") ||
    normalized.includes("สำเร็จ")
  ) {
    return "DONE";
  }
  if (normalized.includes("block") || normalized.includes("hold")) {
    return "BLOCKED";
  }
  if (normalized.includes("clarif")) {
    return "NEEDS_CLARIFICATION";
  }

  return "TODO";
}

/**
 * Parses card metadata from description (dependencies, allowed/forbidden files, role).
 */
export function parseCardMetadata(description: string = "") {
  const dependencies: string[] = [];
  const allowedFiles: string[] = [];
  const forbiddenFiles: string[] = [];
  let role: Position | undefined;

  const lines = description.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith("[DEPS]:") ||
      trimmed.startsWith("Dependencies:") ||
      trimmed.startsWith("Deps:")
    ) {
      const val = trimmed
        .replace(/^(\[DEPS\]:|Dependencies:|Deps:)/i, "")
        .trim();
      val
        .split(/[,;\s]+/)
        .filter(Boolean)
        .forEach((d) => dependencies.push(d));
    }
    if (
      trimmed.startsWith("[ALLOWED]:") ||
      trimmed.startsWith("AllowedFiles:")
    ) {
      const val = trimmed
        .replace(/^(\[ALLOWED\]:|AllowedFiles:)/i, "")
        .trim();
      val
        .split(/[,;\s]+/)
        .filter(Boolean)
        .forEach((f) => allowedFiles.push(f));
    }
    if (
      trimmed.startsWith("[FORBIDDEN]:") ||
      trimmed.startsWith("ForbiddenFiles:")
    ) {
      const val = trimmed
        .replace(/^(\[FORBIDDEN\]:|ForbiddenFiles:)/i, "")
        .trim();
      val
        .split(/[,;\s]+/)
        .filter(Boolean)
        .forEach((f) => forbiddenFiles.push(f));
    }
    if (
      trimmed.startsWith("[ROLE]:") ||
      trimmed.startsWith("[POSITION]:") ||
      trimmed.startsWith("Role:") ||
      trimmed.startsWith("Position:")
    ) {
      const parsedRole = trimmed
        .replace(/^(\[ROLE\]:|\[POSITION\]:|Role:|Position:)/i, "")
        .trim()
        .toUpperCase();
      if (
        [
          "PLANNER",
          "CODER",
          "REVIEWER",
          "TESTER",
          "RESEARCHER",
          "ARCHITECT",
        ].includes(parsedRole)
      ) {
        role = parsedRole as Position;
      }
    }
  }

  return { dependencies, allowedFiles, forbiddenFiles, role };
}

// ----------------------------------------------------
// 1. Label Discovery: listLabels / scheduler_list_labels
// ----------------------------------------------------

export const listLabelsSchema = z.object({
  boardId: z
    .string()
    .optional()
    .describe("Optional board ID to scope label discovery (searches all boards if omitted)"),
});

export type ListLabelsParams = z.infer<typeof listLabelsSchema>;

export interface LabelSummary {
  name: string;
  totalTasks: number;
  byState: Partial<Record<TaskState, number>>;
  cardIds?: string[];
}

/**
 * Retrieves all labels across the board(s) along with total task/card counts and state breakdowns.
 */
export async function listLabels(params: ListLabelsParams = {}) {
  try {
    const boardIds: string[] = [];

    if (params.boardId) {
      boardIds.push(params.boardId);
    } else {
      const projectsResponse = await getProjects(1, 100);
      const projects = projectsResponse.items || [];
      for (const project of projects) {
        const boards = await getBoards(project.id);
        for (const b of boards) {
          boardIds.push(b.id);
        }
      }
    }

    const labelMap = new Map<
      string,
      {
        totalTasks: number;
        byState: Partial<Record<TaskState, number>>;
        cardIds: string[];
      }
    >();

    for (const bId of boardIds) {
      try {
        const boardData = (await plankaRequest(`/api/boards/${bId}`)) as any;
        const included = boardData?.included || {};

        const labelsList: any[] = included.labels || [];
        const listsList: any[] = included.lists || [];
        const cardsList: any[] = included.cards || [];
        const cardLabelsList: any[] = included.cardLabels || [];

        // Build list ID -> State map
        const listStateMap = new Map<string, TaskState>();
        for (const l of listsList) {
          listStateMap.set(l.id, mapListNameToState(l.name));
        }

        // Build label ID -> label Name map
        const labelIdToName = new Map<string, string>();
        for (const lbl of labelsList) {
          labelIdToName.set(lbl.id, lbl.name);
          // Initialize in labelMap if not present
          if (!labelMap.has(lbl.name)) {
            labelMap.set(lbl.name, {
              totalTasks: 0,
              byState: {},
              cardIds: [],
            });
          }
        }

        // Build card ID -> labels map
        const cardToLabels = new Map<string, string[]>();
        for (const cl of cardLabelsList) {
          const lblName = labelIdToName.get(cl.labelId);
          if (lblName) {
            const arr = cardToLabels.get(cl.cardId) || [];
            arr.push(lblName);
            cardToLabels.set(cl.cardId, arr);
          }
        }

        // Aggregate for each card
        for (const card of cardsList) {
          const state =
            (card.isCompleted ? "DONE" : listStateMap.get(card.listId)) ||
            "TODO";
          const cardLabels = cardToLabels.get(card.id) || [];

          for (const lblName of cardLabels) {
            const stat = labelMap.get(lblName) || {
              totalTasks: 0,
              byState: {},
              cardIds: [],
            };
            stat.totalTasks++;
            stat.byState[state] = (stat.byState[state] || 0) + 1;
            if (!stat.cardIds.includes(card.id)) {
              stat.cardIds.push(card.id);
            }
            labelMap.set(lblName, stat);
          }
        }
      } catch (err) {
        console.error(`Error processing board ${bId} in listLabels:`, err);
      }
    }

    const labels: LabelSummary[] = Array.from(labelMap.entries())
      .map(([name, data]) => ({
        name,
        totalTasks: data.totalTasks,
        byState: data.byState,
        cardIds: data.cardIds,
      }))
      .sort((a, b) => b.totalTasks - a.totalTasks);

    return {
      totalLabels: labels.length,
      labels,
    };
  } catch (error) {
    console.error("Error in listLabels:", error);
    throw error;
  }
}

// ----------------------------------------------------
// 2. Query & Search: queryTasks / scheduler_query_tasks
// ----------------------------------------------------

export const queryTasksSchema = z.object({
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
    .describe("Search keyword across Title/Name, Objective/Description, Expected Output, Allowed Files, or Checklist Task names"),
  state: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe("Filter by state: TODO, IN_PROGRESS, WAITING_REVIEW, WAITING_TEST, DONE, BLOCKED, NEEDS_CLARIFICATION, FAILED"),
  assignedPosition: PositionEnum.optional().describe(
    "Filter by assigned agent role (PLANNER, CODER, REVIEWER, TESTER, RESEARCHER, ARCHITECT)"
  ),
  isReady: z
    .boolean()
    .optional()
    .describe("true = Only tasks/cards whose dependencies are fully DONE and ready to be worked on"),
  isBlocked: z
    .boolean()
    .optional()
    .describe("true = Only tasks/cards blocked by unmet dependencies"),
  limit: z.number().optional().describe("Maximum number of results to return"),
});

export type QueryTasksParams = z.infer<typeof queryTasksSchema>;

/**
 * Queries and filters cards/tasks in the Kanban board by specific criteria.
 */
export async function queryTasks(params: QueryTasksParams) {
  try {
    const boardIds: string[] = [];

    if (params.boardId) {
      boardIds.push(params.boardId);
    } else {
      const projectsResponse = await getProjects(1, 100);
      const projects = projectsResponse.items || [];
      for (const project of projects) {
        const boards = await getBoards(project.id);
        for (const b of boards) {
          boardIds.push(b.id);
        }
      }
    }

    const allEnrichedCards: any[] = [];

    for (const bId of boardIds) {
      try {
        const boardData = (await plankaRequest(`/api/boards/${bId}`)) as any;
        const included = boardData?.included || {};

        const labelsList: any[] = included.labels || [];
        const listsList: any[] = included.lists || [];
        const cardsList: any[] = included.cards || [];
        const cardLabelsList: any[] = included.cardLabels || [];
        const tasksList: any[] = included.tasks || [];

        // Maps
        const listMap = new Map<string, any>();
        const listStateMap = new Map<string, TaskState>();
        for (const l of listsList) {
          listMap.set(l.id, l);
          listStateMap.set(l.id, mapListNameToState(l.name));
        }

        const labelIdToName = new Map<string, string>();
        for (const lbl of labelsList) {
          labelIdToName.set(lbl.id, lbl.name);
        }

        const cardToLabels = new Map<string, string[]>();
        for (const cl of cardLabelsList) {
          const lblName = labelIdToName.get(cl.labelId);
          if (lblName) {
            const arr = cardToLabels.get(cl.cardId) || [];
            arr.push(lblName);
            cardToLabels.set(cl.cardId, arr);
          }
        }

        const cardToTasks = new Map<string, any[]>();
        for (const t of tasksList) {
          const arr = cardToTasks.get(t.cardId) || [];
          arr.push(t);
          cardToTasks.set(t.cardId, arr);
        }

        for (const card of cardsList) {
          const list = listMap.get(card.listId);
          const state =
            (card.isCompleted ? "DONE" : listStateMap.get(card.listId)) ||
            "TODO";
          const labels = cardToLabels.get(card.id) || [];
          const tasks = cardToTasks.get(card.id) || [];
          const metadata = parseCardMetadata(card.description || "");

          // Determine role if label matches role
          let assignedPosition = metadata.role;
          if (!assignedPosition) {
            for (const lbl of labels) {
              const upper = lbl.toUpperCase();
              if (
                [
                  "PLANNER",
                  "CODER",
                  "REVIEWER",
                  "TESTER",
                  "RESEARCHER",
                  "ARCHITECT",
                ].includes(upper)
              ) {
                assignedPosition = upper as Position;
                break;
              }
            }
          }

          allEnrichedCards.push({
            id: card.id,
            taskId: card.id,
            boardId: bId,
            listId: card.listId,
            listName: list?.name || "Unknown",
            title: card.name,
            name: card.name,
            objective: card.description || "",
            description: card.description || "",
            state,
            labels,
            tasks,
            dependencies: metadata.dependencies,
            allowedFiles: metadata.allowedFiles,
            forbiddenFiles: metadata.forbiddenFiles,
            assignedPosition,
            isCompleted: card.isCompleted || state === "DONE",
            dueDate: card.dueDate,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt,
          });
        }
      } catch (err) {
        console.error(`Error processing board ${bId} in queryTasks:`, err);
      }
    }

    // Map of all card states for dependency resolution
    const cardStateMap = new Map<string, string>();
    for (const c of allEnrichedCards) {
      cardStateMap.set(c.id, c.state);
    }

    // Compute isReady and isBlocked for each card
    for (const card of allEnrichedCards) {
      const deps = card.dependencies || [];
      const hasUnmetDeps = deps.some((depId: string) => {
        const depState = cardStateMap.get(depId);
        return depState !== "DONE";
      });

      card.isBlocked = deps.length > 0 && hasUnmetDeps;
      card.isReady = !hasUnmetDeps && card.state !== "DONE";
    }

    let results = allEnrichedCards;

    // Filter by taskId / substring
    if (params.taskId) {
      const q = params.taskId.toLowerCase();
      results = results.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.tasks.some((t: any) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
      );
    }

    // Filter by labels
    if (params.labels && params.labels.length > 0) {
      const matchMode = params.labelMatchMode || "any";
      const targetLabels = params.labels.map((l) => l.toLowerCase());

      results = results.filter((c) => {
        const cardLabels = (c.labels || []).map((l: string) => l.toLowerCase());
        if (matchMode === "all") {
          return targetLabels.every((tl) => cardLabels.includes(tl));
        } else {
          return targetLabels.some((tl) => cardLabels.includes(tl));
        }
      });
    }

    // Filter by text search
    if (params.text) {
      const q = params.text.toLowerCase();
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.objective.toLowerCase().includes(q) ||
          c.allowedFiles.some((f: string) => f.toLowerCase().includes(q)) ||
          c.tasks.some((t: any) => t.name.toLowerCase().includes(q))
      );
    }

    // Filter by state
    if (params.state) {
      const states = (
        Array.isArray(params.state) ? params.state : [params.state]
      ).map((s) => s.toUpperCase());
      results = results.filter((c) => states.includes(c.state));
    }

    // Filter by assignedPosition
    if (params.assignedPosition) {
      results = results.filter(
        (c) => c.assignedPosition === params.assignedPosition
      );
    }

    // Filter by isReady
    if (params.isReady !== undefined) {
      results = results.filter((c) => c.isReady === params.isReady);
    }

    // Filter by isBlocked
    if (params.isBlocked !== undefined) {
      results = results.filter((c) => c.isBlocked === params.isBlocked);
    }

    // Apply limit
    if (params.limit && params.limit > 0) {
      results = results.slice(0, params.limit);
    }

    return {
      count: results.length,
      tasks: results,
    };
  } catch (error) {
    console.error("Error in queryTasks:", error);
    throw error;
  }
}
