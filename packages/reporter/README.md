# @visnap/reporter

Generate JSON and HTML reports for ViSnap test results.

## Installation

```bash
npm install @visnap/reporter
```

## JSON Reporter

Generate machine-readable JSON reports:

```typescript
import { JsonReporter } from "@visnap/reporter";

const reporter = new JsonReporter();
const result = await reporter.generate(testResult, {
  screenshotDir: "./visnap",
  pretty: true
});
```

**Options:**
- `outputPath?: string` - Output file path (optional)
- `screenshotDir: string` - Screenshot directory path
- `pretty?: boolean` - Pretty-print JSON (default: true)

## HTML Reporter

Generate interactive HTML reports with visual comparison:

```typescript
import { HtmlReporter } from "@visnap/reporter";

const reporter = new HtmlReporter();
const result = await reporter.generate(testResult, {
  screenshotDir: "./visnap",
  title: "My Test Report"
});
```

**Options:**
- `outputPath?: string` - Output file path (optional)
- `screenshotDir: string` - Screenshot directory path
- `title?: string` - Report title (default: "VISNAP Test Report")

## HTML Report Features

- **Image Comparison** - Side-by-side, slider, and overlay comparison modes
- **Filtering & Search** - Filter by status, browser, and text search
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Auto-Expansion** - Failed tests automatically expand for immediate attention

## Integration Example

```typescript
import { runVisualTests } from "@visnap/core";
import { JsonReporter, HtmlReporter } from "@visnap/reporter";

async function runTestsWithReports() {
  const result = await runVisualTests({
    // ... test configuration
  });

  const jsonReporter = new JsonReporter();
  const htmlReporter = new HtmlReporter();

  const [jsonPath, htmlPath] = await Promise.all([
    jsonReporter.generate(result, {
      screenshotDir: "./visnap",
      pretty: true
    }),
    htmlReporter.generate(result, {
      screenshotDir: "./visnap",
      title: "Test Results"
    })
  ]);

  console.log(`JSON report: ${jsonPath}`);
  console.log(`HTML report: ${htmlPath}`);
}
```

## License

MIT