import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AdminShortcut } from '@/components/AdminShortcut';
import { ThemeProvider } from '@/components/ThemeProvider';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const SITE_URL = 'https://techwithbaljeet.web.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'TechWithBaljeet', template: '%s | TechWithBaljeet' },
  description: 'Android & Kotlin development insights by Baljeet Singh — coroutines, architecture, Jetpack Compose, and more.',
  authors: [{ name: 'Baljeet Singh', url: 'https://medium.com/@ibaljeet' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'TechWithBaljeet',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'TechWithBaljeet' }],
  },
  twitter: { card: 'summary_large_image', creator: '@baljeet_dev', site: '@baljeet_dev' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: SITE_URL, types: { 'application/rss+xml': `${SITE_URL}/rss.xml` } },
  verification: {},
};

// Anti-FOUC: apply theme class BEFORE React hydrates
const ANTI_FOUC = `(function(){try{var t=localStorage.getItem('theme')||'dark';var r=t==='system'?(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;document.documentElement.classList.add(r);}catch(e){}})()`;

// Site-wide JSON-LD
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'TechWithBaljeet',
      description: 'Android & Kotlin development insights',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#author`,
      name: 'Baljeet Singh',
      url: SITE_URL,
      sameAs: [
        'https://twitter.com/baljeet_dev',
        'https://medium.com/@ibaljeet',
        'https://github.com/ibaljeet',
      ],
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: 'TechWithBaljeet',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-default.png` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FOUC }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <AdminShortcut />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

