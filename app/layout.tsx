import type { Metadata } from 'next'
import { Big_Shoulders, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import Script from 'next/script'
import { CSPostHogProvider } from './providers'
import { site } from '@/content/site'
import { asset } from '@/lib/base-path'
import { STATIC_MODE_SCRIPT } from '@/lib/mission/static-mode-script'
import './globals.css'

const display = Big_Shoulders({ subsets: ['latin'], axes: ['opsz'], variable: '--font-display', display: 'swap' })
const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sans', display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: site.metaTitle,
  description: site.metaDescription,
  // metadata URLs don't get basePath either; without asset() these pointed at the domain root and 404'd on Pages
  icons: {
    icon: [
      { url: asset('/icon-light-32x32.png'), media: '(prefers-color-scheme: light)' },
      { url: asset('/icon-dark-32x32.png'), media: '(prefers-color-scheme: dark)' },
      { url: asset('/icon.svg'), type: 'image/svg+xml' },
    ],
    apple: asset('/apple-icon.png'),
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the head script below stamps data-static on <html> before React hydrates
    <html lang="en" className={`dark ${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: STATIC_MODE_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <CSPostHogProvider>{children}</CSPostHogProvider>
        <Script defer src="https://cloud.umami.is/script.js" data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID} />
      </body>
    </html>
  )
}
