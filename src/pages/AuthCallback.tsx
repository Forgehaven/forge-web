import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_URLS } from '../config/apiUrls'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const errParam = searchParams.get('error')

    if (errParam) {
      const returnPath = sessionStorage.getItem('auth_return_path') || '/games'
      sessionStorage.removeItem('auth_return_path')
      window.location.href = returnPath
      return
    }

    if (!code) {
      Promise.resolve().then(() => setError('No authorization code received from Discord.'))
      return
    }

    let cancelled = false

    async function exchange() {
      try {
        const res = await fetch(`${API_URLS.forgeAPI}/auth/discord/callback`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/auth/callback`,
          }),
        })

        if (cancelled) return
        const body = await res.json()

        if (cancelled) return

        if (body.status === 'error') {
          setError(`${body.message || 'Authentication failed.'} (redirect_uri: ${window.location.origin}/auth/callback)`)
          return
        }

        const returnPath = sessionStorage.getItem('auth_return_path') || '/games/market-manager'
        sessionStorage.removeItem('auth_return_path')
        window.location.href = returnPath
      } catch {
        if (!cancelled) setError('Network error during authentication.')
      }
    }

    exchange()
    return () => { cancelled = true }
  }, [searchParams])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0f1117] text-center">
        <p className="text-red-400 mb-4 text-sm">{error}</p>
        <a href="/games/market-manager" className="text-[#c4af64] hover:underline text-sm">
          Back to Market Manager
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0f1117] text-center">
      <div className="w-6 h-6 border-2 border-[#c4af64] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#9ca3af] text-sm mt-4">Authenticating...</p>
    </div>
  )
}
