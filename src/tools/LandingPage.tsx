import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

type ArticleId = 'contact' | null

// Animation delay matching the original jQuery main.js
const DELAY = 325

export function LandingPage() {
  // Phase tracks where we are in the show/hide animation sequence
  const [articleBodyClass, setArticleBodyClass] = useState(false) // body.fh-page.is-article-visible
  const [mainVisible, setMainVisible]     = useState(false)       // #main display
  const [headerHidden, setHeaderHidden]   = useState(false)       // #header display:none
  const [footerHidden, setFooterHidden]   = useState(false)       // #footer display:none
  const [currentArticle, setCurrentArticle] = useState<ArticleId>(null) // article display
  const [articleActive, setArticleActive]   = useState(false)     // article.active

  const locked = useRef(false)
  const [cssReady, setCssReady] = useState(false)

  // Mount: inject forgehaven CSS, manage font-size, add body classes — all removed on unmount
  useEffect(() => {
    document.body.classList.add('fh-page', 'is-preload')

    const prevFontSize = document.documentElement.style.fontSize

    function applyFontSize() {
      const w = window.innerWidth
      if (w <= 360)       document.documentElement.style.fontSize = '10pt'
      else if (w <= 736)  document.documentElement.style.fontSize = '11pt'
      else if (w <= 1680) document.documentElement.style.fontSize = '12pt'
      else                document.documentElement.style.fontSize = '16pt'
    }

    applyFontSize()
    window.addEventListener('resize', applyFontSize)

    // Inject stylesheet — only render page content once it's loaded so
    // the is-preload CSS transition fires properly instead of raw HTML flashing
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/forgehaven.css'
    link.id = 'forgehaven-css'
    link.onload = () => {
      setCssReady(true)
      setTimeout(() => document.body.classList.remove('is-preload'), 100)
    }
    document.head.appendChild(link)

    return () => {
      window.removeEventListener('resize', applyFontSize)
      document.documentElement.style.fontSize = prevFontSize
      document.body.classList.remove('fh-page', 'is-preload', 'is-article-visible')
      // Keep the CSS link in the DOM — NotFoundLanding reuses it and the fh-page
      // class removal above is enough to prevent it affecting the tools section.
    }
  }, [])

  // Keep body.is-article-visible in sync
  useEffect(() => {
    if (articleBodyClass) {
      document.body.classList.add('is-article-visible')
    } else {
      document.body.classList.remove('is-article-visible')
    }
  }, [articleBodyClass])

  function showArticle(id: ArticleId) {
    if (locked.current) return
    locked.current = true

    // Already showing an article — swap
    if (articleBodyClass) {
      setArticleActive(false)
      setTimeout(() => {
        setCurrentArticle(null)
        setTimeout(() => {
          setCurrentArticle(id)
          setTimeout(() => {
            setArticleActive(true)
            setTimeout(() => { locked.current = false }, DELAY)
          }, 25)
        }, DELAY)
      }, DELAY)
      return
    }

    // First open
    setArticleBodyClass(true)
    setTimeout(() => {
      setHeaderHidden(true)
      setFooterHidden(true)
      setMainVisible(true)
      setCurrentArticle(id)
      setTimeout(() => {
        setArticleActive(true)
        setTimeout(() => { locked.current = false }, DELAY)
      }, 25)
    }, DELAY)
  }

  function hideArticle() {
    if (locked.current || !articleBodyClass) return
    locked.current = true

    setArticleActive(false)
    setTimeout(() => {
      setCurrentArticle(null)
      setMainVisible(false)
      setHeaderHidden(false)
      setFooterHidden(false)
      setTimeout(() => {
        setArticleBodyClass(false)
        setTimeout(() => { locked.current = false }, DELAY)
      }, 25)
    }, DELAY)
  }

  // ESC closes article
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && articleBodyClass) hideArticle()
    }
    window.addEventListener('keyup', onKey)
    return () => window.removeEventListener('keyup', onKey)
  }, [articleBodyClass]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!cssReady) return null

  return (
    <>
      <div
        id="wrapper"
        onClick={() => { if (articleBodyClass) hideArticle() }}
      >
        <header id="header" style={headerHidden ? { display: 'none' } : undefined}>
          <div className="logo">
            <img src="/images/logo.png" alt="Forgehaven" />
          </div>
          <div className="content">
            <div className="inner">
              <h1>FORGEHAVEN</h1>
              <p>software design, engineering, and fabrication</p>
            </div>
          </div>
          <nav>
            <ul>
              <li>
                <a
                  href="#contact"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); showArticle('contact') }}
                >
                  Contact
                </a>
              </li>
              <li>
                <Link to="/tools" onClick={e => e.stopPropagation()}>
                  Tools
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        <div id="main" style={{ display: mainVisible ? 'flex' : 'none' }}>
          <article
            id="contact"
            className={currentArticle === 'contact' && articleActive ? 'active' : ''}
            style={{ display: currentArticle === 'contact' ? 'block' : 'none' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="major">Contact</h2>
            <p><a href="mailto:contact@forgehaven.io">contact@forgehaven.io</a></p>
            <p>Ottawa ON Canada</p>
            <div className="close" onClick={hideArticle} />
          </article>
        </div>

        <footer id="footer" style={footerHidden ? { display: 'none' } : undefined}>
          <p className="footer">
            <a
              href="https://github.com/forgehaven"
              target="_blank"
              rel="noopener noreferrer"
            >
              FORGEHAVEN Inc.
            </a>
          </p>
        </footer>
      </div>

      <div id="bg" />
    </>
  )
}
