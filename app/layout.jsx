import './globals.css'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'

export const metadata = {
  title: 'Reaction Game',
  description: 'Daily Challenge Reaction Game',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
