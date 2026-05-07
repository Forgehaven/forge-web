declare module 'dotmsg' {
  class Attachment {
    getFilename(): string
    getContent(): Uint8Array
  }
  class DotMsgParser {
    parseBuffer(data: Uint8Array): Promise<void>
    getSubject(): string | undefined
    getSenderName(): string | undefined
    getSenderEmail(): string | undefined
    getTo(): string | undefined
    getCC(): string[] | undefined
    getBCC(): string[] | undefined
    getSentDate(): string | undefined
    getReceivedDate(): string | undefined
    getTextContent(): string | undefined
    getHTMLContent(): string | undefined
    getAttachments(): Attachment[]
  }
  export { DotMsgParser, Attachment }
}
