import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Source Map Cloud - AI Query Engine',
  description: 'Integrated AI Query Engine with Google Gemini Models',
  keywords: ['AI', 'Query Engine', 'Gemini', 'LLM', 'Cloud'],
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
              Source Map Cloud
            </a>
            <div className="flex items-center gap-6">
              <a
                href="/"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/details"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Details
              </a>
            </div>
          </div>
        </nav>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
