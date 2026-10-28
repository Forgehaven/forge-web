#!/usr/bin/env node
// Checks underworldlarp.com/rulebooks for new or changed rulebook PDFs against
// src/forge/games/underworld/data/sources.json.
//
//   node scripts/uw-rulebooks.mjs                  report only
//   node scripts/uw-rulebooks.mjs --download DIR   also fetch changed PDFs (+ pdftotext -layout)
//   node scripts/uw-rulebooks.mjs --download DIR --all --write
//                                                  fetch everything and update sources.json
//
// PDFs are overwritten in place upstream, so a change is any difference in
// Last-Modified or size (and sha256 once downloaded), not just the filename version.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const SOURCES = new URL('../src/forge/games/underworld/data/sources.json', import.meta.url)
const args = process.argv.slice(2)
const dlDir = args.includes('--download') ? args[args.indexOf('--download') + 1] : null
const all = args.includes('--all')
const write = args.includes('--write')

const manifest = JSON.parse(fs.readFileSync(SOURCES, 'utf8'))
const today = new Date().toISOString().slice(0, 10)

const html = await (await fetch(manifest.index)).text()
const linked = [...new Set([...html.matchAll(/href="(https:\/\/underworldlarp\.com\/wp-content\/uploads\/[^"]+\.pdf)"/gi)].map(m => m[1]))]

function versionOf(url) {
  return path.basename(url).match(/v?(\d+(?:\.\d+)+)/i)?.[1] ?? null
}

// Same book = same filename once the version number is stripped.
const stem = url => path.basename(url).replace(/[-_ ]?v?\d+(\.\d+)+/i, '').toLowerCase()

let pdftotext = true
const rows = []
for (const url of linked) {
  const head = await fetch(url, { method: 'HEAD' })
  const lastModified = new Date(head.headers.get('last-modified') ?? 0).toISOString().slice(0, 10)
  const bytes = Number(head.headers.get('content-length') ?? 0)
  const known = manifest.rulebooks.find(r => r.url === url) ?? manifest.rulebooks.find(r => stem(r.url) === stem(url))
  const status = !known ? 'NEW' : known.url !== url ? 'NEW VERSION'
    : known.lastModified !== lastModified || known.bytes !== bytes ? 'CHANGED' : 'same'
  const row = { url, known, status, lastModified, bytes, version: versionOf(url), sha256: known?.sha256 ?? null, file: null }

  if (dlDir && (all || status !== 'same')) {
    fs.mkdirSync(dlDir, { recursive: true })
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
    row.file = path.join(dlDir, path.basename(url))
    fs.writeFileSync(row.file, buf)
    row.sha256 = createHash('sha256').update(buf).digest('hex')
    if (known && status === 'same' && known.sha256 !== row.sha256) row.status = 'CHANGED (hash)'
    if (pdftotext) {
      try { execFileSync('pdftotext', ['-layout', row.file, row.file.replace(/\.pdf$/i, '.txt')]) } catch { pdftotext = false }
    }
  }
  rows.push(row)
}

const gone = manifest.rulebooks.filter(r => !linked.includes(r.url) && !rows.some(x => x.known === r))
for (const r of rows) {
  console.log(`${r.status.padEnd(14)} ${(r.known?.title ?? path.basename(r.url)).padEnd(32)} v${r.version ?? '?'}  ${r.lastModified}  ${r.bytes}B${r.file ? `  -> ${r.file}` : ''}`)
}
for (const r of gone) console.log(`GONE           ${r.title} (${r.url})`)
if (dlDir && !pdftotext) console.log('pdftotext not found: PDFs downloaded without text extraction')

if (write) {
  for (const r of rows.filter(x => x.known)) {
    const changed = r.known.sha256 !== r.sha256 || r.known.url !== r.url
    Object.assign(r.known, {
      url: r.url, version: r.version ?? r.known.version, lastModified: r.lastModified, bytes: r.bytes,
      sha256: r.sha256, parsed: changed ? false : r.known.parsed,
    })
  }
  manifest.checked = today
  fs.writeFileSync(SOURCES, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`updated ${SOURCES.pathname}`)
}
