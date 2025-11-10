import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ThemeToggle } from './components/ThemeToggle'
import { useTheme } from './contexts/ThemeContext'
import { useEffect } from 'react'

export default function App() {
  const { resolvedTheme } = useTheme()

  // Apply theme class to document root for CSS variable updates
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  return (
    <div className="min-h-screen p-6 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-colors">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">DAO dApp</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </header>
      
      <main className="space-y-6">
        <div className="p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <h2 className="text-xl font-semibold mb-4">Welcome to DAO Governance</h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            Connect your wallet to interact with the governance system.
          </p>
        </div>
      </main>
    </div>
  )
}
