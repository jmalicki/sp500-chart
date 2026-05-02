import * as d3 from 'd3'
import { useEffect, useRef, useState } from 'react'

export type GspcPoint = { t: string; c: number }

export type GspcPayload = {
  symbol: string
  name: string
  range: string
  updatedAt: string
  series: GspcPoint[]
}

type Row = { date: Date; close: number }

function parseSeries(payload: GspcPayload): Row[] {
  return payload.series.map((d) => ({
    date: new Date(d.t + 'T12:00:00'),
    close: d.c,
  }))
}

export function Sp500Chart() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [payload, setPayload] = useState<GspcPayload | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const brushDomainRef = useRef<[Date, Date] | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}gspc.json`)
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        const j = (await res.json()) as GspcPayload
        if (!cancelled) setPayload(j)
      } catch (e) {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : 'Failed to load data')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!payload?.series?.length || !wrapRef.current) return

    const data = parseSeries(payload)
    const el = wrapRef.current
    const svg = d3.select(el).select<SVGSVGElement>('svg')

    const margin = { top: 16, right: 24, bottom: 112, left: 56 }
    const contextHeight = 72
    const focusRatio = 0.72

    const xFull = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .nice()

    brushDomainRef.current ??= xFull.domain() as [Date, Date]

    function render() {
      if (!wrapRef.current) return
      const width = wrapRef.current.clientWidth
      const totalH = Math.max(360, Math.round(width * 0.55))
      const focusH = Math.round(totalH * focusRatio)
      const innerW = width - margin.left - margin.right
      const innerFocusH = focusH - margin.top - 24
      const contextTop = margin.top + innerFocusH + 32
      const innerCtxH = contextHeight - 18

      xFull.range([0, innerW])

      const yFull = d3
        .scaleLinear()
        .domain([d3.min(data, (d) => d.close)! * 0.98, d3.max(data, (d) => d.close)! * 1.02])
        .nice()
        .range([innerCtxH, 0])

      svg.attr('width', width).attr('height', totalH).selectAll('*').remove()
      d3.select(el).selectAll('.sp5-tooltip').remove()

      const brushDomain = brushDomainRef.current ?? (xFull.domain() as [Date, Date])
      const xBrush = d3.scaleTime().domain(xFull.domain()).range([0, innerW])

      const gRoot = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

      const clipId = `clip-${Math.random().toString(36).slice(2)}`
      gRoot
        .append('defs')
        .append('clipPath')
        .attr('id', clipId)
        .append('rect')
        .attr('width', innerW)
        .attr('height', innerFocusH)

      const gFocus = gRoot.append('g')
      const gFocusChart = gFocus.append('g').attr('clip-path', `url(#${clipId})`)
      const gxFocus = gFocus.append('g').attr('transform', `translate(0,${innerFocusH})`)
      const gyFocus = gFocus.append('g')

      const gCtx = gRoot.append('g').attr('transform', `translate(0,${contextTop})`)
      const gCtxPath = gCtx.append('g')
      const gxCtx = gCtx.append('g').attr('transform', `translate(0,${innerCtxH})`)
      const brushG = gCtx.append('g').attr('class', 'brush')

      const tooltip = d3
        .select(el)
        .append('div')
        .attr('class', 'sp5-tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('opacity', 0)

      const lineFull = d3
        .line<Row>()
        .x((d) => xFull(d.date))
        .y((d) => yFull(d.close))

      gCtxPath
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'var(--chart-muted)')
        .attr('stroke-width', 1.25)
        .attr('d', lineFull)

      gxCtx
        .call(d3.axisBottom(xFull).ticks(6).tickSizeOuter(0))
        .call((g) => g.select('.domain').attr('stroke', 'var(--border)'))

      let vis = data.filter((d) => d.date >= brushDomain[0] && d.date <= brushDomain[1])
      if (vis.length < 2) {
        brushDomainRef.current = xFull.domain() as [Date, Date]
        vis = data.slice()
      }
      const domain = brushDomainRef.current as [Date, Date]
      const x = d3.scaleTime().domain(domain).range([0, innerW])
      const y = d3
        .scaleLinear()
        .domain([
          d3.min(vis, (d) => d.close)! * 0.997,
          d3.max(vis, (d) => d.close)! * 1.003,
        ])
        .nice()
        .range([innerFocusH, 0])

      const lineFocus = d3
        .line<Row>()
        .x((d) => x(d.date))
        .y((d) => y(d.close))

      gFocusChart
        .append('path')
        .datum(vis)
        .attr('fill', 'none')
        .attr('stroke', 'var(--chart-line)')
        .attr('stroke-width', 2)
        .attr('d', lineFocus)

      gxFocus
        .call(d3.axisBottom(x).ticks(width < 520 ? 4 : 8).tickSizeOuter(0))
        .call((g) => g.select('.domain').attr('stroke', 'var(--border)'))

      gyFocus
        .call(
          d3
            .axisLeft(y)
            .ticks(6)
            .tickFormat((v) => d3.format(',.0f')(v as number))
            .tickSizeOuter(0),
        )
        .call((g) => g.select('.domain').attr('stroke', 'var(--border)'))

      const bisect = d3.bisector<Row, Date>((d) => d.date).center

      const hoverG = gFocus.append('g').style('display', 'none')
      hoverG.append('line').attr('class', 'sp5-hover-line').attr('stroke', 'var(--accent)').attr('stroke-dasharray', '4 4')
      const hoverDot = hoverG.append('circle').attr('r', 4).attr('fill', 'var(--accent)')

      const focusOverlay = gFocus
        .append('rect')
        .attr('width', innerW)
        .attr('height', innerFocusH)
        .attr('fill', 'transparent')
        .style('cursor', 'crosshair')

      focusOverlay.on('mousemove', (event) => {
        const [mx] = d3.pointer(event)
        const x0 = x.invert(mx)
        const idx = bisect(vis, x0, 1)
        const d0 = vis[idx - 1]
        const d1 = vis[idx]
        const d =
          d1 && d0
            ? x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()
              ? d1
              : d0
            : d0 ?? d1
        if (!d) return
        hoverG.style('display', null)
        const lineEl = hoverG.select<SVGLineElement>('.sp5-hover-line')
        lineEl.attr('x1', x(d.date)).attr('x2', x(d.date)).attr('y1', 0).attr('y2', innerFocusH)
        hoverDot.attr('cx', x(d.date)).attr('cy', y(d.close))

        const fmt = d3.timeFormat('%b %d, %Y')
        tooltip
          .style('opacity', 1)
          .html(
            `<strong>${fmt(d.date)}</strong><br/>Close: ${d.close.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}`,
          )

        const box = el.getBoundingClientRect()
        const tipNode = tooltip.node() as HTMLDivElement
        const tw = tipNode.offsetWidth
        const th = tipNode.offsetHeight
        const px = event.clientX - box.left + 12
        const py = event.clientY - box.top - th - 12
        const clampedX = Math.min(Math.max(8, px), box.width - tw - 8)
        const clampedY = Math.max(8, py)
        tooltip.style('transform', `translate(${clampedX}px,${clampedY}px)`)
      })

      focusOverlay.on('mouseleave', () => {
        hoverG.style('display', 'none')
        tooltip.style('opacity', 0)
      })

      const brush = d3
        .brushX()
        .extent([
          [0, 0],
          [innerW, innerCtxH],
        ])
        .on('end', (event) => {
          if (!event.sourceEvent) return
          const sel = event.selection as [number, number] | null
          if (!sel) {
            brushDomainRef.current = xFull.domain() as [Date, Date]
          } else {
            brushDomainRef.current = [xBrush.invert(sel[0]), xBrush.invert(sel[1])]
          }
          render()
        })

      const defaultSel: [number, number] = [xBrush(domain[0]), xBrush(domain[1])]
      brushG.call(brush)
      brushG.call(brush.move, defaultSel)
    }

    render()
    const ro = new ResizeObserver(() => render())
    ro.observe(el)
    return () => {
      ro.disconnect()
      svg.selectAll('*').remove()
      d3.select(el).selectAll('.sp5-tooltip').remove()
    }
  }, [payload])

  if (loadError) {
    return (
      <div className="sp5-panel sp5-error">
        <p>Could not load <code>/gspc.json</code>.</p>
        <p className="sp5-muted">{loadError}</p>
        <p className="sp5-muted">
          Run <code>npm run data</code> to generate data, then refresh.
        </p>
      </div>
    )
  }

  if (!payload) {
    return (
      <div className="sp5-panel">
        <p className="sp5-muted">Loading S&amp;P 500 series…</p>
      </div>
    )
  }

  return (
    <div className="sp5-chart-wrap" ref={wrapRef}>
      <svg className="sp5-svg" role="img" aria-label={`${payload.name} price chart`} />
    </div>
  )
}
