import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Link, Outlet } from 'react-router-dom'
import { Settings } from './Settings'
import { Sidebar } from '../../components/Sidebar'
import { BottomBar } from '../../components/BottomBar'
import { Modal } from '../../components/Modal'
import { Home } from './Home'
import { NotFound } from './NotFound'

// Converters
import { UnitConverter } from './converters/UnitConverter'
import { XmlJsonConverter } from './converters/XmlJsonConverter'
import { DiscordTimestamp } from './converters/DiscordTimestamp'
import { BaseConverter } from './converters/BaseConverter'
import { ColourConverter } from './converters/ColourConverter'
import { CurrencyConverter } from './converters/CurrencyConverter'

// Text
import { TextFormatter } from './text/TextFormatter'
import { TextDiff } from './text/TextDiff'
import { TextTranslate } from './text/TextTranslate'
import { RegexTester } from './text/RegexTester'
import { MarkdownPreview } from './text/MarkdownPreview'
import { PdfToEpub } from './text/PdfToEpub'
import { WordCounter } from './text/WordCounter'

// Encoding
import { Base64 } from './encoding/Base64'
import { UrlEncoder } from './encoding/UrlEncoder'
import { JwtDecoder } from './encoding/JwtDecoder'

// Generators
import { HashGenerator } from './generators/HashGenerator'
import { UuidGenerator } from './generators/UuidGenerator'
import { PasswordGenerator } from './generators/PasswordGenerator'
import { LoremIpsum } from './generators/LoremIpsum'

// Sysadmin
import { CronParser } from './sysadmin/CronParser'
import { UnixTimestamp } from './sysadmin/UnixTimestamp'
import { JsonApiTester } from './sysadmin/JsonApiTester'
import { WebhookTester } from './sysadmin/WebhookTester'

// Lookups
import { IpGeoLocation } from './lookups/IpGeoLocation'
import { TimeZoneLookup } from './lookups/TimeZoneLookup'
import { WeatherLookup } from './lookups/WeatherLookup'
import { PhoneAreaCode } from './lookups/PhoneAreaCode'

// Network
import { CidrCalculator } from './network/CidrCalculator'
import { HttpHeaderInspector } from './network/HttpHeaderInspector'
import { ContrastChecker } from './network/ContrastChecker'
import { UserAgentParser } from './network/UserAgentParser'

// Crypto
import { AesEncryptDecrypt } from './crypto/AesEncryptDecrypt'
import { BcryptTester } from './crypto/BcryptTester'

// Media
import { AudioCutter } from './media/AudioCutter'
import { VideoCutter } from './media/VideoCutter'
import { WhiteToAlpha } from './media/WhiteToAlpha'
import { VideoToGif } from './media/VideoToGif'
import { ImgColourPalette } from './media/ImgColourPalette'
import { ImgEditor } from './media/ImgEditor'
import { QrGenerator } from './media/QrGenerator'
import { VideoToMp3 } from './media/VideoToMp3'
import { ImageConverter } from './media/ImageConverter'
import { MediaCompressor } from './media/MediaCompressor'

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function ForgeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const sidebarOpenRef = useRef(sidebarOpen)

  useEffect(() => { sidebarOpenRef.current = sidebarOpen }, [sidebarOpen])

  useEffect(() => {
    document.title = 'Forge Tools'
    return () => { document.title = 'FORGEHAVEN' }
  }, [])


  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0]
      touchStartX.current = t.clientX
      touchStartY.current = t.clientY
    }

    function onTouchEnd(e: TouchEvent) {
      if (touchStartX.current === null || touchStartY.current === null) return
      const startX = touchStartX.current
      const startY = touchStartY.current
      touchStartX.current = null
      touchStartY.current = null

      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = Math.abs(t.clientY - startY)

      if (dy > 80) return  // primarily vertical scroll — ignore

      if (!sidebarOpenRef.current && startX <= 24 && dx > 48) {
        setSidebarOpen(true)
      } else if (sidebarOpenRef.current && dx < -48) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <div className="flex w-full h-full">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpenSettings={() => { setSettingsOpen(true); setSidebarOpen(false) }} />

      <div className="relative flex flex-col flex-1 overflow-hidden min-w-0">
        <header className="flex md:hidden items-center px-4 h-12 bg-[#1a1d27] border-b border-[#2a2d3a] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
          <Link to="/tools" className="absolute left-1/2 -translate-x-1/2 text-[#e2e4ed] font-semibold text-base tracking-wide hover:opacity-75 transition-opacity">
            Forge<span className="text-[#c4af64]">Tools</span>
          </Link>
        </header>
        <a
          href="https://github.com/forgehaven"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:block absolute top-3 right-4 text-xs tracking-widest uppercase text-[#3a3d4a] hover:text-[#6b7280] transition-colors z-10"
        >
          FORGEHAVEN Inc.
        </a>

        <main className="flex-1 overflow-y-auto bg-[#0f1117]">
          <div className="px-5 py-6 md:pl-12 md:pr-8 md:py-8">
            <Outlet />
          </div>
        </main>
        <BottomBar />
      </div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings">
        <Settings />
      </Modal>
    </div>
  )
}

export default function ToolsLayout() {
  return (
    <Routes>
      <Route element={<ForgeLayout />}>
        <Route index element={<Home />} />

        {/* Converters */}
        <Route path="xml-json" element={<XmlJsonConverter />} />
        <Route path="unit-converter" element={<UnitConverter />} />
        <Route path="timestamp-converter" element={<DiscordTimestamp />} />
        <Route path="base-converter" element={<BaseConverter />} />
        <Route path="colour-converter" element={<ColourConverter />} />
        <Route path="currency-converter" element={<CurrencyConverter />} />

        {/* Text */}
        <Route path="text-formatter" element={<TextFormatter />} />
        <Route path="text-diff" element={<TextDiff />} />
        <Route path="text-translate" element={<TextTranslate />} />
        <Route path="regex-tester" element={<RegexTester />} />
        <Route path="markdown-preview" element={<MarkdownPreview />} />
        <Route path="pdf-to-epub" element={<PdfToEpub />} />
        <Route path="word-counter" element={<WordCounter />} />

        {/* Encoding */}
        <Route path="base64" element={<Base64 />} />
        <Route path="url-encoder" element={<UrlEncoder />} />
        <Route path="jwt-decoder" element={<JwtDecoder />} />

        {/* Generators */}
        <Route path="hash-generator" element={<HashGenerator />} />
        <Route path="uuid-generator" element={<UuidGenerator />} />
        <Route path="password-generator" element={<PasswordGenerator />} />
        <Route path="lorem-ipsum" element={<LoremIpsum />} />

        {/* Sysadmin */}
        <Route path="cron-parser" element={<CronParser />} />
        <Route path="unix-timestamp" element={<UnixTimestamp />} />
        <Route path="json-api" element={<JsonApiTester />} />
        <Route path="webhook-tester" element={<WebhookTester />} />

        {/* Network */}
        <Route path="cidr-calculator" element={<CidrCalculator />} />
        <Route path="http-headers" element={<HttpHeaderInspector />} />
        <Route path="contrast-checker" element={<ContrastChecker />} />
        <Route path="user-agent" element={<UserAgentParser />} />

        {/* Crypto */}
        <Route path="aes" element={<AesEncryptDecrypt />} />
        <Route path="bcrypt" element={<BcryptTester />} />

        {/* Lookups */}
        <Route path="ip-geolocation" element={<IpGeoLocation />} />
        <Route path="phone-area-code" element={<PhoneAreaCode />} />
        <Route path="timezone-lookup" element={<TimeZoneLookup />} />
        <Route path="weather" element={<WeatherLookup />} />

        {/* Media */}
        <Route path="audio-cutter" element={<AudioCutter />} />
        <Route path="video-cutter" element={<VideoCutter />} />
        <Route path="white-to-alpha" element={<WhiteToAlpha />} />
        <Route path="video-to-gif" element={<VideoToGif />} />
        <Route path="img-colour-palette" element={<ImgColourPalette />} />
        <Route path="img-editor" element={<ImgEditor />} />
        <Route path="qr-generator" element={<QrGenerator />} />
        <Route path="video-to-mp3" element={<VideoToMp3 />} />
        <Route path="image-converter" element={<ImageConverter />} />
        <Route path="media-compressor" element={<MediaCompressor />} />

        <Route path="*" element={<NotFound inTools />} />
      </Route>
    </Routes>
  )
}
