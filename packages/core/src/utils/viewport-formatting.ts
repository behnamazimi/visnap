import type { Viewport } from "@visnap/protocol";

/**
 * Formats a viewport object into a human-readable string
 * @param viewport - The viewport object to format
 * @returns Formatted viewport string or undefined if viewport is not provided
 */
export function formatViewport(viewport?: Viewport): string | undefined {
  if (!viewport) {
    return undefined;
  }

  const { width, height, deviceScaleFactor } = viewport;
  let formatted = `${width}x${height}`;

  if (deviceScaleFactor !== undefined) {
    formatted += `@${deviceScaleFactor}x`;
  }

  return formatted;
}
