import { useEffect, useState } from 'react'

type ContentPart =
  | { type: 'text'; text?: string }
  | { type: 'tool_use'; name?: string; input?: unknown }
  | { type: string; [key: string]: unknown }

type TranscriptRow = {
  role: string
  message?: { content?: ContentPart[] }
}

function extractUserPlainText(text: string): string {
  return text
    .replace(/\[Image\][\s\S]*?<\/image_files>/i, '')
    .replace(/<user_query>\s*/gi, '')
    .replace(/<\/user_query>/gi, '')
    .trim()
}

export function ChatTranscript() {
  const [rows, setRows] = useState<TranscriptRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}chat-transcript.jsonl`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(`${res.status}`)
        const text = await res.text()
        const parsed: TranscriptRow[] = []
        for (const line of text.split('\n')) {
          const t = line.trim()
          if (!t) continue
          try {
            parsed.push(JSON.parse(t) as TranscriptRow)
          } catch {
            parsed.push({ role: 'parse_error', message: { content: [{ type: 'text', text: t }] } })
          }
        }
        if (!cancelled) setRows(parsed)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <p className="sp5-muted">
        Could not load transcript (<code>chat-transcript.jsonl</code>): {error}
      </p>
    )
  }

  if (!rows.length) {
    return <p className="sp5-muted">Loading transcript…</p>
  }

  return (
    <ol className="sp5-transcript">
      {rows.map((row, i) => (
        <li key={i} className={`sp5-transcript__turn sp5-transcript__turn--${row.role}`}>
          <span className="sp5-transcript__role">{row.role}</span>
          <div className="sp5-transcript__body">
            {(row.message?.content ?? []).map((part, j) => {
              if (part.type === 'text' && typeof part.text === 'string') {
                let body =
                  row.role === 'user' ? extractUserPlainText(part.text) : part.text
                if (row.role === 'user' && !body.trim()) {
                  body = '(Image / attachment hand-off — see step 1 for the sketch.)'
                }
                if (!body.trim()) return null
                return (
                  <pre key={j} className="sp5-transcript__text">
                    {body}
                  </pre>
                )
              }
              if (part.type === 'tool_use') {
                const name = typeof part.name === 'string' ? part.name : 'tool'
                const inputJson =
                  part.input !== undefined
                    ? JSON.stringify(part.input, null, 2)
                    : '(no input)'
                return (
                  <details key={j} className="sp5-transcript__tool">
                    <summary>
                      Tool: <code>{name}</code>
                    </summary>
                    <pre className="sp5-transcript__tool-input">{inputJson}</pre>
                  </details>
                )
              }
              return (
                <pre key={j} className="sp5-transcript__text sp5-transcript__raw">
                  {JSON.stringify(part, null, 2)}
                </pre>
              )
            })}
          </div>
        </li>
      ))}
    </ol>
  )
}
