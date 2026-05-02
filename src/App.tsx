import { Sp500Chart } from './Sp500Chart'
import './App.css'

function App() {
  return (
    <main className="sp5-app">
      <header className="sp5-header">
        <h1>S&amp;P 500</h1>
        <p className="sp5-lede">
          Interactive daily closes (<code>^GSPC</code>) from Yahoo Finance. No API keys: data is
          baked in at build time so the page stays static and avoids browser CORS.
        </p>
      </header>
      <Sp500Chart />
      <footer className="sp5-footer">
        <p>
          Drag the brush on the lower timeline to zoom the main chart. Hover for crosshair and
          tooltip.
        </p>
        <p className="sp5-muted">
          Refresh data: <code>npm run data</code> then <code>npm run build</code> (or commit the
          updated <code>public/gspc.json</code>).
        </p>
      </footer>
    </main>
  )
}

export default App
