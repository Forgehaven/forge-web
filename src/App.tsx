import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { Sidebar } from './components/Sidebar'
import { BottomBar } from './components/BottomBar'

// Layout / shell
import { Home } from './tools/Home'
import { LandingPage } from './tools/LandingPage'
import { NotFound } from './tools/NotFound'
import { NotFoundLanding } from './tools/NotFoundLanding'

// Converters
import { UnitConverter } from './tools/converters/UnitConverter'
import { DiscordTimestamp } from './tools/converters/DiscordTimestamp'
import { BaseConverter } from './tools/converters/BaseConverter'
import { ColorConverter } from './tools/converters/ColorConverter'
import { CurrencyConverter } from './tools/converters/CurrencyConverter'

// Text
import { TextFormatter } from './tools/text/TextFormatter'
import { TextDiff } from './tools/text/TextDiff'
import { TextTranslate } from './tools/text/TextTranslate'
import { RegexTester } from './tools/text/RegexTester'
import { MarkdownPreview } from './tools/text/MarkdownPreview'
import { PdfToEpub } from './tools/text/PdfToEpub'
import { WordCounter } from './tools/text/WordCounter'

// Encoding
import { Base64 } from './tools/encoding/Base64'
import { UrlEncoder } from './tools/encoding/UrlEncoder'
import { JwtDecoder } from './tools/encoding/JwtDecoder'

// Generators
import { HashGenerator } from './tools/generators/HashGenerator'
import { UuidGenerator } from './tools/generators/UuidGenerator'
import { PasswordGenerator } from './tools/generators/PasswordGenerator'
import { LoremIpsum } from './tools/generators/LoremIpsum'

// Sysadmin
import { CronParser } from './tools/sysadmin/CronParser'
import { UnixTimestamp } from './tools/sysadmin/UnixTimestamp'
import { JsonApiTester } from './tools/sysadmin/JsonApiTester'
import { WebhookTester } from './tools/sysadmin/WebhookTester'
import { IpGeoLocation } from './tools/lookups/IpGeoLocation'
import { TimeZoneLookup } from './tools/lookups/TimeZoneLookup'
import { WeatherLookup } from './tools/lookups/WeatherLookup'

// Network
import { CidrCalculator } from './tools/network/CidrCalculator'
import { HttpHeaderInspector } from './tools/network/HttpHeaderInspector'
import { ContrastChecker } from './tools/network/ContrastChecker'
import { UserAgentParser } from './tools/network/UserAgentParser'

// Crypto
import { AesEncryptDecrypt } from './tools/crypto/AesEncryptDecrypt'
import { BcryptTester } from './tools/crypto/BcryptTester'

// Lookups
import { PhoneAreaCode } from './tools/lookups/PhoneAreaCode'

// Media
import { AudioCutter } from './tools/media/AudioCutter'
import { VideoCutter } from './tools/media/VideoCutter'
import { WhiteToAlpha } from './tools/media/WhiteToAlpha'
import { VideoToGif } from './tools/media/VideoToGif'
import { ImgColourPalette } from './tools/media/ImgColourPalette'
import { ImgEditor } from './tools/media/ImgEditor'
import { QrGenerator } from './tools/media/QrGenerator'
import { VideoToMp3 } from './tools/media/VideoToMp3'
import { ImageConverter } from './tools/media/ImageConverter'
import { MediaCompressor } from './tools/media/MediaCompressor'

import './index.css'

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
  useEffect(() => {
    document.title = 'Forge Tools'
    return () => { document.title = 'FORGEHAVEN' }
  }, [])

  return (
    <div className="flex w-full h-full">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <header className="flex md:hidden items-center gap-3 px-4 h-12 bg-[#1a1d27] border-b border-[#2a2d3a] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>
          <Link to="/tools" className="text-[#e2e4ed] font-semibold text-base tracking-wide hover:opacity-75 transition-opacity">
            Forge <span className="text-[#c4af64]">Tools</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0f1117]">
          <div className="px-5 py-6 md:pl-12 md:pr-8 md:py-8">
            <Outlet />
          </div>
        </main>
        <BottomBar />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tools" element={<ForgeLayout />}>
            <Route index element={<Home />} />

            {/* Converters */}
            <Route path="unit-converter" element={<UnitConverter />} />
            <Route path="timestamp-converter" element={<DiscordTimestamp />} />
            <Route path="base-converter" element={<BaseConverter />} />
            <Route path="color-converter" element={<ColorConverter />} />
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
          <Route path="*" element={<NotFoundLanding />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}
