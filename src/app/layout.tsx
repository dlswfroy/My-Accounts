import type { Metadata } from 'next';
import './globals.css';
import { AppWrapper } from '@/components/layout/AppWrapper';
import { TransactionProvider } from '@/components/providers/TransactionProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'আমার হিসাব - My Accounts',
  description: 'সহজ ও সুন্দর ব্যক্তিগত হিসাব ব্যবস্থাপক',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/20">
        <TransactionProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
          <Toaster />
        </TransactionProvider>
      </body>
    </html>
  );
}