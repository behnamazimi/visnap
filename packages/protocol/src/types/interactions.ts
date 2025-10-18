/**
 * @fileoverview Interaction types for Visnap visual testing framework
 *
 * This module defines all interaction actions and their options that can be performed
 * before taking a screenshot.
 */

/**
 * Options for click interactions
 * @property button - Mouse button to use (default: "left")
 * @property clickCount - Number of clicks (default: 1)
 * @property delay - Delay between mousedown and mouseup in milliseconds
 * @property position - Click position relative to element's top-left corner
 * @property modifiers - Keyboard modifiers to press during click
 * @property force - Skip actionability checks (default: false)
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface ClickOptions {
  button?: "left" | "right" | "middle";
  clickCount?: number;
  delay?: number;
  position?: { x: number; y: number };
  modifiers?: Array<"Alt" | "Control" | "Meta" | "Shift">;
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for hover interactions
 * @property position - Hover position relative to element's top-left corner
 * @property modifiers - Keyboard modifiers to press during hover
 * @property force - Skip actionability checks (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface HoverOptions {
  position?: { x: number; y: number };
  modifiers?: Array<"Alt" | "Control" | "Meta" | "Shift">;
  force?: boolean;
  timeout?: number;
}

/**
 * Options for typing interactions
 * @property delay - Delay between key presses in milliseconds
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface TypeOptions {
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for fill interactions
 * @property force - Skip actionability checks (default: false)
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface FillOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for select interactions
 * @property force - Skip actionability checks (default: false)
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface SelectOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for check/uncheck interactions
 * @property force - Skip actionability checks (default: false)
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface CheckOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for key press interactions
 * @property delay - Delay between keydown and keyup in milliseconds
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface PressOptions {
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for focus interactions
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface FocusOptions {
  timeout?: number;
}

/**
 * Options for scroll interactions
 * @property behavior - Scroll behavior (default: "auto")
 * @property block - Vertical alignment (default: "start")
 * @property inline - Horizontal alignment (default: "nearest")
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface ScrollOptions {
  behavior?: "auto" | "smooth";
  block?: "start" | "center" | "end" | "nearest";
  inline?: "start" | "center" | "end" | "nearest";
  timeout?: number;
}

/**
 * Options for drag and drop interactions
 * @property force - Skip actionability checks (default: false)
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property sourcePosition - Starting position for drag (relative to source element)
 * @property targetPosition - Ending position for drop (relative to target element)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface DragAndDropOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  sourcePosition?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  timeout?: number;
}

/**
 * Options for wait for selector interactions
 * @property state - Element state to wait for (default: "attached")
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface WaitForSelectorOptions {
  state?: "attached" | "detached" | "visible" | "hidden";
  timeout?: number;
}

/**
 * Options for wait for load state interactions
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface WaitForLoadStateOptions {
  timeout?: number;
}

/**
 * Options for set input files interactions
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface SetInputFilesOptions {
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Union type representing all possible interaction actions that can be performed
 * before taking a screenshot. Each action includes a type and required parameters.
 *
 * @example
 * ```typescript
 * const interactions: InteractionAction[] = [
 *   { type: "click", selector: "#button" },
 *   { type: "type", selector: "#input", text: "Hello World" },
 *   { type: "wait", selector: "#loading", options: { state: "hidden" } }
 * ];
 * ```
 */
export type InteractionAction =
  // Click actions
  | { type: "click"; selector: string; options?: ClickOptions }
  | { type: "dblclick"; selector: string; options?: ClickOptions }

  // Hover/Focus actions
  | { type: "hover"; selector: string; options?: HoverOptions }
  | { type: "focus"; selector: string; options?: FocusOptions }
  | { type: "blur"; selector: string; options?: { timeout?: number } }

  // Input actions
  | { type: "type"; selector: string; text: string; options?: TypeOptions }
  | { type: "fill"; selector: string; text: string; options?: FillOptions }
  | { type: "clear"; selector: string; options?: { timeout?: number } }
  | { type: "press"; selector: string; key: string; options?: PressOptions }

  // Selection actions
  | {
      type: "select";
      selector: string;
      value: string | string[];
      options?: SelectOptions;
    }
  | {
      type: "selectOption";
      selector: string;
      values: Array<{ value?: string; label?: string; index?: number }>;
      options?: SelectOptions;
    }

  // Checkbox/Radio actions
  | { type: "check"; selector: string; options?: CheckOptions }
  | { type: "uncheck"; selector: string; options?: CheckOptions }
  | {
      type: "setChecked";
      selector: string;
      checked: boolean;
      options?: CheckOptions;
    }

  // File upload
  | {
      type: "setInputFiles";
      selector: string;
      files: string | string[];
      options?: SetInputFilesOptions;
    }

  // Scroll actions
  | { type: "scrollIntoView"; selector: string; options?: ScrollOptions }

  // Drag and drop
  | {
      type: "dragAndDrop";
      sourceSelector: string;
      targetSelector: string;
      options?: DragAndDropOptions;
    }

  // Wait actions
  | { type: "wait"; selector: string; options?: WaitForSelectorOptions }
  | { type: "waitForTimeout"; duration: number }
  | {
      type: "waitForLoadState";
      state?: "load" | "domcontentloaded" | "networkidle";
      options?: WaitForLoadStateOptions;
    };
