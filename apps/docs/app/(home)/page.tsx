import Link from 'next/link';
import { Github, BookOpen } from 'lucide-react';
import Image from 'next/image';
import AnimatedBlobs from './animated-blobs';

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col justify-center text-center px-4 py-16 md:py-32 overflow-hidden">
      <AnimatedBlobs />
      
      {/* Grid background with fade effect - Light mode (black grid) */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)',
        }}
      />
      
      {/* Grid background with fade effect - Dark mode (white grid) */}
      <div 
        className="absolute inset-0 opacity-[0.02] hidden dark:block"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%)',
        }}
      />
      
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-6 flex justify-center">
          <Image
            src="/visnap-logo-light.png"
            alt=""
            width={250}
            height={62}
            className="dark:hidden w-[250px] h-auto"
            sizes="250px"
          />
          <Image
            src="/visnap-logo-dark.png"
            alt=""
            width={250}
            height={62}
            className="hidden dark:inline w-[250px] h-auto"
            sizes="250px"
          />
        </div>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight">See visual changes before you merge</h1>
        <p className="mb-8 text-lg text-fd-muted-foreground">
          ViSnap takes screenshots of your UI, compares them to a baseline, and highlights what changed. Fast feedback for layout, color, and spacing regressions.
        </p>
        
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            <BookOpen className="h-4 w-4" />
            Get Started
          </Link>
          <Link
            href="https://github.com/behnamazimi/visnap"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-fd-border px-6 py-3 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </div>

        <div className="text-sm text-fd-muted-foreground">
          <p className="mb-2">Quick start:</p>
          <code className="rounded bg-fd-muted px-2 py-1 text-xs">
            npx visnap init
          </code>
        </div>
      </div>
    </main>
  );
}
