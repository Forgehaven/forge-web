import { Link } from 'react-router-dom'
import { useForgehavenStyles } from '../hooks/useForgehavenStyles'

export function NotFoundLanding() {
  const ready = useForgehavenStyles()
  if (!ready) return null

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
