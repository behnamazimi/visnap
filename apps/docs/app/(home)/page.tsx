import Link from 'next/link';
import { Github, BookOpen, Play } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center text-center px-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-4xl font-bold tracking-tight">
          ViviDiff
        </h1>
        <p className="mb-8 text-lg text-fd-muted-foreground">
          Catch visual changes before they reach production. Automated screenshot testing for modern web applications.
        </p>
        
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            <BookOpen className="h-4 w-4" />
            View Documentation
          </Link>
          <Link
            href="https://github.com/behnamazimi/vividiff"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-fd-border px-6 py-3 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </Link>
        </div>

        <div className="text-sm text-fd-muted-foreground">
          <p className="mb-2">Quick start:</p>
          <code className="rounded bg-fd-muted px-2 py-1 text-xs">
            npx vividiff init
          </code>
        </div>
      </div>
    </main>
  );
}
