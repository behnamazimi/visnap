import type { InteractionAction } from "@visnap/protocol";
import type { Page } from "playwright-core";

import {
  INTERACTION_DEFAULT_TIMEOUT,
  INTERACTION_SETTLE_TIME,
} from "./constants";

/**
 * Executes a single interaction action by mapping generic action to Playwright API
 */
async function executeAction(
  page: Page,
  action: InteractionAction
): Promise<void> {
  const defaultTimeout = INTERACTION_DEFAULT_TIMEOUT;

  switch (action.type) {
    case "click":
      await page.click(action.selector, {
        button: action.options?.button,
        clickCount: action.options?.clickCount,
        delay: action.options?.delay,
        position: action.options?.position,
        modifiers: action.options?.modifiers,
        force: action.options?.force,
        noWaitAfter: action.options?.noWaitAfter,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      break;

    case "dblclick":
      await page.dblclick(action.selector, {
        button: action.options?.button,
        delay: action.options?.delay,
        position: action.options?.position,
        modifiers: action.options?.modifiers,
        force: action.options?.force,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      break;

    case "hover":
      await page.hover(action.selector, {
        position: action.options?.position,
        modifiers: action.options?.modifiers,
        force: action.options?.force,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      break;

    case "focus":
      await page.focus(action.selector, {
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      break;

    case "blur":
      await page.evaluate(selector => {
        const el = document.querySelector(selector) as HTMLElement;
        if (el) el.blur();
      }, action.selector);
      break;

    case "type":
      await page.type(action.selector, action.text, {
        delay: action.options?.delay,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      // Trigger React change events for controlled components
      await page.dispatchEvent(action.selector, "input", { bubbles: true });
      await page.dispatchEvent(action.selector, "change", { bubbles: true });
      break;

    case "fill":
      await page.fill(action.selector, action.text, {
        force: action.options?.force,
        noWaitAfter: action.options?.noWaitAfter,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      // Trigger React change events for controlled components
      await page.dispatchEvent(action.selector, "input", { bubbles: true });
      await page.dispatchEvent(action.selector, "change", { bubbles: true });
      break;

    case "clear":
      await page.fill(action.selector, "", {
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      break;

    case "press":
      await page.press(action.selector, action.key, {
        delay: action.options?.delay,
        noWaitAfter: action.options?.noWaitAfter,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      break;

    case "select":
      await page.selectOption(action.selector, action.value, {
        force: action.options?.force,
        noWaitAfter: action.options?.noWaitAfter,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      // Trigger React change events for controlled components
      await page.dispatchEvent(action.selector, "change", { bubbles: true });
      break;

    case "selectOption":
      await page.selectOption(action.selector, action.values, {
        force: action.options?.force,
        noWaitAfter: action.options?.noWaitAfter,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      // Trigger React change events for controlled components
      await page.dispatchEvent(action.selector, "change", { bubbles: true });
      break;

    case "check":
      await page.check(action.selector, {
        force: action.options?.force,
        noWaitAfter: action.options?.noWaitAfter,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      // Trigger React change events for controlled components
      await page.dispatchEvent(action.selector, "change", { bubbles: true });
      break;

    case "uncheck":
      await page.uncheck(action.selector, {
        force: action.options?.force,
        noWaitAfter: action.options?.noWaitAfter,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      // Trigger React change events for controlled components
      await page.dispatchEvent(action.selector, "change", { bubbles: true });
      break;

    case "setChecked":
      await page.setChecked(action.selector, action.checked, {
        force: action.options?.force,
        noWaitAfter: action.options?.noWaitAfter,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      // Trigger React change events for controlled components
      await page.dispatchEvent(action.selector, "change", { bubbles: true });
      break;

    case "setInputFiles":
      await page.setInputFiles(action.selector, action.files, {
        noWaitAfter: action.options?.noWaitAfter,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      break;

    case "scrollIntoView": {
      const element = await page.waitForSelector(action.selector, {
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      if (element) {
        await element.scrollIntoViewIfNeeded();
      }
      break;
    }

    case "dragAndDrop":
      await page.dragAndDrop(action.sourceSelector, action.targetSelector, {
        force: action.options?.force,
        noWaitAfter: action.options?.noWaitAfter,
        sourcePosition: action.options?.sourcePosition,
        targetPosition: action.options?.targetPosition,
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      break;

    case "wait":
      await page.waitForSelector(action.selector, {
        state: action.options?.state ?? "visible",
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      break;

    case "waitForTimeout":
      await page.waitForTimeout(action.duration);
      break;

    case "waitForLoadState":
      await page.waitForLoadState(action.state ?? "load", {
        timeout: action.options?.timeout ?? defaultTimeout,
      });
      break;

    default: {
      const _exhaustive: never = action;
      throw new Error(
        `Unknown action type: ${(_exhaustive as InteractionAction).type}`
      );
    }
  }
}

/**
 * Executes a sequence of interactions with error handling
 */
export async function executeInteractions(
  page: Page,
  interactions: InteractionAction[],
  caseId: string
): Promise<void> {
  for (let i = 0; i < interactions.length; i++) {
    const action = interactions[i];
    try {
      await executeAction(page, action);
    } catch (error) {
      const actionDesc = JSON.stringify(action, null, 2);
      const message = `Interaction ${i + 1}/${interactions.length} failed for ${caseId}:\n${actionDesc}\nError: ${error}`;
      console.error(message);
      throw new Error(message);
    }
  }

  // Settle time after interactions
  await page.waitForTimeout(INTERACTION_SETTLE_TIME);
}
