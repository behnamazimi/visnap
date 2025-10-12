# @vividiff/reporter

A comprehensive reporting package for Vividiff visual regression testing, providing both JSON and HTML report generation with advanced image comparison features.

## Features

- **JSON Reports**: Machine-readable test results with detailed metadata
- **HTML Reports**: Interactive, visual reports with modern UI
- **Image Comparison**: Side-by-side, slider, and overlay comparison modes
- **Filtering & Search**: Real-time filtering by status, browser, and text search
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Offline Support**: Self-contained HTML reports with embedded assets
- **Alpine.js Integration**: Lightweight, framework-free interactivity

## Installation

```bash
npm install @vividiff/reporter
```

## Quick Start

### JSON Reports

```typescript
import { JsonReporter } from "@vividiff/reporter";

const reporter = new JsonReporter();
const result = await reporter.generate(testResult, {
  screenshotDir: "./vividiff",
  pretty: true
});
```

### HTML Reports

```typescript
import { HtmlReporter } from "@vividiff/reporter";

const reporter = new HtmlReporter();
const result = await reporter.generate(testResult, {
  screenshotDir: "./vividiff",
  title: "My Test Report"
});
```

## API Reference

### JsonReporter

Generates machine-readable JSON reports from test results.

#### Methods

##### `generate(result: TestResult, options: JsonReporterOptions): Promise<string>`

Generates a JSON report and returns the output path or JSON string.

**Parameters:**
- `result`: Test result from Vividiff core
- `options`: Configuration options

**Returns:** Promise resolving to output path (if file) or JSON string (if stdout)

#### Options

```typescript
interface JsonReporterOptions {
  outputPath?: string;        // Output file path (optional)
  screenshotDir: string;      // Screenshot directory path
  pretty?: boolean;          // Pretty-print JSON (default: true)
}
```

#### Example

```typescript
import { JsonReporter } from "@vividiff/reporter";

const reporter = new JsonReporter();

// Generate file report
const filePath = await reporter.generate(testResult, {
  outputPath: "./reports/test-results.json",
  screenshotDir: "./vividiff",
  pretty: true
});

// Generate stdout report
const jsonString = await reporter.generate(testResult, {
  screenshotDir: "./vividiff",
  pretty: false
});
console.log(jsonString);
```

### HtmlReporter

Generates interactive HTML reports with visual comparison features.

#### Methods

##### `generate(result: TestResult, options: HtmlReporterOptions): Promise<string>`

Generates an HTML report and returns the output path.

**Parameters:**
- `result`: Test result from Vividiff core
- `options`: Configuration options

**Returns:** Promise resolving to output file path

#### Options

```typescript
interface HtmlReporterOptions {
  outputPath?: string;        // Output file path (optional)
  screenshotDir: string;      // Screenshot directory path
  title?: string;            // Report title (default: "Vividiff Test Report")
}
```

#### Example

```typescript
import { HtmlReporter } from "@vividiff/reporter";

const reporter = new HtmlReporter();

// Generate default report
const reportPath = await reporter.generate(testResult, {
  screenshotDir: "./vividiff"
});

// Generate custom report
const customReportPath = await reporter.generate(testResult, {
  outputPath: "./reports/custom-report.html",
  screenshotDir: "./vividiff",
  title: "My Custom Test Report"
});
```

## HTML Report Features

### Image Comparison Modes

The HTML report includes three interactive comparison modes:

#### 1. Side by Side
- Displays base, current, and diff images side by side
- Perfect for quick visual comparison
- Responsive grid layout

#### 2. Slider View
- Interactive slider to compare base and current images
- Drag the slider to reveal differences
- Ideal for detailed pixel-level comparison

#### 3. Overlay View
- Overlays current image on base image
- Adjustable opacity slider
- Great for identifying subtle changes

### Filtering & Search

- **Status Filter**: Show all, passed, or failed tests
- **Browser Filter**: Filter by specific browser
- **Text Search**: Search by test ID, title, or kind
- **Real-time Updates**: Filters apply instantly without page reload

### Responsive Design

- **Desktop**: Full-featured layout with all comparison modes
- **Tablet**: Optimized for touch interaction
- **Mobile**: Single-column layout with touch-friendly controls

### Auto-Expansion

- Failed tests automatically expand for immediate attention
- Passed tests remain collapsed for clean overview
- Manual expand/collapse for all tests

## Report Structure

### JSON Report Format

```typescript
interface ReportData {
  success: boolean;
  outcome: RunOutcome;
  failures: Array<{
    id: string;
    reason: string;
    diffPercentage?: number;
  }>;
  captureFailures: Array<{
    id: string;
    error: string;
  }>;
  timestamp: string;
  duration?: number;
  testCases?: Array<TestCaseDetail>;
}
```

### HTML Report Structure

The HTML report is a self-contained file that includes:

- **Dashboard**: Summary statistics and metadata
- **Filter Bar**: Search and filter controls
- **Test List**: Expandable test cases with comparison views
- **Assets**: Embedded CSS and JavaScript (Alpine.js)

## Integration Examples

### CLI Integration

```typescript
// In your CLI command
import { JsonReporter, HtmlReporter } from "@vividiff/reporter";

// Generate both reports
const jsonReporter = new JsonReporter();
const htmlReporter = new HtmlReporter();

const jsonPath = await jsonReporter.generate(result, {
  outputPath: "./reports/results.json",
  screenshotDir: result.config?.screenshotDir || "./vividiff",
  pretty: true
});

const htmlPath = await htmlReporter.generate(result, {
  outputPath: "./reports/report.html",
  screenshotDir: result.config?.screenshotDir || "./vividiff",
  title: "Visual Test Results"
});
```

### Programmatic Usage

```typescript
import { runVisualTests } from "@vividiff/core";
import { JsonReporter, HtmlReporter } from "@vividiff/reporter";

async function runTestsWithReports() {
  // Run tests
  const result = await runVisualTests({
    // ... test configuration
  });

  // Generate reports
  const jsonReporter = new JsonReporter();
  const htmlReporter = new HtmlReporter();

  const [jsonPath, htmlPath] = await Promise.all([
    jsonReporter.generate(result, {
      screenshotDir: "./vividiff",
      pretty: true
    }),
    htmlReporter.generate(result, {
      screenshotDir: "./vividiff",
      title: "Test Results"
    })
  ]);

  console.log(`JSON report: ${jsonPath}`);
  console.log(`HTML report: ${htmlPath}`);
}
```

## Configuration

### Screenshot Directory Structure

The reporter expects the following directory structure:

```
screenshot-dir/
├── base/           # Baseline images
│   ├── test-1.png
│   └── test-2.png
├── current/        # Current test images
│   ├── test-1.png
│   └── test-2.png
├── diff/           # Diff images (for failed tests)
│   └── test-2.png
└── report.html     # Generated HTML report
```

### Image Formats

Supported image formats:
- PNG (recommended)
- JPEG/JPG
- WebP
- GIF

## Browser Support

The HTML report works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- **Alpine.js**: Lightweight JavaScript framework for interactivity
- **No build step required**: Works directly in the browser

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### TypeScript

The package is written in TypeScript and includes full type definitions.

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please see the main Vividiff repository for contribution guidelines.

## Support

For issues and questions:
- GitHub Issues: [vividiff/issues](https://github.com/vividiff/issues)
- Documentation: [vividiff.dev](https://vividiff.dev)