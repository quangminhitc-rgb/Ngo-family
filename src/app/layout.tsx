/**
 * Root Layout - Áp dụng cho toàn bộ app
 */

import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi',
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'}`,
  },
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? 'Không gian riêng của gia đình',
  viewport: 'width=device-width, initial-scale=1',
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
