/**
 * @fileoverview Mock factory functions for Playwright objects
 */

import type {
  Browser,
  BrowserContext,
  Page,
  ElementHandle,
  BrowserType,
} from "playwright-core";
import { vi } from "vitest";

/**
 * Creates a mock browser type
 */
export function createMockBrowserType(): BrowserType {
  return {
    launch: vi.fn(),
    connectOverCDP: vi.fn(),
    connect: vi.fn(),
    executablePath: vi.fn(),
    launchPersistentContext: vi.fn(),
    name: vi.fn(),
  } as unknown as BrowserType;
}

/**
 * Creates a mock browser instance
 */
export function createMockBrowser(): Browser {
  return {
    newPage: vi.fn(),
    newContext: vi.fn(),
    close: vi.fn(),
    contexts: vi.fn(),
    isConnected: vi.fn(),
    version: vi.fn(),
  } as unknown as Browser;
}

/**
 * Creates a mock browser context
 */
export function createMockBrowserContext(): BrowserContext {
  return {
    newPage: vi.fn(),
    close: vi.fn(),
    addCookies: vi.fn(),
    clearCookies: vi.fn(),
    addInitScript: vi.fn(),
    clearPermissions: vi.fn(),
    grantPermissions: vi.fn(),
    setDefaultNavigationTimeout: vi.fn(),
    setDefaultTimeout: vi.fn(),
    route: vi.fn(),
    unroute: vi.fn(),
    pages: vi.fn(),
    browser: vi.fn(),
    backgroundPages: vi.fn(),
    serviceWorkers: vi.fn(),
    newCDPSession: vi.fn(),
    tracing: vi.fn(),
    request: vi.fn(),
    requestContext: vi.fn(),
    waitForEvent: vi.fn(),
    waitForFunction: vi.fn(),
    exposeFunction: vi.fn(),
    exposeBinding: vi.fn(),
    addLocatorHandler: vi.fn(),
    setExtraHTTPHeaders: vi.fn(),
    setGeolocation: vi.fn(),
    setHTTPCredentials: vi.fn(),
    setOffline: vi.fn(),
    setUserAgent: vi.fn(),
    storageState: vi.fn(),
  } as unknown as BrowserContext;
}

/**
 * Creates a mock page instance
 */
export function createMockPage(): Page {
  return {
    close: vi.fn(),
    evaluate: vi.fn(),
    evaluateHandle: vi.fn(),
    addInitScript: vi.fn(),
    addScriptTag: vi.fn(),
    addStyleTag: vi.fn(),
    check: vi.fn(),
    click: vi.fn(),
    content: vi.fn(),
    context: vi.fn(),
    dblclick: vi.fn(),
    dispatchEvent: vi.fn(),
    dragAndDrop: vi.fn(),
    emulateMedia: vi.fn(),
    fill: vi.fn(),
    focus: vi.fn(),
    frame: vi.fn(),
    frames: vi.fn(),
    getAttribute: vi.fn(),
    getByAltText: vi.fn(),
    getByLabel: vi.fn(),
    getByPlaceholder: vi.fn(),
    getByRole: vi.fn(),
    getByTestId: vi.fn(),
    getByText: vi.fn(),
    getByTitle: vi.fn(),
    goto: vi.fn(),
    hover: vi.fn(),
    innerHTML: vi.fn(),
    innerText: vi.fn(),
    inputValue: vi.fn(),
    isChecked: vi.fn(),
    isDisabled: vi.fn(),
    isEditable: vi.fn(),
    isEnabled: vi.fn(),
    isHidden: vi.fn(),
    isVisible: vi.fn(),
    locator: vi.fn(),
    mainFrame: vi.fn(),
    mouse: vi.fn(),
    page: vi.fn(),
    pdf: vi.fn(),
    press: vi.fn(),
    reload: vi.fn(),
    route: vi.fn(),
    screenshot: vi.fn(),
    selectOption: vi.fn(),
    setChecked: vi.fn(),
    setContent: vi.fn(),
    setDefaultNavigationTimeout: vi.fn(),
    setDefaultTimeout: vi.fn(),
    setExtraHTTPHeaders: vi.fn(),
    setInputFiles: vi.fn(),
    setViewportSize: vi.fn(),
    textContent: vi.fn(),
    title: vi.fn(),
    touchscreen: vi.fn(),
    type: vi.fn(),
    uncheck: vi.fn(),
    unroute: vi.fn(),
    url: vi.fn(),
    video: vi.fn(),
    viewportSize: vi.fn(),
    waitForEvent: vi.fn(),
    waitForFunction: vi.fn(),
    waitForLoadState: vi.fn(),
    waitForSelector: vi.fn(),
    waitForTimeout: vi.fn(),
    waitForURL: vi.fn(),
    keyboard: vi.fn(),
    accessibility: vi.fn(),
    coverage: vi.fn(),
    request: vi.fn(),
  } as unknown as Page;
}

/**
 * Creates a mock element handle
 */
export function createMockElement(): ElementHandle {
  return {
    screenshot: vi.fn(),
    scrollIntoViewIfNeeded: vi.fn(),
    evaluate: vi.fn(),
    evaluateHandle: vi.fn(),
    click: vi.fn(),
    dblclick: vi.fn(),
    fill: vi.fn(),
    focus: vi.fn(),
    getAttribute: vi.fn(),
    hover: vi.fn(),
    innerHTML: vi.fn(),
    innerText: vi.fn(),
    inputValue: vi.fn(),
    isChecked: vi.fn(),
    isDisabled: vi.fn(),
    isEditable: vi.fn(),
    isEnabled: vi.fn(),
    isHidden: vi.fn(),
    isVisible: vi.fn(),
    press: vi.fn(),
    selectOption: vi.fn(),
    setChecked: vi.fn(),
    setInputFiles: vi.fn(),
    tap: vi.fn(),
    textContent: vi.fn(),
    type: vi.fn(),
    uncheck: vi.fn(),
    waitForElementState: vi.fn(),
    waitForSelector: vi.fn(),
    waitForFunction: vi.fn(),
    boundingBox: vi.fn(),
    check: vi.fn(),
    contentFrame: vi.fn(),
    dispatchEvent: vi.fn(),
    dragTo: vi.fn(),
    elementHandle: vi.fn(),
    elementHandles: vi.fn(),
    frameLocator: vi.fn(),
    getByAltText: vi.fn(),
    getByLabel: vi.fn(),
    getByPlaceholder: vi.fn(),
    getByRole: vi.fn(),
    getByTestId: vi.fn(),
    getByText: vi.fn(),
    getByTitle: vi.fn(),
    locator: vi.fn(),
    owner: vi.fn(),
    page: vi.fn(),
    selectText: vi.fn(),
  } as unknown as ElementHandle;
}

/**
 * Creates a mock locator
 */
export function createMockLocator() {
  return {
    screenshot: vi.fn(),
    click: vi.fn(),
    dblclick: vi.fn(),
    fill: vi.fn(),
    focus: vi.fn(),
    hover: vi.fn(),
    press: vi.fn(),
    selectOption: vi.fn(),
    setChecked: vi.fn(),
    setInputFiles: vi.fn(),
    tap: vi.fn(),
    type: vi.fn(),
    uncheck: vi.fn(),
    check: vi.fn(),
    clear: vi.fn(),
    count: vi.fn(),
    first: vi.fn(),
    last: vi.fn(),
    nth: vi.fn(),
    all: vi.fn(),
    and: vi.fn(),
    or: vi.fn(),
    filter: vi.fn(),
    locator: vi.fn(),
    getByAltText: vi.fn(),
    getByLabel: vi.fn(),
    getByPlaceholder: vi.fn(),
    getByRole: vi.fn(),
    getByTestId: vi.fn(),
    getByText: vi.fn(),
    getByTitle: vi.fn(),
    elementHandle: vi.fn(),
    elementHandles: vi.fn(),
    boundingBox: vi.fn(),
    dispatchEvent: vi.fn(),
    dragTo: vi.fn(),
    evaluate: vi.fn(),
    evaluateAll: vi.fn(),
    evaluateHandle: vi.fn(),
    getAttribute: vi.fn(),
    innerHTML: vi.fn(),
    innerText: vi.fn(),
    inputValue: vi.fn(),
    isChecked: vi.fn(),
    isDisabled: vi.fn(),
    isEditable: vi.fn(),
    isEnabled: vi.fn(),
    isHidden: vi.fn(),
    isVisible: vi.fn(),
    page: vi.fn(),
    scrollIntoViewIfNeeded: vi.fn(),
    selectText: vi.fn(),
    textContent: vi.fn(),
    waitFor: vi.fn(),
  };
}

/**
 * Creates a mock route handler
 */
export function createMockRouteHandler() {
  return {
    abort: vi.fn(),
    continue: vi.fn(),
    fulfill: vi.fn(),
    request: vi.fn(),
  };
}

/**
 * Default mock implementations for common scenarios
 */
export const defaultMocks = {
  browserType: createMockBrowserType(),
  browser: createMockBrowser(),
  context: createMockBrowserContext(),
  page: createMockPage(),
  element: createMockElement(),
  locator: createMockLocator(),
  routeHandler: createMockRouteHandler(),
};

/**
 * Sets up default mock implementations
 */
export function setupDefaultMocks() {
  const mocks = defaultMocks;

  // Browser type setup
  (mocks.browserType.launch as any).mockResolvedValue(mocks.browser);

  // Browser setup
  (mocks.browser.newPage as any).mockResolvedValue(mocks.page);
  (mocks.browser.newContext as any).mockResolvedValue(mocks.context);
  (mocks.browser.close as any).mockResolvedValue(undefined);

  // Context setup
  (mocks.context.newPage as any).mockResolvedValue(mocks.page);
  (mocks.context.close as any).mockResolvedValue(undefined);
  (mocks.context.clearCookies as any).mockResolvedValue(undefined);
  (mocks.context.route as any).mockImplementation(() => {});
  (mocks.context.unroute as any).mockImplementation(() => {});

  // Page setup
  (mocks.page.setDefaultTimeout as any).mockResolvedValue(undefined);
  (mocks.page.setViewportSize as any).mockResolvedValue(undefined);
  (mocks.page.goto as any).mockResolvedValue(undefined);
  (mocks.page.waitForLoadState as any).mockResolvedValue(undefined);
  (mocks.page.waitForTimeout as any).mockResolvedValue(undefined);
  (mocks.page.waitForSelector as any).mockResolvedValue(mocks.element);
  (mocks.page.addStyleTag as any).mockResolvedValue(undefined);
  (mocks.page.close as any).mockResolvedValue(undefined);
  (mocks.page.emulateMedia as any).mockResolvedValue(undefined);
  (mocks.page.evaluate as any).mockResolvedValue(undefined);
  (mocks.page.locator as any).mockReturnValue(mocks.locator);

  // Element setup
  (mocks.element.screenshot as any).mockResolvedValue(
    new Uint8Array([1, 2, 3, 4])
  );
  (mocks.element.scrollIntoViewIfNeeded as any).mockResolvedValue(undefined);

  // Locator setup
  (mocks.locator.screenshot as any).mockResolvedValue(
    new Uint8Array([1, 2, 3, 4])
  );

  return mocks;
}
