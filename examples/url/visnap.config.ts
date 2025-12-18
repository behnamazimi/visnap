import { type VisualTestingToolConfig } from "@visnap/protocol";

const config: VisualTestingToolConfig = {
  adapters: {
    browser: {
      name: "@visnap/playwright-adapter",
      options: {
        browser: "chromium",
      },
    },
    testCase: [
      {
        name: "@visnap/url-adapter",
        options: {
          urls: [
            {
              id: "home",
              url: "http://localhost:5174/",
              title: "Home Page",
            },
            {
              id: "about",
              url: "http://localhost:5174/about.html",
              title: "About Page",
            },
            {
              id: "contact",
              url: "http://localhost:5174/contact.html",
              title: "Contact Page",
            },
          ],
        },
      },
    ],
  },
  comparison: {
    core: "odiff",
    threshold: 0.1,
    diffColor: "#00ff00",
  },
  viewport: {
    desktop: { width: 1920, height: 1080 },
  },
  runtime: {
    maxConcurrency: 4,
    quiet: false,
  },
  reporter: {
    html: true,
    json: true,
  },
};

export default config;
