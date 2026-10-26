import type { Metadata } from 'next'
import './globals.css'

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
        {children}
      </body>
    </html>
  )
}