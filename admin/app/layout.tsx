import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminShell } from '@/components/AdminShell';

import './globals.css';

export const metadata: Metadata = { title: 'إدارة دَرْسي', robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500&family=IBM+Plex+Sans+Arabic:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
