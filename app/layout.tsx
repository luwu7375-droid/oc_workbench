import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OC Workbench',
  description: 'OC 创作工作台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className={`${geist.className} bg-white text-zinc-900 antialiased`}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
