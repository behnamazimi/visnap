import '@/app/global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Fira_Sans } from 'next/font/google';

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={firaSans.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
