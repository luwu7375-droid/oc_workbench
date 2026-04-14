import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'OC Workbench',
  description: 'OC 创作工作台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="bg-white text-zinc-900 antialiased font-sans">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
