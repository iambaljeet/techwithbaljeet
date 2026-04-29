import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AdminShortcut } from '@/components/AdminShortcut';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://techwithbaljeet.web.app'),
  title: { default: 'TechWithBaljeet', template: '%s | TechWithBaljeet' },
  description: 'Android & Kotlin development insights by Baljeet Singh — coroutines, architecture, Jetpack Compose, and more.',
  authors: [{ name: 'Baljeet Singh', url: 'https://medium.com/@ibaljeet' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://techwithbaljeet.web.app',
    siteName: 'TechWithBaljeet',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'TechWithBaljeet' }],
  },
  twitter: { card: 'summary_large_image', creator: '@baljeet_dev' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AdminShortcut />
        {children}
      </body>
    </html>
  );
}
