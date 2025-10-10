import type { InteractionAction } from "@vividiff/protocol";
import type { Page } from "playwright-core";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { executeInteractions } from "./interaction-executor";

// Mock Playwright Page
const createMockPage = (): Page => {
  const mockPage = {
    click: vi.fn(),
    dblclick: vi.fn(),
    hover: vi.fn(),
    focus: vi.fn(),
    evaluate: vi.fn(),
    type: vi.fn(),
    fill: vi.fn(),
    press: vi.fn(),
    selectOption: vi.fn(),
    check: vi.fn(),
    uncheck: vi.fn(),
    setChecked: vi.fn(),
    setInputFiles: vi.fn(),
    waitForSelector: vi.fn(),
    waitForTimeout: vi.fn(),
    waitForLoadState: vi.fn(),
    dragAndDrop: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as Page;

  return mockPage;
};

describe("executeInteractions", () => {
  let mockPage: Page;

  beforeEach(() => {
    mockPage = createMockPage();
    vi.clearAllMocks();
  });

  describe("Click Actions", () => {
    it("should execute click action with default options", async () => {
      const action: InteractionAction = {
        type: "click",
        selector: "button",
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.click).toHaveBeenCalledWith("button", {
        button: undefined,
        clickCount: undefined,
        delay: undefined,
        position: undefined,
        modifiers: undefined,
        force: undefined,
        noWaitAfter: undefined,
        timeout: 5000,
      });
    });

    it("should execute click action with custom options", async () => {
      const action: InteractionAction = {
        type: "click",
        selector: "button",
        options: {
          button: "right",
          clickCount: 2,
          delay: 100,
          position: { x: 10, y: 20 },
          modifiers: ["Shift", "Control"],
          force: true,
          noWaitAfter: true,
          timeout: 10000,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.click).toHaveBeenCalledWith("button", {
        button: "right",
        clickCount: 2,
        delay: 100,
        position: { x: 10, y: 20 },
        modifiers: ["Shift", "Control"],
        force: true,
        noWaitAfter: true,
        timeout: 10000,
      });
    });

    it("should execute dblclick action", async () => {
      const action: InteractionAction = {
        type: "dblclick",
        selector: "button",
        options: {
          modifiers: ["Shift"],
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.dblclick).toHaveBeenCalledWith("button", {
        button: undefined,
        delay: undefined,
        position: undefined,
        modifiers: ["Shift"],
        force: undefined,
        timeout: 5000,
      });
    });
  });

  describe("Hover and Focus Actions", () => {
    it("should execute hover action", async () => {
      const action: InteractionAction = {
        type: "hover",
        selector: "button",
        options: {
          position: { x: 5, y: 10 },
          modifiers: ["Alt"],
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.hover).toHaveBeenCalledWith("button", {
        position: { x: 5, y: 10 },
        modifiers: ["Alt"],
        force: undefined,
        timeout: 5000,
      });
    });

    it("should execute focus action", async () => {
      const action: InteractionAction = {
        type: "focus",
        selector: "input",
        options: {
          timeout: 3000,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.focus).toHaveBeenCalledWith("input", {
        timeout: 3000,
      });
    });

    it("should execute blur action", async () => {
      const action: InteractionAction = {
        type: "blur",
        selector: "input",
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.evaluate).toHaveBeenCalledWith(
        expect.any(Function),
        "input"
      );
    });
  });

  describe("Input Actions", () => {
    it("should execute type action with React events", async () => {
      const action: InteractionAction = {
        type: "type",
        selector: "input",
        text: "hello world",
        options: {
          delay: 50,
          timeout: 2000,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.type).toHaveBeenCalledWith("input", "hello world", {
        delay: 50,
        timeout: 2000,
      });
      expect(mockPage.dispatchEvent).toHaveBeenCalledWith("input", "input", {
        bubbles: true,
      });
      expect(mockPage.dispatchEvent).toHaveBeenCalledWith("input", "change", {
        bubbles: true,
      });
    });

    it("should execute fill action with React events", async () => {
      const action: InteractionAction = {
        type: "fill",
        selector: "input",
        text: "filled text",
        options: {
          force: true,
          noWaitAfter: true,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.fill).toHaveBeenCalledWith("input", "filled text", {
        force: true,
        noWaitAfter: true,
        timeout: 5000,
      });
      expect(mockPage.dispatchEvent).toHaveBeenCalledWith("input", "input", {
        bubbles: true,
      });
      expect(mockPage.dispatchEvent).toHaveBeenCalledWith("input", "change", {
        bubbles: true,
      });
    });

    it("should execute clear action", async () => {
      const action: InteractionAction = {
        type: "clear",
        selector: "input",
        options: {
          timeout: 1000,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.fill).toHaveBeenCalledWith("input", "", {
        timeout: 1000,
      });
    });

    it("should execute press action", async () => {
      const action: InteractionAction = {
        type: "press",
        selector: "input",
        key: "Enter",
        options: {
          delay: 100,
          noWaitAfter: true,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.press).toHaveBeenCalledWith("input", "Enter", {
        delay: 100,
        noWaitAfter: true,
        timeout: 5000,
      });
    });
  });

  describe("Selection Actions", () => {
    it("should execute select action with React events", async () => {
      const action: InteractionAction = {
        type: "select",
        selector: "select",
        value: "option1",
        options: {
          force: true,
          timeout: 3000,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.selectOption).toHaveBeenCalledWith("select", "option1", {
        force: true,
        noWaitAfter: undefined,
        timeout: 3000,
      });
      expect(mockPage.dispatchEvent).toHaveBeenCalledWith("select", "change", {
        bubbles: true,
      });
    });

    it("should execute selectOption action with React events", async () => {
      const action: InteractionAction = {
        type: "selectOption",
        selector: "select",
        values: [{ label: "Option 1" }, { value: "option2" }],
        options: {
          noWaitAfter: true,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.selectOption).toHaveBeenCalledWith(
        "select",
        [{ label: "Option 1" }, { value: "option2" }],
        {
          force: undefined,
          noWaitAfter: true,
          timeout: 5000,
        }
      );
      expect(mockPage.dispatchEvent).toHaveBeenCalledWith("select", "change", {
        bubbles: true,
      });
    });
  });

  describe("Checkbox Actions", () => {
    it("should execute check action with React events", async () => {
      const action: InteractionAction = {
        type: "check",
        selector: 'input[type="checkbox"]',
        options: {
          force: true,
          noWaitAfter: true,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.check).toHaveBeenCalledWith('input[type="checkbox"]', {
        force: true,
        noWaitAfter: true,
        timeout: 5000,
      });
      expect(mockPage.dispatchEvent).toHaveBeenCalledWith(
        'input[type="checkbox"]',
        "change",
        { bubbles: true }
      );
    });

    it("should execute uncheck action with React events", async () => {
      const action: InteractionAction = {
        type: "uncheck",
        selector: 'input[type="checkbox"]',
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.uncheck).toHaveBeenCalledWith('input[type="checkbox"]', {
        force: undefined,
        noWaitAfter: undefined,
        timeout: 5000,
      });
      expect(mockPage.dispatchEvent).toHaveBeenCalledWith(
        'input[type="checkbox"]',
        "change",
        { bubbles: true }
      );
    });

    it("should execute setChecked action with React events", async () => {
      const action: InteractionAction = {
        type: "setChecked",
        selector: 'input[type="checkbox"]',
        checked: true,
        options: {
          force: true,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.setChecked).toHaveBeenCalledWith(
        'input[type="checkbox"]',
        true,
        {
          force: true,
          noWaitAfter: undefined,
          timeout: 5000,
        }
      );
      expect(mockPage.dispatchEvent).toHaveBeenCalledWith(
        'input[type="checkbox"]',
        "change",
        { bubbles: true }
      );
    });
  });

  describe("File Upload Actions", () => {
    it("should execute setInputFiles action", async () => {
      const action: InteractionAction = {
        type: "setInputFiles",
        selector: 'input[type="file"]',
        files: ["file1.txt", "file2.txt"],
        options: {
          noWaitAfter: true,
          timeout: 2000,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.setInputFiles).toHaveBeenCalledWith(
        'input[type="file"]',
        ["file1.txt", "file2.txt"],
        {
          noWaitAfter: true,
          timeout: 2000,
        }
      );
    });
  });

  describe("Scroll Actions", () => {
    it("should execute scrollIntoView action", async () => {
      const mockElement = { scrollIntoViewIfNeeded: vi.fn() };
      (mockPage.waitForSelector as any).mockResolvedValue(mockElement);

      const action: InteractionAction = {
        type: "scrollIntoView",
        selector: "div",
        options: {
          timeout: 3000,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.waitForSelector).toHaveBeenCalledWith("div", {
        timeout: 3000,
      });
      expect(mockElement.scrollIntoViewIfNeeded).toHaveBeenCalled();
    });
  });

  describe("Drag and Drop Actions", () => {
    it("should execute dragAndDrop action", async () => {
      const action: InteractionAction = {
        type: "dragAndDrop",
        sourceSelector: ".source",
        targetSelector: ".target",
        options: {
          force: true,
          sourcePosition: { x: 10, y: 20 },
          targetPosition: { x: 30, y: 40 },
          timeout: 5000,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.dragAndDrop).toHaveBeenCalledWith(".source", ".target", {
        force: true,
        noWaitAfter: undefined,
        sourcePosition: { x: 10, y: 20 },
        targetPosition: { x: 30, y: 40 },
        timeout: 5000,
      });
    });
  });

  describe("Wait Actions", () => {
    it("should execute wait action", async () => {
      const action: InteractionAction = {
        type: "wait",
        selector: ".loading",
        options: {
          state: "visible",
          timeout: 2000,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(".loading", {
        state: "visible",
        timeout: 2000,
      });
    });

    it("should execute waitForTimeout action", async () => {
      const action: InteractionAction = {
        type: "waitForTimeout",
        duration: 1000,
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(1000);
    });

    it("should execute waitForLoadState action", async () => {
      const action: InteractionAction = {
        type: "waitForLoadState",
        state: "networkidle",
        options: {
          timeout: 5000,
        },
      };

      await executeInteractions(mockPage, [action], "test-case");

      expect(mockPage.waitForLoadState).toHaveBeenCalledWith("networkidle", {
        timeout: 5000,
      });
    });
  });

  describe("Multiple Actions", () => {
    it("should execute multiple actions in sequence", async () => {
      const actions: InteractionAction[] = [
        { type: "click", selector: "button" },
        { type: "fill", selector: "input", text: "test" },
        { type: "waitForTimeout", duration: 100 },
      ];

      await executeInteractions(mockPage, actions, "test-case");

      expect(mockPage.click).toHaveBeenCalledTimes(1);
      expect(mockPage.fill).toHaveBeenCalledTimes(1);
      expect(mockPage.waitForTimeout).toHaveBeenCalledTimes(2); // Once for action, once for settle time
      expect(mockPage.waitForTimeout).toHaveBeenNthCalledWith(1, 100); // Action
      expect(mockPage.waitForTimeout).toHaveBeenNthCalledWith(2, 100); // Settle time
    });
  });

  describe("Error Handling", () => {
    it("should throw error with action details when action fails", async () => {
      const action: InteractionAction = {
        type: "click",
        selector: "button",
      };

      const error = new Error("Element not found");
      (mockPage.click as any).mockRejectedValue(error);

      await expect(
        executeInteractions(mockPage, [action], "test-case")
      ).rejects.toThrow("Interaction 1/1 failed for test-case:");

      expect(mockPage.click).toHaveBeenCalled();
    });

    it("should include action JSON in error message", async () => {
      const action: InteractionAction = {
        type: "click",
        selector: "button",
        options: { timeout: 1000 },
      };

      const error = new Error("Element not found");
      (mockPage.click as any).mockRejectedValue(error);

      await expect(
        executeInteractions(mockPage, [action], "test-case")
      ).rejects.toThrow(JSON.stringify(action, null, 2));
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty interactions array", async () => {
      await executeInteractions(mockPage, [], "test-case");

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(100); // Only settle time
    });

    it("should handle unknown action type", async () => {
      const action = { type: "unknown" } as any;

      await expect(
        executeInteractions(mockPage, [action], "test-case")
      ).rejects.toThrow("Unknown action type: unknown");
    });
  });
});
