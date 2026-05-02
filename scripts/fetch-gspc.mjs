/**
 * Downloads S&P 500 (^GSPC) daily closes from Yahoo Finance (no API key).
 * Run at build time so the static site avoids browser CORS to Yahoo.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '..', 'public', 'gspc.json')

const RANGE = '5y'
const URL = `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=${RANGE}`

async function main() {
  const res = await fetch(URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; SP500StaticChart/1.0; +https://example.local)',
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`Yahoo chart request failed: ${res.status} ${res.statusText}`)
  }
  const j = await res.json()
  const result = j?.chart?.result?.[0]
  if (!result) {
    throw new Error('Unexpected Yahoo response: missing chart.result[0]')
  }
  const ts = result.timestamp ?? []
  const closes = result.indicators?.quote?.[0]?.close ?? []
  const series = []
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i]
    if (c == null || Number.isNaN(c)) continue
    const tSec = ts[i]
    series.push({
      t: new Date(tSec * 1000).toISOString().slice(0, 10),
      c: Number(c),
    })
  }
  const meta = result.meta ?? {}
  const payload = {
    symbol: meta.symbol ?? '^GSPC',
    name: meta.longName ?? meta.shortName ?? 'S&P 500',
    range: RANGE,
    updatedAt: new Date().toISOString(),
    series,
  }
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(payload), 'utf8')
  console.log(`Wrote ${series.length} points to public/gspc.json`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
