import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'AI Video Generator',
  description: 'Generate stunning videos using AI technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <AppProvider>
          <div className="min-h-screen">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}