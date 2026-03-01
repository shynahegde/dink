export const metadata = {
  title: 'DINK — Pickleball Tournament Manager',
  description: 'Your personal assistant for tournament pickleball. Schedule, score, find courts, and manage partners.',
  keywords: 'pickleball, tournament, DUPR, partner management, court finder',
  openGraph: {
    title: 'DINK — Pickleball Tournament Manager',
    description: 'Your personal assistant for tournament pickleball.',
    type: 'website',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#22c55e',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DINK',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body style={{ margin: 0, background: '#f9fafb' }}>
        {children}
      </body>
    </html>
  );
}
