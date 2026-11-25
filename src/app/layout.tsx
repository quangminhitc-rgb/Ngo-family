/**
 * Root Layout - Áp dụng cho toàn bộ app
 */

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? 'Không gian riêng của gia đình',
  applicationName: APP_NAME,
  // PWA: manifest được sinh tự động từ src/app/manifest.ts tại /manifest.webmanifest
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'black',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f0f0f',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')})()` }} />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
