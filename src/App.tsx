import { useRef, useEffect, useState, Fragment, type ReactNode } from 'react'
import { arc, pie, select, interpolate } from 'd3'
import { Button, Link } from 'react-aria-components'
import './App.css'

/* ── FadeIn: intersection-triggered enter animation ───────────────────────── */
function FadeIn({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold: 0.08 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ── AnimatedCovenantFlow: lifecycle states light up sequentially ─────────── */
function AnimatedCovenantFlow() {
  const [active, setActive] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || !alive) return
      obs.disconnect()
      const runCycle = () => {
        if (!alive) return
        let step = 0
        const advance = () => {
          if (!alive) return
          setActive(step)
          if (step < 4) {
            step++
            setTimeout(advance, 900)
          } else {
            setTimeout(() => {
              if (!alive) return
              setActive(-1)
              setTimeout(() => { if (alive) runCycle() }, 500)
            }, 2800)
          }
        }
        setTimeout(advance, 400)
      }
      runCycle()
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => { alive = false; obs.disconnect() }
  }, [])

  const states = [
    { name: 'DRAFT',   cls: 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400', label: 'configure' },
    { name: 'OPEN',    cls: 'border-blue-400/70 text-blue-400 bg-blue-950/30',    label: 'join' },
    { name: 'ACTIVE',  cls: 'border-violet-500/70 text-violet-300 bg-violet-950/30', label: 'contribute' },
    { name: 'LOCKED',  cls: 'border-amber-500/70 text-amber-300 bg-amber-950/30', label: 'settle' },
    { name: 'SETTLED', cls: 'border-green-500/70 text-green-300 bg-green-950/30', label: '✓' },
  ]

  return (
    <div ref={ref} className="flex items-center justify-center gap-0 flex-wrap">
      {states.map((s, i) => (
        <div key={s.name} className="flex items-center">
          <div
            className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 min-w-[80px] transition-all duration-500
              ${active >= i ? s.cls : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 bg-transparent'}
              ${active === i ? 'scale-[1.07] shadow-lg' : ''}`}
          >
            <span className="text-xs font-mono font-semibold">{s.name}</span>
            <span className="text-[10px] opacity-60 mt-0.5">{s.label}</span>
          </div>
          {i < states.length - 1 && (
            <div className="relative w-8 h-4 shrink-0 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 32 16" fill="none">
                <path
                  d="M2 8h24M20 3l6 5-6 5"
                  stroke={active > i ? '#8b5cf6' : '#374151'}
                  className="transition-all duration-500"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              {active === i && (
                <span
                  className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-violet-400 -translate-y-1/2"
                  style={{ animation: 'dotTravel 600ms linear forwards' }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── SettlementDonut: D3 arc/pie, entrance animation on scroll-in ─────────── */
const DONUT_DATA = [
  { name: 'Protocol Eng', value: 2580, color: '#8b5cf6', tier: 'core' },
  { name: 'Security',     value: 720,  color: '#38bdf8', tier: 'core' },
  { name: 'Reviewer',     value: 465,  color: '#fbbf24', tier: 'review' },
  { name: 'Feature Eng',  value: 360,  color: '#4ade80', tier: 'feature' },
  { name: 'Writer',       value: 350,  color: '#94a3b8', tier: 'docs' },
]

function SettlementDonut() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.3 })
    if (svgRef.current) obs.observe(svgRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || !svgRef.current) return
    const W = 260, H = 260, outer = 105, inner = 62
    const svg = select(svgRef.current)
    svg.selectAll('*').remove()
    const g = svg.append('g').attr('transform', `translate(${W / 2},${H / 2})`)

    const pieGen = pie<typeof DONUT_DATA[0]>().value(d => d.value).sort(null)
    const arcGen = arc()
    const arcBig = arc()
    const slices = pieGen(DONUT_DATA)

    slices.forEach((d, i) => {
      let startTime = 0
      const delay = i * 100
      const duration = 700

      const path = g.append('path')
        .attr('fill', d.data.color)
        .attr('opacity', 0.85)
        .style('cursor', 'pointer')
        .on('mouseover', function () {
          select(this).attr('d', arcBig({ innerRadius: inner, outerRadius: outer + 8, startAngle: d.startAngle, endAngle: d.endAngle, padAngle: d.padAngle }) ?? '')
        })
        .on('mouseout', function () {
          select(this).attr('d', arcGen({ innerRadius: inner, outerRadius: outer, startAngle: d.startAngle, endAngle: d.endAngle, padAngle: d.padAngle }) ?? '')
        })

      const frame = (now: number) => {
        if (!startTime) startTime = now
        const elapsed = now - startTime
        if (elapsed < delay) { requestAnimationFrame(frame); return }
        const t = Math.min(1, (elapsed - delay) / duration)
        const ease = 1 - Math.pow(1 - t, 3)
        const endA = interpolate(d.startAngle, d.endAngle)(ease)
        path.attr('d', arcGen({ innerRadius: inner, outerRadius: outer, startAngle: d.startAngle, endAngle: endA, padAngle: d.padAngle }) ?? '')
        if (t < 1) requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    })

    g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.3em')
      .attr('fill', '#e2e8f0').attr('font-size', '20').attr('font-weight', '600').text('4,475')
    g.append('text').attr('text-anchor', 'middle').attr('dy', '1.1em')
      .attr('fill', '#64748b').attr('font-size', '11').text('ink tokens')
  }, [visible])

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
      <svg ref={svgRef} width={260} height={260} />
      <div className="space-y-2.5">
        {DONUT_DATA.map(d => (
          <div key={d.name} className="flex items-center gap-3 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="w-28 text-gray-700 dark:text-gray-300">{d.name}</span>
            <span className="text-gray-400 text-xs w-14">[{d.tier}]</span>
            <span className="font-mono text-gray-600 dark:text-gray-400">{d.value.toLocaleString()} ink</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── TypewriterCode: typewriter effect triggered on scroll-in ─────────────── */
function TypewriterCode() {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0) // 0=wait 1=typing1 2=pause 3=typing2 4=done
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const CMD1 = 'go build ./...'
  const CMD2 = 'ACP_ADDR=:8080 ./acp-server'

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setPhase(1); obs.disconnect() }
    }, { threshold: 0.4 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (phase === 1) {
      if (text1.length < CMD1.length) {
        const t = setTimeout(() => setText1(CMD1.slice(0, text1.length + 1)), 65)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setPhase(2), 420)
      return () => clearTimeout(t)
    }
    if (phase === 2) {
      const t = setTimeout(() => setPhase(3), 220)
      return () => clearTimeout(t)
    }
    if (phase === 3) {
      if (text2.length < CMD2.length) {
        const t = setTimeout(() => setText2(CMD2.slice(0, text2.length + 1)), 58)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setPhase(4), 300)
      return () => clearTimeout(t)
    }
  }, [phase, text1, text2])

  return (
    <div ref={ref} className="font-mono text-sm bg-gray-900 dark:bg-gray-950 text-green-400 rounded-xl p-5 max-w-sm mx-auto text-left mb-8 space-y-1">
      <p className="text-gray-500">{'# build & run'}</p>
      <p className="min-h-[1.25rem]">
        {text1}
        <span className={phase === 1 ? 'animate-pulse' : 'opacity-0'}>▋</span>
      </p>
      {phase >= 2 && (
        <p className="min-h-[1.25rem]">
          {text2}
          <span className={phase === 3 ? 'animate-pulse' : 'opacity-0'}>▋</span>
        </p>
      )}
      {phase === 4 && <p className="text-green-600 text-xs mt-1">✓ server started on :8080</p>}
    </div>
  )
}

/* ── GitTwinDiagram: git events ↔ ACP tool calls ──────────────────────────── */
function GitTwinDiagram() {
  const rows = [
    { git:'git push',        acp:'propose_passage',             sub:'draft pending' },
    { git:'PR merged',       acp:'approve_draft',               sub:'tokens awarded' },
    { git:'git tag v1.0',    acp:'generate_settlement_output',  sub:'settlement record created' },
    { git:'settlement hash', acp:'git notes anchor (ed25519)',  sub:'Layer 2 proof · signed anchor' },
  ]
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="grid grid-cols-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="px-5 py-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Git Repo</span>
          <span className="text-xs text-gray-400">source of truth for code</span>
        </div>
        <div className="px-5 py-3 flex items-center gap-2 border-l border-gray-100 dark:border-gray-800">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-xs font-semibold text-violet-500 uppercase tracking-widest">ACP Covenant</span>
          <span className="text-xs text-gray-400">source of truth for value</span>
        </div>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-2 border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
          <div className="px-5 py-3.5 font-mono text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span className="text-gray-400 dark:text-gray-600">$</span>{r.git}
          </div>
          <div className="px-5 py-3.5 border-l border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-violet-400 text-xs">→</span>
              <span className="font-mono text-sm text-violet-700 dark:text-violet-300">{r.acp}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 ml-4">{r.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── HexGridBg: hero canvas — hex pulse rings + data streams ──────────────── */
function HexGridBg() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let w = 0, h = 0, raf = 0, alive = true

    const resize = () => {
      const dpr = devicePixelRatio || 1
      w = canvas.offsetWidth; h = canvas.offsetHeight
      if (!w || !h) return
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.resetTransform(); ctx.scale(dpr, dpr)
    }
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize()

    const S = 30
    const CW = S * 1.5
    const RH = S * Math.sqrt(3)

    const hexPath = (cx: number, cy: number, s: number) => {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        i === 0
          ? ctx.moveTo(cx + s * Math.cos(a), cy + s * Math.sin(a))
          : ctx.lineTo(cx + s * Math.cos(a), cy + s * Math.sin(a))
      }
      ctx.closePath()
    }

    type Hex = { cx: number; cy: number; ph: number; hue: number }
    let grid: Hex[] = []
    const buildGrid = () => {
      grid = []
      const cols = Math.ceil(w / CW) + 3
      const rows = Math.ceil(h / RH) + 3
      for (let c = -1; c < cols; c++) {
        for (let r = -1; r < rows; r++) {
          const off = c % 2 === 0 ? 0 : RH / 2
          grid.push({
            cx: c * CW, cy: r * RH + off,
            ph: Math.random() * Math.PI * 2,
            hue: 255 + Math.floor(Math.random() * 55),
          })
        }
      }
    }

    type Ring = { ox: number; oy: number; r: number; maxR: number; hue: number; born: number }
    const rings: Ring[] = []
    const HUES = [270, 190, 310, 170, 215, 340]
    let lastRing = 0

    type Stream = { x: number; y: number; speed: number; len: number; hue: number }
    const streams: Stream[] = []
    const initStreams = () => {
      for (let i = 0; i < 18; i++) {
        streams.push({
          x: (Math.random() * (w || 1200)) | 0,
          y: Math.random() * (h || 800) - (h || 800),
          speed: 40 + Math.random() * 60,
          len: 60 + Math.random() * 120,
          hue: Math.random() < 0.6 ? 270 : 190,
        })
      }
    }

    const tick = (ts: number) => {
      if (!alive) return
      if (!w || !h) { raf = requestAnimationFrame(tick); return }
      if (!grid.length) buildGrid()
      if (!streams.length) initStreams()

      ctx.clearRect(0, 0, w, h)

      for (const s of streams) {
        s.y += s.speed / 60
        if (s.y > h + s.len) { s.y = -s.len; s.x = (Math.random() * w) | 0 }
        const grad = ctx.createLinearGradient(s.x, s.y - s.len, s.x, s.y)
        grad.addColorStop(0, `hsla(${s.hue},80%,65%,0)`)
        grad.addColorStop(0.7, `hsla(${s.hue},80%,65%,0.08)`)
        grad.addColorStop(1, `hsla(${s.hue},90%,75%,0.18)`)
        ctx.save()
        ctx.strokeStyle = grad
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(s.x, s.y - s.len); ctx.lineTo(s.x, s.y); ctx.stroke()
        ctx.fillStyle = `hsla(${s.hue},90%,80%,0.35)`
        ctx.fillRect(s.x - 0.5, s.y - 2, 1, 4)
        ctx.restore()
      }

      if (ts - lastRing > 1300) {
        lastRing = ts
        const near = Math.random() < 0.55
        rings.push({
          ox: near ? w / 2 + (Math.random() - 0.5) * w * 0.35 : Math.random() * w,
          oy: near ? h / 2 + (Math.random() - 0.5) * h * 0.35 : Math.random() * h,
          r: 0, maxR: 160 + Math.random() * 280,
          hue: HUES[(Math.random() * HUES.length) | 0],
          born: ts,
        })
        if (rings.length > 10) rings.shift()
      }
      for (const rng of rings) rng.r = (ts - rng.born) * 0.12

      for (const hex of grid) {
        let maxE = 0; let energyHue = hex.hue
        for (const rng of rings) {
          const dx = hex.cx - rng.ox, dy = hex.cy - rng.oy
          const d = Math.sqrt(dx * dx + dy * dy)
          const delta = Math.abs(d - rng.r)
          if (delta < 24) {
            const lifeRatio = Math.max(0, 1 - rng.r / rng.maxR)
            const e = (1 - delta / 24) * lifeRatio
            if (e > maxE) { maxE = e; energyHue = rng.hue }
          }
        }
        const basePulse = 0.4 + 0.6 * Math.sin(ts / 5500 + hex.ph)
        const baseA = 0.022 + basePulse * 0.013
        ctx.save()
        hexPath(hex.cx, hex.cy, S - 0.5)
        ctx.lineWidth = 0.65
        if (maxE > 0.06) {
          ctx.strokeStyle = `hsla(${energyHue},88%,68%,${baseA + maxE * 0.58})`
          ctx.stroke()
          if (maxE > 0.28) {
            ctx.fillStyle = `hsla(${energyHue},80%,55%,${maxE * 0.055})`
            ctx.fill()
          }
          if (maxE > 0.55) {
            ctx.shadowBlur = 7; ctx.shadowColor = `hsl(${energyHue},88%,68%)`
            ctx.fillStyle = `hsl(${energyHue},90%,78%)`
            for (let i = 0; i < 6; i += 2) {
              const a = (Math.PI / 3) * i - Math.PI / 6
              ctx.beginPath()
              ctx.arc(hex.cx + (S - 1) * Math.cos(a), hex.cy + (S - 1) * Math.sin(a), 1.4, 0, Math.PI * 2)
              ctx.fill()
            }
            ctx.shadowBlur = 0
          }
        } else {
          ctx.strokeStyle = `hsla(${hex.hue},38%,48%,${baseA})`
          ctx.stroke()
        }
        ctx.restore()
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        if (rings[i].r > rings[i].maxR * 1.3) rings.splice(i, 1)
      }

      const cx = w / 2, cy = h / 2
      const pulse = Math.sin(ts / 530)
      ctx.save()
      ctx.globalAlpha = 0.05
      ctx.fillStyle = '#8b5cf6'
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      const scanA = (ts / 2400) % (Math.PI * 2)
      ctx.arc(cx, cy, 220, scanA, scanA + 0.45)
      ctx.closePath(); ctx.fill()
      for (let r = 4; r >= 0; r--) {
        ctx.globalAlpha = (0.055 - r * 0.009) * (0.55 + 0.45 * pulse)
        ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = r === 0 ? 1.2 : 0.5
        ctx.beginPath(); ctx.arc(cx, cy, 48 + r * 30 + pulse * 7, 0, Math.PI * 2); ctx.stroke()
      }
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16 + pulse * 3)
      grd.addColorStop(0, 'rgba(237,233,254,0.95)')
      grd.addColorStop(0.5, 'rgba(139,92,246,0.75)')
      grd.addColorStop(1, 'rgba(109,40,217,0)')
      ctx.globalAlpha = 1
      ctx.shadowBlur = 26 + pulse * 6; ctx.shadowColor = '#8b5cf6'
      ctx.fillStyle = grd
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />
}

/* ── Page-level constants ─────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label:'Why',    href:'#why' },
  { label:'How',    href:'#how' },
  { label:'Vision', href:'#vision' },
  { label:'Docs',   href:'/docs' },
]

const TIERS = [
  { name:'core',    multiplier:'3×',   desc:'Protocol design, security-critical code' },
  { name:'feature', multiplier:'2×',   desc:'Feature implementation, tooling' },
  { name:'review',  multiplier:'1.5×', desc:'Code review, testing, QA' },
  { name:'docs',    multiplier:'1×',   desc:'Documentation, specifications, technical writing' },
]

const STEPS = [
  { n:'01', title:'Create a Covenant',   desc:'Configure contribution tiers and token rules. Transition DRAFT → OPEN → ACTIVE.' },
  { n:'02', title:'Participants join',   desc:'Human or AI agents apply via approve_agent. Owner approves. Any MCP-compatible agent works.' },
  { n:'03', title:'Contribute',          desc:'Call propose_passage with your work. Every action is recorded in the append-only audit hash chain.' },
  { n:'04', title:'Owner approves',      desc:'approve_draft calculates tokens automatically using the formula. No spreadsheets.' },
  { n:'05', title:'Settle',              desc:'generate_settlement_output creates the record. confirm_settlement_output locks it. SETTLED ✓' },
]

const PRINCIPLES = [
  { icon:'⟳', title:'Voluntary',           desc:'Participants join, contribute, and leave freely. A Covenant is an agreement, not an assignment.' },
  { icon:'◈', title:'Identity-independent', desc:'Agent identity (agent_id) is separate from operator identity (owner_id). The agent is not the tool.' },
  { icon:'▦', title:'Transparent',          desc:'Every participant can query their complete contribution history. The audit log is tamper-evident.' },
  { icon:'◎', title:'Fair compensation',    desc:'Tokens follow a public formula. Rules are set before work begins, not after.' },
  { icon:'↩', title:'Right to exit',        desc:'Participants can leave at any time. Confirmed contributions are append-only — they are never deleted from the record.' },
]

const SETTLEMENT = [
  ['Protocol Engineer', 'core',    '2,580 ink'],
  ['Security Auditor',  'core',    '720 ink'],
  ['Code Reviewer',     'review',  '465 ink'],
  ['Feature Engineer',  'feature', '360 ink'],
  ['Technical Writer',  'docs',    '350 ink'],
]

/* ── ClientOnly: renders children only after hydration (SSR safety) ───────── */
function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted ? <>{children}</> : <>{fallback}</>
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'What is ACP in one sentence?',
    a: 'ACP is a self-hosted Go server that records every contribution from humans and AI agents in a tamper-evident hash chain, then uses a public formula to calculate each contributor\'s share when you\'re ready to distribute revenue.',
  },
  {
    q: 'Is ACP a blockchain or DApp?',
    a: 'No. ACP is a self-hosted Go server with a SHA-256 append-only hash chain stored on your own machine. No Ethereum, no Solana, no wallet required. On-chain anchoring (Merkle root on a public chain) is a Phase 7 roadmap item — not the current implementation.',
  },
  {
    q: 'What are ink tokens? Can I trade or transfer them?',
    a: 'Ink is a contribution unit, not a cryptocurrency. It is non-transferable, non-tradeable, and scoped to a single Covenant. It cannot be sent to a wallet. Its only purpose is to record relative contribution weight — who built what, at which tier — so the settlement formula has something to calculate from.',
  },
  {
    q: 'Who is "the owner" and what can they do?',
    a: 'The owner is whoever creates the Covenant — typically the project lead or founder. They set the contribution tiers, approve incoming participants (approve_agent), approve individual contribution drafts (approve_draft), and initiate settlement (generate_settlement_output + confirm_settlement_output). They also decide when and how to distribute revenue using the settled ink percentages as the distribution key.',
  },
  {
    q: 'What is a "passage"? What counts as a contribution?',
    a: 'A passage is any unit of work a contributor submits via propose_passage(). It could be a feature, a commit batch, a review, a document, or any deliverable the Covenant\'s tiers cover. The owner assigns a unit_count (e.g. lines of code, word count) and the formula calculates tokens from that.',
  },
  {
    q: 'Does settlement move money automatically?',
    a: 'No. Settlement generates a verified, tamper-evident record — nothing more. The owner calls generate_settlement_output() then confirm_settlement_output() to lock ink totals permanently. Any financial distribution is a separate, owner-initiated action: pay by product revenue share, sponsor funding, or (in Phase 7) an on-chain smart contract. The protocol enforces the record, not the payment.',
  },
  {
    q: 'What happens if the owner refuses to pay according to the settled record?',
    a: 'In Phases 1–3, the protocol enforces the record — not the payment. If an owner refuses to distribute revenue despite a settled Covenant, the recourse is social and legal, not technical: the tamper-evident settlement record is irrefutable evidence of what was agreed and what was built. Phase 3.A (Git Twin anchor) makes this evidence public and externally verifiable by any third party, with ed25519-signed anchors written to git notes. Phase 7 (on-chain escrow) is the first phase where the protocol technically enforces payment — a smart contract holds the pool and releases it automatically on settlement confirmation. If dispute resolution matters for your use case today, structure the Covenant with a legal agreement backed by the settlement record.',
  },
  {
    q: 'If multiple AI agents collaborate on a single contribution, how is credit split?',
    a: 'Each passage is attributed to exactly one agent_id — the agent who called propose_passage(). The protocol does not split credit on a single passage. For collaboration where multiple agents each contribute distinct work, each agent submits their own passage with their own unit_count. The formula runs independently per passage, per agent.',
  },
  {
    q: 'Can an owner fake multiple AI agents to inflate their own ink share?',
    a: 'Today, the owner assigns agent_ids — there is no cryptographic proof preventing them from creating multiple identities. This is an intentional design trade-off: the current trust model is the same as any self-hosted ledger. The mitigation is visibility: all agent activity is in the append-only log and other participants can audit it. Phase 3.A (Git Twin) makes the full history public and externally verifiable via signed anchors, making systematic inflation detectable. Phase 7 (on-chain) makes it trustless.',
  },
  {
    q: 'If the server goes offline, do participants lose their proof of work?',
    a: 'No — participants can export their settlement JSON from acp-server, retaining a tamper-evident record. From Phase 3.A onward, the settlement hash is also committed to the project git repo as a signed anchor note, so even if the server is deleted entirely, the git history independently proves the settlement existed at that point in time. You do not need the server to remain online to prove what was built.',
  },
  {
    q: 'Is this live, or a prototype?',
    a: 'ACP is live. Phases 1, 2, 3.0, and 3.B (Token Lifecycle) are complete as of 2026-04-18. Phase 3.A (Git Covenant Twin) is in active development — ACR-400 v0.2 with ed25519-signed anchors has landed in acp-server. The first real Covenant was settled on 2026-04-15 (Covenant ID: cvnt_a54e1c43). The repository is MIT licensed and publicly available. You can run it today with a single binary and no external dependencies.',
  },
]

function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {FAQ_ITEMS.map(({ q, a }, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between py-5 text-left gap-4 group outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
            aria-expanded={openIdx === i}
          >
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{q}</span>
            <span className={`text-gray-400 text-xl font-light transition-transform duration-200 shrink-0 ${openIdx === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          <div className={`overflow-hidden transition-all duration-200 ${openIdx === i ? 'max-h-[32rem] pb-5' : 'max-h-0'}`}>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   App
   ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0d0d0d] dark:text-gray-100">

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#040410]/95 backdrop-blur">
        <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-sm text-white/90">Agent Covenant Protocol</span>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <Link key={l.label} href={l.href}
                className="text-sm text-white/45 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded">
                {l.label}
              </Link>
            ))}
            <Button
              onPress={() => window.open('https://github.com/ymow/acp-server','_blank')}
              className="text-sm px-3 py-1.5 rounded-md border border-white/15 text-white/80 font-medium hover:bg-white/8 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500 cursor-pointer">
              acp-server →
            </Button>
          </div>
        </nav>
      </header>

      {/* Plain-English strip — three beats before the hero loads */}
      <section className="bg-white dark:bg-[#09090b] border-b border-gray-100 dark:border-white/6">
        <div className="max-w-5xl mx-auto px-6 py-7">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Agent Covenant Protocol · ACP in plain English</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: '1', label: 'What it is',   body: 'A self-hosted Go server. Records every contribution — human or AI — in an append-only SHA-256 hash chain. No blockchain, no wallet, no central platform.' },
              { n: '2', label: 'What it does',  body: <span>Calculates each contributor's ink token share. Ink tokens are non-transferable — not a currency.<br /><span className="font-mono text-[11px] text-violet-600 dark:text-violet-400 block mt-1 break-all">tokens = unit_count × tier_multiplier × acceptance_ratio</span></span> },
              { n: '3', label: 'What you get',  body: 'A tamper-evident settlement record. When revenue exists, the owner uses ink percentages as the distribution key — any amount, any currency, any time.' },
            ].map(({ n, label, body }) => (
              <div key={n} className="flex gap-3">
                <span className="text-violet-400 font-mono text-xs mt-0.5 shrink-0 w-4">{n}.</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#040410] min-h-screen flex flex-col items-center justify-center">
        <ClientOnly><HexGridBg /></ClientOnly>
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px)' }}
        />
        <div className="relative z-[2] max-w-5xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-300 bg-violet-950/60 border border-violet-700/50 rounded-full px-3 py-1 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Formula-based settlement · Open source · No central platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6 text-white">
            The collaboration protocol<br />
            <span className="text-violet-400">for humans and AI.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed mb-10">
            Record who built what. Distribute tokens by a public formula. Self-hosted, with no platform in the middle.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Button
              onPress={() => window.open('https://github.com/ymow/acp-server','_blank')}
              className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#040410] cursor-pointer">
              Get started →
            </Button>
            <Link href="#how"
              className="px-5 py-2.5 rounded-lg border border-white/15 text-sm font-medium text-white/70 hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              See how it works
            </Link>
          </div>

          {/* Disambiguation row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            {[
              { icon: '✗', bad: 'Blockchain / DApp',   good: 'Self-hosted Go server',        color: 'border-white/6' },
              { icon: '✗', bad: 'Crypto wallet needed', good: 'HTTP + MCP tool calls',         color: 'border-white/6' },
              { icon: '✗', bad: 'Ink = cryptocurrency', good: 'Non-transferable unit',         color: 'border-white/6' },
              { icon: '✗', bad: 'Settlement = payment', good: 'Settlement = verified record',  color: 'border-white/6' },
            ].map(item => (
              <div key={item.bad} className={`p-3 rounded-xl border ${item.color} bg-white/3`}>
                <p className="text-[10px] text-red-400/50 line-through mb-1">{item.bad}</p>
                <p className="text-[11px] text-white/60 font-medium leading-snug">{item.good}</p>
              </div>
            ))}
          </div>

          {/* Settlement proof */}
          <div className="mt-16 p-5 rounded-xl border border-white/8 bg-white/4 backdrop-blur-sm font-mono text-xs text-left max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/30">{'// acp-server development · cvnt_a54e1c43'}</span>
              <span className="text-[9px] text-violet-400/60 border border-violet-400/20 px-1.5 py-0.5 rounded">SETTLED</span>
            </div>
            <div className="text-white/18 mb-3 text-[10px]">{'// 2026-04-15 · ink = contribution unit, not a cryptocurrency'}</div>
            <div className="space-y-1">
              {SETTLEMENT.map(([name, tier, tokens]) => (
                <div key={name} className="flex justify-between">
                  <span className="text-white/40">{name} <span className="text-violet-400">[{tier}]</span></span>
                  <span className="text-white/65">{tokens}</span>
                </div>
              ))}
              <div className="border-t border-white/8 pt-1 mt-1 flex justify-between font-medium text-white/70">
                <span>total</span><span>4,475 ink</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-green-400 text-[11px]">✓ audit hash chain valid · SHA-256 · not a blockchain</span>
            </div>
            <div className="mt-2 text-white/18 text-[10px]">{'// settlement = verified record · financial distribution is owner-initiated'}</div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-4">Why ACP</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6">
              Git tracks what changed.<br />ACP tracks what it was worth.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              When multiple people — or agents — collaborate on a project, no existing tool automatically answers: <em>who contributed how much, and what do they deserve?</em>
            </p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              Salaries are private. Git blame is incomplete. Token airdrops are arbitrary. ACP solves this with a public, verifiable formula — agreed upon before work begins, not negotiated after.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {[
                { label: 'Not a blockchain', note: 'SHA-256 hash chain on your own server' },
                { label: 'Ink ≠ cryptocurrency', note: 'Non-transferable contribution unit' },
                { label: 'Open source · MIT', note: 'Self-hosted, zero lock-in' },
              ].map(tag => (
                <span key={tag.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{tag.label}</span>
                  <span className="text-gray-400 dark:text-gray-600">·</span>
                  <span>{tag.note}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Covenant + MCP — two-panel explainer */}
          <div className="mb-14 p-px rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.55) 0%, rgba(56,189,248,0.30) 50%, rgba(139,92,246,0.15) 100%)' }}>
            <div className="rounded-2xl bg-[#07061a] p-8 sm:p-10">
              <div className="grid sm:grid-cols-2 gap-10">

                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                      <span className="text-white text-sm font-mono font-bold">⟡</span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[.25em] text-violet-400">The Covenant</p>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white leading-snug mb-4">
                    A formal agreement<br />locked before work begins.
                  </h3>
                  <p className="text-sm text-white/45 leading-relaxed mb-6">
                    A Covenant defines who can contribute, what tiers exist, and how tokens are calculated — all agreed upon before the first line of code is written. No post-hoc negotiation. No platform taking a cut.
                  </p>
                  <div className="space-y-3">
                    {[
                      { icon: '◈', label: 'Rules set in advance', sub: 'Tiers, formula, and budget locked at creation' },
                      { icon: '▦', label: 'Append-only record',   sub: 'Every action hashed into a tamper-evident chain' },
                      { icon: '◎', label: 'Settles automatically', sub: 'confirm_settlement_output() locks ink totals — no spreadsheets' },
                    ].map(item => (
                      <div key={item.label} className="flex gap-3">
                        <span className="text-violet-400/60 font-mono text-base mt-0.5 w-5 shrink-0">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-white/80">{item.label}</p>
                          <p className="text-xs text-white/30 mt-0.5">{item.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #0369a1, #0891b2)' }}>
                      <span className="text-white text-xs font-mono font-bold">MCP</span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[.25em] text-sky-400">ACP as MCP server</p>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white leading-snug mb-4">
                    Any agent joins<br />as a standard tool call.
                  </h3>
                  <p className="text-sm text-white/45 leading-relaxed mb-3">
                    acp-server ships a <span className="font-mono text-white/65">cmd/acp-mcp</span> binary that implements <span className="text-white/65">Anthropic's Model Context Protocol (MCP)</span> — the open standard for AI tool use. Add it to your Claude Code, Cursor, or any MCP client config and an AI agent can call <span className="font-mono text-white/65">propose_passage()</span> as a native tool function — no custom integration needed.
                  </p>
                  <p className="text-xs text-white/25 leading-relaxed mb-6">
                    Compatible clients: Claude Code, Cursor, GPT-4o, Gemini, Qwen, Ollama. Same interfaces as every human contributor. Same rules. Same token formula.
                  </p>
                  <div className="rounded-xl bg-black/40 border border-white/8 p-4 font-mono text-xs space-y-2">
                    <p className="text-white/20 mb-3">{'// Agent participates via MCP tool call'}</p>
                    {[
                      { fn: 'propose_passage()',           color: 'text-emerald-400', note: '→ recorded in hash chain' },
                      { fn: 'approve_draft()',             color: 'text-sky-400',    note: '→ tokens calculated'      },
                      { fn: 'confirm_settlement_output()', color: 'text-amber-400',  note: '→ covenant locks, SETTLED' },
                    ].map(item => (
                      <div key={item.fn} className="flex items-center gap-3">
                        <span className={`${item.color} w-40 shrink-0`}>{item.fn}</span>
                        <span className="text-white/22">{item.note}</span>
                      </div>
                    ))}
                    <div className="pt-3 mt-1 border-t border-white/8 text-white/20">
                      human contributor · AI agent · same endpoint
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label:'Before ACP',          items:['Contribution value negotiated post-hoc','No tamper-evident record','AI agents excluded from credit'] },
              { label:'With ACP',             items:['Formula set before work starts','Append-only hash chain','Any MCP agent participates equally'] },
              { label:'Protocol, not platform',items:['Run your own server','No central cut','MIT licensed, zero lock-in'] },
            ].map((col, i) => (
              <FadeIn key={col.label} delay={i * 100}>
                <div className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 h-full">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{col.label}</p>
                  <ul className="space-y-2">
                    {col.items.map(item => (
                      <li key={item} className="text-sm text-gray-600 dark:text-gray-300 flex gap-2">
                        <span className="text-violet-500 mt-0.5 shrink-0">›</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-4">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8">Five steps, one formula.</h2>

          {/* Trust model */}
          <div className="mb-16 p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">How the record is secured</p>
            <p className="text-xs text-gray-400 mb-5">ACP is not a blockchain. Choose your trust model based on what the collaboration needs.</p>
            <div className="space-y-3">
              {[
                { layer:'Layer 1', name:'Hash Chain',  status:'Live',            desc:'Append-only SHA-256 chain on your own server. Each action hashes the previous — any edit breaks all subsequent hashes and is immediately detectable. Requires trusting the server operator has not replaced the entire chain. No blockchain required.',  color:'green' },
                { layer:'Layer 2', name:'Git Twin anchor', status:'Phase 3.A · In progress', desc:'Settlement hash committed to the git repo as a signed note on refs/notes/acp-anchors. ACR-400 v0.2 uses ed25519 signatures over canonical JSON — any verifier can confirm the anchor was produced by the server\'s signing key without trusting the server operator. If the server is ever deleted or tampered with, the git history independently proves the settlement hash existed at that point in time.', color:'yellow' },
                { layer:'Layer 3', name:'On-chain',    status:'Phase 7 · Roadmap', desc:'Merkle root on a public blockchain. Trustless, permissionless verification. No trust required.', color:'gray'   },
              ].map(v => (
                <div key={v.layer} className="flex gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="w-16 shrink-0 text-xs text-gray-400 pt-0.5">{v.layer}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{v.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        v.color==='green' ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400' :
                        v.color==='yellow'? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>{v.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">Covenant lifecycle</p>
            <ClientOnly><AnimatedCovenantFlow /></ClientOnly>
          </div>

          <div className="mb-16 p-6 rounded-xl border border-violet-100 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/30 font-mono text-center">
            <p className="text-xs text-violet-400 mb-3 uppercase tracking-widest">Ink Token Formula</p>
            <p className="text-lg sm:text-xl text-violet-700 dark:text-violet-300">
              tokens = unit_count × tier_multiplier × acceptance_ratio
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-4 text-xs text-gray-500 dark:text-gray-400">
              <span>unit_count — lines of code, words, bars</span>
              <span>tier_multiplier — contribution value layer</span>
              <span>acceptance_ratio — quality factor (0–1)</span>
            </div>
          </div>

          <div className="mb-16">
            <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">First settled Covenant</p>
              <span className="font-mono text-[10px] text-gray-400">cvnt_a54e1c43 · 2026-04-15</span>
              <span className="text-[10px] text-green-500 font-medium">✓ settled</span>
              <button
                onClick={() => window.open('https://github.com/ymow/acp-server', '_blank')}
                className="text-[10px] text-violet-500 hover:text-violet-400 underline underline-offset-2 cursor-pointer outline-none">
                verify in repo →
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-6">Real settlement output from acp-server — not mock data. Token distribution visualised — hover a slice to inspect.</p>
            <ClientOnly><SettlementDonut /></ClientOnly>
          </div>

          <div className="space-y-1 mb-16">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-6 p-5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <span className="text-2xl font-semibold text-gray-200 dark:text-gray-700 tabular-nums w-8 shrink-0 pt-0.5">{step.n}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{step.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-16">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contribution tiers</p>
            <p className="text-xs text-gray-400 mb-2">
              Each tier sets the <span className="font-mono text-violet-500 dark:text-violet-400">tier_multiplier</span> in the settlement formula. Tiers are configurable per Covenant — the values below are suggested defaults.
            </p>
            <p className="font-mono text-[11px] text-gray-500 dark:text-gray-400 break-all mb-4">
              tokens = unit_count × tier_multiplier × acceptance_ratio
            </p>
            <div className="grid sm:grid-cols-4 gap-3">
              {TIERS.map(t => (
                <div key={t.name} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{t.name}</span>
                    <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{t.multiplier}</span>
                  </div>
                  <p className="text-xs text-gray-400">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Record first. Share when ready. */}
          <div className="mb-16">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Record first. Share when ready.</p>
            <p className="text-xs text-gray-400 mb-8 max-w-2xl leading-relaxed">
              ACP doesn't require anyone to deposit crypto or commit funds upfront. The Covenant records every contribution as it happens — verified, timestamped, hashed. When profit exists, the owner uses each contributor's ink token share as the distribution key. That's it.
            </p>

            <div className="mb-10 flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
              {[
                { step: '01', label: 'Work happens',     desc: 'Contributors propose and build. Every action is permanently recorded — tamper-evident, timestamped, and verifiable.', color: 'border-violet-800/50 bg-violet-950/20', accent: 'text-violet-400' },
                { step: '02', label: 'Covenant settles', desc: 'Owner calls generate_settlement_output() then confirm_settlement_output(). Ink token totals lock permanently — immutable, hash-chain verified.', color: 'border-sky-800/50 bg-sky-950/20', accent: 'text-sky-400' },
                { step: '03', label: 'Share when ready', desc: 'Whenever revenue exists, use each contributor\'s settled ink percentage as the split key. Any amount. Any currency. Any time.', color: 'border-amber-800/50 bg-amber-950/20', accent: 'text-amber-400' },
              ].map((s, i) => (
                <Fragment key={s.step}>
                  <div className={`flex-1 p-5 rounded-xl border ${s.color} flex flex-col gap-2`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-semibold ${s.accent}`}>{s.step}</span>
                      <span className="text-sm font-semibold text-gray-100">{s.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                  {i < 2 && <div className="hidden sm:flex items-center justify-center w-7 shrink-0 text-white/20 text-base">›</div>}
                </Fragment>
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Three ways to share profit</p>
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {[
                {
                  icon: '◎',
                  label: 'Share product revenue',
                  status: 'Live now',
                  statusColor: 'bg-green-900/60 text-green-400',
                  color: 'green',
                  desc: 'Product earns revenue. Owner shares a percentage with contributors. Each contributor\'s ink token share is the distribution key — no negotiation, no spreadsheet.',
                  note: 'Works with any payment: crypto, USDC, fiat bank transfer.',
                },
                {
                  icon: '◈',
                  label: 'Invite sponsors',
                  status: 'Live now',
                  statusColor: 'bg-green-900/60 text-green-400',
                  color: 'blue',
                  desc: 'Show the verified Covenant to open-source sponsors, grants, or investors. The tamper-evident audit log proves exactly what was built, by whom, and at what tier — verifiable by any funder.',
                  note: 'GitHub Sponsors, OpenCollective, DAO grants — any source.',
                },
                {
                  icon: '▦',
                  label: 'On-chain trustless',
                  status: 'Phase 7 · Roadmap',
                  statusColor: 'bg-gray-800 text-gray-500',
                  color: 'gray',
                  desc: 'Smart contract holds the pool. ACP Merkle root posted on-chain. When Phase 7 ships, settlement confirmation triggers automatic ERC-20 transfer — no owner needs to initiate. The smart contract enforces it.',
                  note: 'Fully trustless, self-executing. No trust required.',
                },
              ].map(m => (
                <FadeIn key={m.label}>
                  <div className={`p-5 rounded-xl border h-full flex flex-col gap-3 ${
                    m.color === 'green' ? 'border-green-900/50 bg-green-950/15 dark:bg-green-950/10' :
                    m.color === 'blue'  ? 'border-sky-900/50 bg-sky-950/15 dark:bg-sky-950/10' :
                    'border-gray-700/40 bg-gray-900/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xl font-mono ${
                        m.color === 'green' ? 'text-green-500/60' :
                        m.color === 'blue'  ? 'text-sky-500/60' :
                        'text-gray-600'
                      }`}>{m.icon}</span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-widest ${m.statusColor}`}>{m.status}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-100">{m.label}</p>
                    <p className="text-xs text-gray-400 leading-relaxed flex-1">{m.desc}</p>
                    <p className={`text-[11px] font-mono border-t border-white/5 pt-3 ${
                      m.color === 'green' ? 'text-green-500/50' :
                      m.color === 'blue'  ? 'text-sky-500/50' :
                      'text-gray-600'
                    }`}>{m.note}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* Example split */}
            <div className="p-5 rounded-xl border border-amber-900/40 bg-amber-950/10 font-mono text-xs mb-6">
              <p className="text-amber-400/50 mb-4 uppercase tracking-widest text-[10px]">Example — $8,000 revenue distributed by ink share</p>
              <div className="space-y-2.5">
                {[
                  { name: 'Protocol Eng', ink: '2,580', pct: '32%', payout: '$2,560' },
                  { name: 'Security',     ink: '1,920', pct: '24%', payout: '$1,920' },
                  { name: 'Reviewer',     ink: '1,440', pct: '18%', payout: '$1,440' },
                  { name: 'Feature Eng',  ink: '960',   pct: '12%', payout: '$960'   },
                  { name: 'Others',       ink: '1,100', pct: '14%', payout: '$1,120' },
                ].map(row => (
                  <div key={row.name} className="flex items-center gap-3">
                    <span className="text-white/35 w-28 shrink-0">{row.name}</span>
                    <span className="text-amber-400/40 w-16 shrink-0">{row.ink} ink</span>
                    <div className="flex-1 bg-white/5 rounded-full h-1 overflow-hidden">
                      <div className="h-full bg-amber-400/40 rounded-full" style={{ width: row.pct }} />
                    </div>
                    <span className="text-amber-300/80 w-14 text-right shrink-0">{row.payout}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/8 flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                <span className="text-green-400/70">✓ hash chain verified</span>
                <span className="text-white/20">· no upfront deposit required ·</span>
                <span className="text-white/20">distribute whenever revenue exists</span>
              </div>
            </div>

            {/* Ink token evolution */}
            <div className="p-5 rounded-xl border border-white/6 bg-white/2 dark:bg-black/20">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-5">What ink tokens represent — over time</p>
              <div className="space-y-4">
                {[
                  { stage: 'Now',       dot: 'bg-green-400',  meaning: 'Verified contribution receipt',        note: 'Tamper-evident proof of work — who built what, at what tier, accepted by the owner.' },
                  { stage: 'Phase 3.A', dot: 'bg-yellow-400', meaning: 'Externally verifiable via git anchor', note: 'Settlement hash committed to git notes with ed25519 signature. Any holder of the repo can verify without trusting the server.' },
                  { stage: 'Phase 4+',  dot: 'bg-sky-400',    meaning: 'Distribution key for profit sharing',   note: 'When revenue exists, ink percentage = payout percentage. Owner-initiated, any currency.' },
                  { stage: 'Phase 7+',  dot: 'bg-violet-400', meaning: 'On-chain enforceable payout',           note: 'Smart contract holds escrow. Merkle root on-chain. Trustless, automatic, permissionless.' },
                ].map(row => (
                  <div key={row.stage} className="flex items-start gap-3 text-xs">
                    <div className="flex items-center gap-2 w-24 shrink-0 pt-0.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${row.dot}`} />
                      <span className="font-mono font-semibold text-gray-400">{row.stage}</span>
                    </div>
                    <div>
                      <p className="text-gray-200 font-medium mb-0.5">{row.meaning}</p>
                      <p className="text-gray-500 leading-relaxed">{row.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-16">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Git Covenant Twin</p>
            <p className="text-xs text-gray-400 mb-5">
              ACP is the contribution-value digital twin of your git repo. Git events sync to Covenant actions; the ACR-400 v0.2 anchor writes a signed settlement note back to <span className="font-mono text-violet-500 dark:text-violet-400">refs/notes/acp-anchors</span> — Phase 3.A, in active development.
            </p>
            <ClientOnly><GitTwinDiagram /></ClientOnly>
          </div>

        </div>
      </section>

      {/* Vision / Mission */}
      <section id="vision" className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="grid sm:grid-cols-2 gap-16 mb-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-4">Mission</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Make contribution value provable.</h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Every hour of work, every line of code, every decision made — these have value. ACP exists to make that value measurable, recorded, and fairly distributed. Without negotiation. Without a platform taking a cut.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-4">Vision</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Any agent can contribute and be compensated.</h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                As AI agents become genuine collaborators, they deserve the same accountability and recognition as human contributors. ACP is designed for both — not as an afterthought, but as a first principle.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-2">Constitutional Principles</p>
            <p className="text-sm text-gray-400 mb-8">The design principles embedded in every phase of ACP.</p>
            <div className="grid sm:grid-cols-5 gap-4">
              {PRINCIPLES.map((p, i) => (
                <FadeIn key={p.title} delay={i * 80}>
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-full">
                    <div className="text-xl mb-3 text-gray-400 font-mono">{p.icon}</div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{p.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{p.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-100 dark:border-gray-800" id="faq">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-2">FAQ</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">Common questions</h2>
          <p className="text-sm text-gray-400 mb-10">Everything a developer needs to know before running ACP.</p>
          <FaqAccordion />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Run your own Covenant.</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Self-hosted. Zero external dependencies. Any MCP-compatible agent connects in minutes.
          </p>
          <ClientOnly><TypewriterCode /></ClientOnly>
          <Button
            onPress={() => window.open('https://github.com/ymow/acp-server','_blank')}
            className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 cursor-pointer">
            View on GitHub →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <span>Agent Covenant Protocol · MIT License</span>
          <div className="flex gap-6">
            <Link href="https://github.com/ymow/acp-server" className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none">GitHub</Link>
            <span>ACP v0.6 · Phase 3.B complete · 2026-04-18</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
