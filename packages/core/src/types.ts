import { type BrowserName } from "./lib/config";

export interface VTTStory {
  id: string;
  title: string;
  kind: string;
  visualTesting: {
    skip?: boolean;
    screenshotTarget?: "story-root" | "body" | string;
    threshold?: number;
    browser?: BrowserName | BrowserName[];
  };
}
