"use client"

import { useState } from "react"
import { TrendingUp } from "lucide-react"
import type { Document } from "./documents-table"

const PAD = { top: 20, right: 20, bottom: 36, left: 36 }
const CHART_W = 600
const CHART_H = 150
const TOTAL_W = CHART_W + PAD.left + PAD.right
const TOTAL_H = CHART_H + PAD.top + PAD.bottom

const Y_GRIDLINES = [0, 25, 50, 75, 100]

function scoreColor(score: number): string {
  if (score >= 75) return "hsl(var(--primary))"
  if (score >= 50) return "#eab308"
  return "hsl(var(--destructive))"
}

function xFor(i: number, n: number): number {
  return PAD.left + (n === 1 ? CHART_W / 2 : (i / (n - 1)) * CHART_W)
}

function yFor(score: number): number {
  return PAD.top + CHART_H - (score / 100) * CHART_H
}

export function ScoreHistoryChart({ documents }: { documents: Document[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  const chartDocs = [...documents]
    .filter((d) => d.status === "analyzed" && d.score !== null)
    .reverse() // oldest → newest

  if (chartDocs.length < 2) return null

  const n = chartDocs.length
  const pts = chartDocs.map((d, i) => ({
    x: xFor(i, n),
    y: yFor(d.score!),
    doc: d,
  }))

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ")
  const areaPolygon = `${PAD.left},${PAD.top + CHART_H} ${polyline} ${PAD.left + CHART_W},${PAD.top + CHART_H}`

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--card-shadow)]">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Score history</h2>
        <span className="ml-1 text-xs text-muted-foreground">
          {n} {n === 1 ? "analysis" : "analyses"}
        </span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
          className="w-full"
          style={{ height: Math.round(TOTAL_H * 0.55) + "px" }}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Y gridlines + labels */}
          {Y_GRIDLINES.map((v) => {
            const y = yFor(v)
            return (
              <g key={v}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={PAD.left + CHART_W}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={9}
                  fill="currentColor"
                  fillOpacity={0.45}
                >
                  {v}
                </text>
              </g>
            )
          })}

          {/* Area fill */}
          <polygon
            points={areaPolygon}
            fill="hsl(var(--primary))"
            fillOpacity={0.07}
          />

          {/* Trend line */}
          <polyline
            points={polyline}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeOpacity={0.6}
          />

          {/* Hover vertical line */}
          {hovered !== null && (
            <line
              x1={pts[hovered].x}
              y1={PAD.top}
              x2={pts[hovered].x}
              y2={PAD.top + CHART_H}
              stroke="currentColor"
              strokeOpacity={0.15}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )}

          {/* Dots */}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 6 : 4}
              fill={scoreColor(p.doc.score!)}
              stroke="hsl(var(--card))"
              strokeWidth={2}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)}
            />
          ))}

          {/* X-axis date labels — show first, last, and hovered */}
          {pts.map((p, i) => {
            if (i !== 0 && i !== n - 1 && i !== hovered) return null
            return (
              <text
                key={i}
                x={p.x}
                y={PAD.top + CHART_H + 22}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                fontSize={9}
                fill="currentColor"
                fillOpacity={0.45}
              >
                {p.doc.date}
              </text>
            )
          })}

          {/* Tooltip (SVG foreignObject) */}
          {hovered !== null && (() => {
            const p = pts[hovered]
            const TIP_W = 140
            const TIP_H = 56
            const rawX = p.x - TIP_W / 2
            const tipX = Math.max(PAD.left, Math.min(rawX, PAD.left + CHART_W - TIP_W))
            const tipY = p.y - TIP_H - 10 < PAD.top ? p.y + 10 : p.y - TIP_H - 10
            return (
              <foreignObject x={tipX} y={tipY} width={TIP_W} height={TIP_H}>
                <div
                  // @ts-ignore — xmlns required for foreignObject
                  xmlns="http://www.w3.org/1999/xhtml"
                  style={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 11,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    width: TIP_W,
                    boxSizing: "border-box",
                  }}
                >
                  <p style={{ fontWeight: 600, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                    {p.doc.filename}
                  </p>
                  <p style={{ color: "hsl(var(--muted-foreground))", margin: "2px 0 0" }}>
                    {p.doc.date}
                  </p>
                  <p style={{ fontWeight: 700, color: scoreColor(p.doc.score!), margin: "2px 0 0" }}>
                    Score: {p.doc.score}/100
                  </p>
                </div>
              </foreignObject>
            )
          })()}
        </svg>
      </div>
    </div>
  )
}
