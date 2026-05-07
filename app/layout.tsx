import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShippingCow Admin',
  description: 'Internal admin portal for ShippingCow.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=DM+Sans:wght@400;500;700&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
