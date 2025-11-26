import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pensieve 3D Map',
  description: '3D visualization of Pensieve project relationships',
  icons: {
    icon: '/PensieveGraphLogo.webp',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}

