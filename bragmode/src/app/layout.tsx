import type { Metadata } from 'next';
import { Playfair_Display, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { PHProvider } from './providers';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FIFA HERITAGE | Claim Your Legacy',
  description: 'Lock your football takes. Secure your supporter number. Earn bragging rights forever in the Sovereign Vault.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${hanken.variable} dark h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface font-sans select-none">
        <PHProvider>
          <div className="flex-1 flex flex-col">{children}</div>
        </PHProvider>
      </body>
    </html>
  );
}
