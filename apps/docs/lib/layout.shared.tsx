import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/visnap-logo-light.png"
            alt=""
            width={180}
            height={48}
            className="dark:hidden h-6 w-auto sm:h-7 md:h-8"
            sizes="(min-width: 768px) 128px, (min-width: 640px) 112px, 96px"
            priority
          />
          <Image
            src="/visnap-logo-dark.png"
            alt=""
            width={180}
            height={48}
            className="hidden dark:inline h-6 w-auto sm:h-7 md:h-8"
            sizes="(min-width: 768px) 128px, (min-width: 640px) 112px, 96px"
            priority
          />
        </>
      ),
    },
    // see https://fumadocs.dev/docs/ui/navigation/links
    links: [],
    githubUrl: 'https://github.com/behnamazimi/visnap',
  };
}
