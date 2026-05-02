/**
 * Copies the Cursor parent-chat JSONL into public/ for the demo page.
 * Set CURSOR_TRANSCRIPT to override the source path.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '..', 'public', 'chat-transcript.jsonl')

const defaultSrc = join(
  homedir(),
  '.cursor/projects/Users-josephmalicki-newtest/agent-transcripts/5db33cb4-8700-4869-997b-c8e8ce25961a/5db33cb4-8700-4869-997b-c8e8ce25961a.jsonl',
)

const srcPath = process.env.CURSOR_TRANSCRIPT || defaultSrc

if (!existsSync(srcPath)) {
  console.warn(`Skip transcript sync: file not found (${srcPath})`)
  process.exit(0)
}

function onlyValidJsonLines(text) {
  const lines = text.split('\n')
  const kept = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    try {
      JSON.parse(t)
      kept.push(t)
    } catch {
      // Skip truncated last line while Cursor is still writing
    }
  }
  return kept.join('\n') + '\n'
}

const raw = readFileSync(srcPath, 'utf8')
const cleaned = onlyValidJsonLines(raw)
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, cleaned, 'utf8')
console.log(`Synced ${cleaned.split('\n').filter(Boolean).length} transcript rows → public/chat-transcript.jsonl`)
