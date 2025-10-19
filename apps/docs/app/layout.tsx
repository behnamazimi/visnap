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
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        
        {/* Android Chrome Icons */}
        <link rel="icon" href="/favicon/android-chrome-192x192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/favicon/android-chrome-512x512.png" sizes="512x512" type="image/png" />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/favicon/site.webmanifest" />
        
        <title>ViSnap - Easy visual testing for UI</title>
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
