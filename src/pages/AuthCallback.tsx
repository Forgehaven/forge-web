import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_URLS } from '../config/apiUrls'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const initiatedRef = useRef(false)

  useEffect(() => {
    if (initiatedRef.current) return
    initiatedRef.current = true

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

        const body = await res.json()

        if (body.status === 'error') {
          setError(`${body.message || 'Authentication failed.'} (redirect_uri: ${window.location.origin}/auth/callback)`)
          return
        }

        const returnPath = sessionStorage.getItem('auth_return_path') || '/games/albion/market-manager'
        sessionStorage.removeItem('auth_return_path')
        window.location.href = returnPath
      } catch {
        setError('Network error during authentication.')
      }
    }

    exchange()
  }, [searchParams])

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0f1117] text-center">
        <p className="text-red-400 mb-4 text-sm max-w-md px-4">{error}</p>
        <a href="/games/albion/market-manager" className="text-[#c4af64] hover:underline text-sm">
          Back to Market Manager
        </a>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0f1117] text-center">
      <div className="w-8 h-8 border-2 border-[#c4af64] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#9ca3af] text-sm mt-4">Authenticating...</p>
    </div>
  )
}
