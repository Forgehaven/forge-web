import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function NotFoundLanding() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/forgehaven.css'
    link.id = 'forgehaven-css-404'
    document.head.appendChild(link)

    document.body.classList.add('fh-page', 'is-preload')
    link.onload = () => setTimeout(() => document.body.classList.remove('is-preload'), 100)

    return () => {
      document.body.classList.remove('fh-page', 'is-preload', 'is-article-visible')
      document.getElementById('forgehaven-css-404')?.remove()
    }
  }, [])

  return (
    <>
      <div id="wrapper">
        <header id="header">
          <div className="logo">
            <img src="/images/logo.png" alt="Forgehaven" />
          </div>
          <div className="content">
            <div className="inner" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
              <p>Oops! This doesn't exist!</p>
            </div>
          </div>
          <nav>
            <ul>
              <li>
                <Link to="/" style={{ borderBottom: 'none' }}>← Home</Link>
              </li>
            </ul>
          </nav>
        </header>

        <footer id="footer">
          <p className="footer">
            <a href="https://github.com/forgehaven" target="_blank" rel="noopener noreferrer">
              FORGEHAVEN Inc.
            </a>
          </p>
        </footer>
      </div>
      <div id="bg" />
    </>
  )
}
