import { Routes, Route } from 'react-router-dom'
import { ForgeLayout } from '../../components/ForgeLayout'
import { ToolsSidebar } from './ToolsSidebar'
import { ToolsSettings } from './ToolsSettings'
import { NotFound } from '../../components/NotFound'
import { ToolsBottomBar } from './ToolsBottomBar'
import { ToolsHome } from './ToolsHome'

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
import { FileReader } from './text/FileReader'

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
import { AudioTuner } from './media/AudioTuner'
import { ImgCollage } from './media/ImgCollage'


const toolsHeaderExtra = (
  <a
    href="https://github.com/forgehaven"
    target="_blank"
    rel="noopener noreferrer"
    className="hidden md:block absolute top-3 right-4 text-xs tracking-widest uppercase text-[#3a3d4a] hover:text-[#6b7280] transition-colors z-10"
  >
    FORGEHAVEN Inc.
  </a>
)

export default function ToolsLayout() {
  return (
    <Routes>
      <Route element={
        <ForgeLayout
          title="Tools"
          homePath="/tools"
          sidebar={ToolsSidebar}
          settings={ToolsSettings}
          bottomBar={ToolsBottomBar}
          headerExtra={toolsHeaderExtra}
        />
      }>
        <Route index element={<ToolsHome />} />

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
        <Route path="file-reader" element={<FileReader />} />

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
        <Route path="img-collage" element={<ImgCollage />} />
        <Route path="qr-generator" element={<QrGenerator />} />
        <Route path="video-to-mp3" element={<VideoToMp3 />} />
        <Route path="image-converter" element={<ImageConverter />} />
        <Route path="media-compressor" element={<MediaCompressor />} />
        <Route path="audio-tuner" element={<AudioTuner />} />

        <Route path="*" element={<NotFound backTo="/tools" backLabel="Back to tools" />} />
      </Route>
    </Routes>
  )
}
