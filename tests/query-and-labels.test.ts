import { describe, expect, test } from "@jest/globals";
import {
  mapListNameToState,
  parseCardMetadata,
} from "../tools/query-and-labels.js";
import {
  AddLabelsToCardSchema,
  RemoveLabelsFromCardSchema,
} from "../operations/labels.js";

describe("Query and Labels Discovery Unit Tests", () => {
  test("mapListNameToState should accurately map Kanban column names to TaskState", () => {
    expect(mapListNameToState("Backlog")).toBe("TODO");
    expect(mapListNameToState("To Do")).toBe("TODO");
    expect(mapListNameToState("In Progress")).toBe("IN_PROGRESS");
    expect(mapListNameToState("Doing")).toBe("IN_PROGRESS");
    expect(mapListNameToState("Code Review")).toBe("WAITING_REVIEW");
    expect(mapListNameToState("Testing")).toBe("WAITING_TEST");
    expect(mapListNameToState("QA Verification")).toBe("WAITING_TEST");
    expect(mapListNameToState("Done")).toBe("DONE");
    expect(mapListNameToState("Finished")).toBe("DONE");
    expect(mapListNameToState("Blocked")).toBe("BLOCKED");
    expect(mapListNameToState("Needs Clarification")).toBe("NEEDS_CLARIFICATION");
    expect(mapListNameToState("Any list", true)).toBe("DONE");
  });

  test("parseCardMetadata should extract dependencies, allowed files, forbidden files, and role", () => {
    const description = `
Implement JWT auth endpoints.
[ALLOWED]: src/auth/**, src/server.ts
[FORBIDDEN]: src/legacy/**
[DEPS]: card-123, card-456
[ROLE]: CODER
    `;

    const metadata = parseCardMetadata(description);
    expect(metadata.allowedFiles).toEqual(["src/auth/**", "src/server.ts"]);
    expect(metadata.forbiddenFiles).toEqual(["src/legacy/**"]);
    expect(metadata.dependencies).toEqual(["card-123", "card-456"]);
    expect(metadata.role).toBe("CODER");
  });

  test("AddLabelsToCardSchema and RemoveLabelsFromCardSchema validate input correctly", () => {
    const addInput = {
      cardId: "card-123",
      labelIds: ["label-1", "label-2", "label-3"],
    };
    expect(AddLabelsToCardSchema.parse(addInput)).toEqual(addInput);

    const removeInput = {
      cardId: "card-456",
      labelIds: ["label-1", "label-2"],
    };
    expect(RemoveLabelsFromCardSchema.parse(removeInput)).toEqual(removeInput);
  });
});
