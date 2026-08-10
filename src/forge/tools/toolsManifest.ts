import type { ComponentType } from 'react'

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

// Data
import { QrDataXfer } from './data/QrDataXfer'

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

export type ToolEntry = { path: string; label: string; Component: ComponentType }
export type ToolSection = { section: string; tools: ToolEntry[] }

const T = '/tools'

// Single registry: ToolsLayout generates the routes and ToolsSidebar the nav from this.
export const TOOL_SECTIONS: ToolSection[] = [
  {
    section: 'Converters',
    tools: [
      { path: `${T}/unit-converter`, label: 'Unit Converter', Component: UnitConverter },
      { path: `${T}/timestamp-converter`, label: 'Discord Timestamp', Component: DiscordTimestamp },
      { path: `${T}/base-converter`, label: 'Base Converter', Component: BaseConverter },
      { path: `${T}/colour-converter`, label: 'Colour Converter', Component: ColourConverter },
      { path: `${T}/currency-converter`, label: 'Currency Converter', Component: CurrencyConverter },
    ],
  },
  {
    section: 'Text',
    tools: [
      { path: `${T}/xml-json`, label: 'XML ↔ JSON', Component: XmlJsonConverter },
      { path: `${T}/text-formatter`, label: 'Text Formatter', Component: TextFormatter },
      { path: `${T}/text-diff`, label: 'Text Diff', Component: TextDiff },
      { path: `${T}/text-translate`, label: 'Text Translate', Component: TextTranslate },
      { path: `${T}/regex-tester`, label: 'Regex Tester', Component: RegexTester },
      { path: `${T}/markdown-preview`, label: 'Markdown Preview', Component: MarkdownPreview },
      { path: `${T}/pdf-to-epub`, label: 'PDF to EPUB', Component: PdfToEpub },
      { path: `${T}/word-counter`, label: 'Word Counter', Component: WordCounter },
      { path: `${T}/file-reader`, label: 'File Reader', Component: FileReader },
    ],
  },
  {
    section: 'Media',
    tools: [
      { path: `${T}/audio-cutter`, label: 'Audio Cutter', Component: AudioCutter },
      { path: `${T}/video-cutter`, label: 'Video Cutter', Component: VideoCutter },
      { path: `${T}/white-to-alpha`, label: 'White to Alpha', Component: WhiteToAlpha },
      { path: `${T}/video-to-gif`, label: 'Video to GIF', Component: VideoToGif },
      { path: `${T}/img-colour-palette`, label: 'Img Colour Palette', Component: ImgColourPalette },
      { path: `${T}/img-editor`, label: 'Img Editor', Component: ImgEditor },
      { path: `${T}/img-collage`, label: 'Img Collage', Component: ImgCollage },
      { path: `${T}/qr-generator`, label: 'QR Generator', Component: QrGenerator },
      { path: `${T}/video-to-mp3`, label: 'Video to MP3', Component: VideoToMp3 },
      { path: `${T}/image-converter`, label: 'Image Converter', Component: ImageConverter },
      { path: `${T}/media-compressor`, label: 'Media Compressor', Component: MediaCompressor },
      { path: `${T}/audio-tuner`, label: 'Audio Tuner', Component: AudioTuner },
    ],
  },
  {
    section: 'Lookups',
    tools: [
      { path: `${T}/ip-geolocation`, label: 'IP Geolocation', Component: IpGeoLocation },
      { path: `${T}/phone-area-code`, label: 'Phone Area Code', Component: PhoneAreaCode },
      { path: `${T}/timezone-lookup`, label: 'City Time Zones', Component: TimeZoneLookup },
      { path: `${T}/weather`, label: 'Weather Lookup', Component: WeatherLookup },
    ],
  },
  {
    section: 'Encoding',
    tools: [
      { path: `${T}/base64`, label: 'Base64', Component: Base64 },
      { path: `${T}/url-encoder`, label: 'URL Encoder', Component: UrlEncoder },
      { path: `${T}/jwt-decoder`, label: 'JWT Decoder', Component: JwtDecoder },
    ],
  },
  {
    section: 'Generators',
    tools: [
      { path: `${T}/hash-generator`, label: 'Hash Generator', Component: HashGenerator },
      { path: `${T}/uuid-generator`, label: 'UUID Generator', Component: UuidGenerator },
      { path: `${T}/password-generator`, label: 'Password Generator', Component: PasswordGenerator },
      { path: `${T}/lorem-ipsum`, label: 'Lorem Ipsum', Component: LoremIpsum },
    ],
  },
  {
    section: 'Sysadmin',
    tools: [
      { path: `${T}/cron-parser`, label: 'Cron Parser', Component: CronParser },
      { path: `${T}/unix-timestamp`, label: 'Unix Timestamp', Component: UnixTimestamp },
      { path: `${T}/json-api`, label: 'JSON API Tester', Component: JsonApiTester },
      { path: `${T}/webhook-tester`, label: 'Webhook Tester', Component: WebhookTester },
    ],
  },
  {
    section: 'Network',
    tools: [
      { path: `${T}/cidr-calculator`, label: 'CIDR Calculator', Component: CidrCalculator },
      { path: `${T}/http-headers`, label: 'HTTP Headers', Component: HttpHeaderInspector },
      { path: `${T}/contrast-checker`, label: 'Contrast Checker', Component: ContrastChecker },
      { path: `${T}/user-agent`, label: 'User Agent Parser', Component: UserAgentParser },
    ],
  },
  {
    section: 'Crypto',
    tools: [
      { path: `${T}/aes`, label: 'AES Encrypt / Decrypt', Component: AesEncryptDecrypt },
      { path: `${T}/bcrypt`, label: 'Bcrypt Tester', Component: BcryptTester },
    ],
  },
  {
    section: 'Data',
    tools: [
      { path: `${T}/qr-data-xfer`, label: 'QR Data Transfer', Component: QrDataXfer },
    ],
  },
]

export const ALL_TOOLS = TOOL_SECTIONS.flatMap(s => s.tools)
