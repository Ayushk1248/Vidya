import type { Metadata } from 'next'
import './globals.css'
import './premium.css'
import {GeistSans} from 'geist/font/sans'
import {PresentationProvider} from '@/components/presentation'
import {LanguageProvider} from '@/components/language'

export const metadata: Metadata = {
  title: 'VIDYA | SIH26263',
  description: 'Synthetic APAAR-based student data management prototype',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} antialiased`}>
        <LanguageProvider><PresentationProvider>{children}</PresentationProvider></LanguageProvider>
      </body>
    </html>
  )
}
