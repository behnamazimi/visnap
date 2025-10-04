import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock Storybook server responses
  http.get("http://localhost:6006/index.json", () => {
    return HttpResponse.json({
      stories: {
        "example-button--primary": {
          id: "example-button--primary",
          title: "Example/Button",
          name: "Primary",
          importPath: "./src/stories/Button.stories.ts",
          tags: ["story"],
          type: "story",
        },
        "example-button--secondary": {
          id: "example-button--secondary",
          title: "Example/Button",
          name: "Secondary",
          importPath: "./src/stories/Button.stories.ts",
          tags: ["story"],
          type: "story",
        },
        "example-header--logged-in": {
          id: "example-header--logged-in",
          title: "Example/Header",
          name: "Logged In",
          importPath: "./src/stories/Header.stories.ts",
          tags: ["story"],
          type: "story",
        },
      },
    });
  }),

  // Mock Storybook iframe responses
  http.get("http://localhost:6006/iframe.html", () => {
    return HttpResponse.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Storybook</title>
        </head>
        <body>
          <div id="storybook-root"></div>
          <script>
            window.__STORYBOOK_STORY_STORE__ = {
              getStories: () => [
                {
                  id: 'example-button--primary',
                  title: 'Example/Button',
                  name: 'Primary',
                  visualTesting: { skip: false, threshold: 0.1 }
                },
                {
                  id: 'example-button--secondary',
                  title: 'Example/Button',
                  name: 'Secondary',
                  visualTesting: { skip: false, threshold: 0.1 }
                }
              ]
            };
          </script>
        </body>
      </html>
    `);
  }),

  // Mock file system operations
  http.get("http://localhost:6006/assets/*", () => {
    return HttpResponse.text("mock asset content");
  }),
];
