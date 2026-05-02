import { ChatTranscript } from './ChatTranscript'
import { Sp500Chart } from './Sp500Chart'
import './App.css'

function App() {
  return (
    <main className="sp5-app sp5-demo">
      <header className="sp5-demo-hero">
        <p className="sp5-demo-kicker">End-to-end demo</p>
        <h1>From sketch to shipped UI</h1>
        <p className="sp5-lede">
          This page shows a real Cursor session: the hand-drawn spec, the full agent transcript, and
          the interactive chart that was built from it. Same static deploy consumers can try
          live—no API keys in the browser.
        </p>
      </header>

      <section className="sp5-demo-step" aria-labelledby="demo-step-1">
        <h2 id="demo-step-1" className="sp5-demo-step-title">
          <span className="sp5-step-num" aria-hidden>
            1
          </span>
          Initial prompt
        </h2>
        <p className="sp5-step-copy">
          The only “brief” was this photo of a whiteboard sketch: Yahoo Finance → S&amp;P 500 → D3 +
          React static page, interactive, no API keys.
        </p>
        <figure className="sp5-demo-figure">
          <img
            src={`${import.meta.env.BASE_URL}original-sketch.png`}
            alt="Whiteboard sketch: MAKE THIS APP with Yahoo Finance, SP 500, D3 JS plus React static page, INTERACTIVE, and NO API KEYS"
            loading="eager"
            className="sp5-demo-sketch"
          />
          <figcaption className="sp5-muted">Original JPEG from the chat (unchanged).</figcaption>
        </figure>
      </section>

      <section className="sp5-demo-step" aria-labelledby="demo-step-2">
        <h2 id="demo-step-2" className="sp5-demo-step-title">
          <span className="sp5-step-num" aria-hidden>
            2
          </span>
          Build conversation
        </h2>
        <p className="sp5-step-copy">
          Exported Cursor agent transcript (<code>chat-transcript.jsonl</code>). Text messages are
          verbatim; tool calls are expandable so readers can skim or inspect inputs.
        </p>
        <ChatTranscript />
      </section>

      <section className="sp5-demo-step" aria-labelledby="demo-step-3">
        <h2 id="demo-step-3" className="sp5-demo-step-title">
          <span className="sp5-step-num" aria-hidden>
            3
          </span>
          Result
        </h2>
        <p className="sp5-step-copy">
          Interactive daily closes for <code>^GSPC</code>: brush the lower window to zoom, hover for
          crosshair and tooltip. Data is fetched at build time from Yahoo’s public chart endpoint and
          baked into <code>gspc.json</code>.
        </p>
        <Sp500Chart />
        <footer className="sp5-footer">
          <p className="sp5-muted">
            To refresh the chart data or transcript, run <code>npm run data</code>, copy a new
            export to <code>public/chat-transcript.jsonl</code>, then <code>npm run build</code> and
            deploy.
          </p>
        </footer>
      </section>
    </main>
  )
}

export default App
