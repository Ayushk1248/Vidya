import type { Metadata } from 'next'
import './globals.css'
import './ui-polish.css'
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
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
