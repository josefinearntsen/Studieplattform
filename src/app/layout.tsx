import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Studieplattform',
  description: 'Din personlige studieplattform for NTNU',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  );
}
