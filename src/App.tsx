import { useRef, useEffect, useState, type ReactNode } from 'react'
import { arc, pie, select, interpolate } from 'd3'
import * as THREE from 'three'
import { Button, Link } from 'react-aria-components'
import './App.css'

/* ═══════════════════════════════════════════════════════════════════════════
   Lusion-style immersive 3-section showcase
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── CovenantPortal: Three.js torus ring + 6 orbiting contributor nodes ─── */
function CovenantPortal() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current!
    let W = container.clientWidth, H = container.clientHeight
    let alive = true
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
    camera.position.set(0, 0, 8)

    /* Covenant torus rings */
    const torusGeo = new THREE.TorusGeometry(2.4, 0.012, 6, 160)
    const torusMat = new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.75 })
    const torus = new THREE.Line(torusGeo, torusMat)
    scene.add(torus)

    const innerGeo = new THREE.TorusGeometry(1.72, 0.008, 6, 120)
    const innerMat = new THREE.LineBasicMaterial({ color: 0x6d28d9, transparent: true, opacity: 0.38 })
    const innerRing = new THREE.Line(innerGeo, innerMat)
    scene.add(innerRing)

    const outerGeo = new THREE.TorusGeometry(3.1, 0.006, 4, 120)
    const outerMat = new THREE.LineBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.12 })
    const outerRing = new THREE.Line(outerGeo, outerMat)
    scene.add(outerRing)

    /* Central covenant icosahedron */
    const coreGeo = new THREE.IcosahedronGeometry(0.28, 1)
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.65 })
    const core = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    /* Contributor nodes */
    const CONTRIBUTORS = [
      { tier: 'core',    color: 0x38bdf8, r: 3.3, speed:  0.065 },
      { tier: 'feature', color: 0xa78bfa, r: 3.7, speed: -0.052 },
      { tier: 'core',    color: 0x38bdf8, r: 3.3, speed:  0.071 },
      { tier: 'review',  color: 0xfbbf24, r: 3.7, speed: -0.048 },
      { tier: 'feature', color: 0xa78bfa, r: 3.3, speed:  0.058 },
      { tier: 'docs',    color: 0x34d399, r: 3.7, speed: -0.063 },
    ]
    const baseAngles = CONTRIBUTORS.map((_, i) => (i / CONTRIBUTORS.length) * Math.PI * 2)

    const nodeMeshes: THREE.Mesh[] = []
    const nodeTrails: THREE.Points[] = []
    const connLines: THREE.Line[] = []
    const trailHistory: THREE.Vector3[][] = CONTRIBUTORS.map(() =>
      Array.from({ length: 14 }, () => new THREE.Vector3())
    )

    CONTRIBUTORS.forEach((c, _i) => {
      const geo = new THREE.IcosahedronGeometry(c.tier === 'core' ? 0.13 : 0.1, 0)
      const mat = new THREE.MeshBasicMaterial({ color: c.color, wireframe: true, transparent: true, opacity: 0.82 })
      const mesh = new THREE.Mesh(geo, mat)
      scene.add(mesh)
      nodeMeshes.push(mesh)

      const trailN = 14
      const trailPos = new Float32Array(trailN * 3)
      const trailGeo = new THREE.BufferGeometry()
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
      const trailMat = new THREE.PointsMaterial({ color: c.color, size: 0.04, transparent: true, opacity: 0.4 })
      const trail = new THREE.Points(trailGeo, trailMat)
      scene.add(trail)
      nodeTrails.push(trail)

      const connPts = new Float32Array(6)
      const connGeo = new THREE.BufferGeometry()
      connGeo.setAttribute('position', new THREE.BufferAttribute(connPts, 3))
      const connMat = new THREE.LineBasicMaterial({ color: c.color, transparent: true, opacity: 0.12 })
      const conn = new THREE.Line(connGeo, connMat)
      scene.add(conn)
      connLines.push(conn)
    })

    const onMouse = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1
      mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMouse)

    let rafId = 0
    const animate = (ts: number) => {
      if (!alive) return
      rafId = requestAnimationFrame(animate)
      const t = ts * 0.001

      torus.rotation.z = t * 0.1
      innerRing.rotation.z = -t * 0.16
      outerRing.rotation.z = t * 0.06
      core.rotation.x = t * 0.35
      core.rotation.y = t * 0.27

      CONTRIBUTORS.forEach((c, i) => {
        const angle = baseAngles[i] + t * c.speed
        const nx = Math.cos(angle) * c.r
        const ny = Math.sin(angle) * c.r
        const nz = Math.sin(angle * 0.5) * 0.3
        nodeMeshes[i].position.set(nx, ny, nz)
        nodeMeshes[i].rotation.y = t * 0.9

        const hist = trailHistory[i]
        hist.unshift(new THREE.Vector3(nx, ny, nz))
        if (hist.length > 14) hist.pop()
        const trailPos = nodeTrails[i].geometry.attributes.position.array as Float32Array
        hist.forEach((p, pi) => {
          trailPos[pi * 3] = p.x
          trailPos[pi * 3 + 1] = p.y
          trailPos[pi * 3 + 2] = p.z
        })
        nodeTrails[i].geometry.attributes.position.needsUpdate = true

        const connPos = connLines[i].geometry.attributes.position.array as Float32Array
        connPos[0] = 0; connPos[1] = 0; connPos[2] = 0
        connPos[3] = nx; connPos[4] = ny; connPos[5] = nz
        connLines[i].geometry.attributes.position.needsUpdate = true
        ;(connLines[i].material as THREE.LineBasicMaterial).opacity =
          0.08 + 0.08 * Math.sin(t * 1.5 + i * 1.1)
      })

      mouse.x += (mouse.tx - mouse.x) * 0.035
      mouse.y += (mouse.ty - mouse.y) * 0.035
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.04
      camera.position.y += (mouse.y * 0.35 - camera.position.y) * 0.04
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(animate)

    const onResize = () => {
      W = container.clientWidth; H = container.clientHeight
      camera.aspect = W / H; camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    return () => {
      alive = false
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', onResize)
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      torusGeo.dispose(); torusMat.dispose()
      innerGeo.dispose(); innerMat.dispose()
      outerGeo.dispose(); outerMat.dispose()
      coreGeo.dispose(); coreMat.dispose()
      nodeMeshes.forEach(m => { m.geometry.dispose(); (m.material as THREE.Material).dispose() })
      nodeTrails.forEach(tr => { tr.geometry.dispose(); (tr.material as THREE.Material).dispose() })
      connLines.forEach(c => { c.geometry.dispose(); (c.material as THREE.Material).dispose() })
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0" />
}

/* ── HashTunnel: scroll-driven 3D chain block descent ───────────────────── */
function HashTunnel() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = mountRef.current!
    let W = container.clientWidth, H = container.clientHeight
    let alive = true

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 300)
    camera.position.set(0, 0, 18)

    const BLOCK_COUNT = 42
    const SPACING = 3.0
    const ACTION_COLORS: [string, number][] = [
      ['propose_passage',     0x10b981],
      ['approve_draft',       0x8b5cf6],
      ['generate_settlement_output', 0xf59e0b],
      ['leave_covenant',      0xef4444],
      ['request_join',        0x38bdf8],
    ]

    interface BlockData { mesh: THREE.LineSegments; baseY: number }
    const blockData: BlockData[] = []

    for (let i = 0; i < BLOCK_COUNT; i++) {
      const bw = 4.4 + (Math.random() - 0.5) * 0.5
      const bh = 0.68
      const bd = 1.1 + (Math.random() - 0.5) * 0.3
      const geo = new THREE.BoxGeometry(bw, bh, bd)
      const edges = new THREE.EdgesGeometry(geo)
      const [, color] = ACTION_COLORS[i % ACTION_COLORS.length]
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 + Math.random() * 0.25 })
      const mesh = new THREE.LineSegments(edges, mat)
      const baseY = 10 - i * SPACING
      mesh.position.set((Math.random() - 0.5) * 0.7, baseY, (Math.random() - 0.5) * 0.4)
      mesh.rotation.y = (Math.random() - 0.5) * 0.12
      scene.add(mesh)
      blockData.push({ mesh, baseY })
      geo.dispose()
    }

    /* Vertical chain links */
    for (let i = 0; i < BLOCK_COUNT - 1; i++) {
      const y1 = 10 - i * SPACING - 0.34
      const y2 = 10 - (i + 1) * SPACING + 0.34
      const pts = new Float32Array([0, y1, 0, 0, y2, 0])
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(pts, 3))
      const m = new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.1 })
      scene.add(new THREE.Line(g, m))
    }

    let scrollProg = 0
    const section = container.closest('section')
    const onScroll = () => {
      if (!section) return
      const rect = section.getBoundingClientRect()
      const total = section.offsetHeight - window.innerHeight
      scrollProg = Math.min(1, Math.max(0, -rect.top) / Math.max(1, total))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    let camY = 0, camZ = 18, rafId = 0
    const animate = (ts: number) => {
      if (!alive) return
      rafId = requestAnimationFrame(animate)
      const t = ts * 0.001

      const targetY = -(scrollProg * BLOCK_COUNT * SPACING * 0.72 - 2)
      const targetZ = 18 - scrollProg * 6
      camY += (targetY - camY) * 0.05
      camZ += (targetZ - camZ) * 0.05
      camera.position.y = camY
      camera.position.z = camZ
      camera.lookAt(0, camY - 5, 0)

      blockData.forEach(({ mesh }, idx) => {
        mesh.rotation.y += 0.003
        const dist = Math.abs(mesh.position.y - camera.position.y)
        const mat = mesh.material as THREE.LineBasicMaterial
        mat.opacity = dist < 14 ? 0.38 + 0.32 * Math.sin(t * 1.6 + idx * 0.85) : 0.08
      })

      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(animate)

    const onResize = () => {
      W = container.clientWidth; H = container.clientHeight
      camera.aspect = W / H; camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    return () => {
      alive = false
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      blockData.forEach(({ mesh }) => {
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      })
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0" />
}

/* ── SettlementWeb: canvas 2D animated token flow web ───────────────────── */
function SettlementWeb() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0, raf = 0, alive = true
    let startT = -1, triggered = false

    const resize = () => {
      const dpr = devicePixelRatio || 1
      W = canvas.offsetWidth; H = canvas.offsetHeight
      if (!W || !H) return
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx.resetTransform(); ctx.scale(dpr, dpr)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas); resize()

    const SETTLERS = [
      { name: 'Tyrion', tier: 'core',    tokens: 2580, color: '#38bdf8' },
      { name: 'Arya',   tier: 'core',    tokens:  720, color: '#38bdf8' },
      { name: 'Stannis',tier: 'review',  tokens:  465, color: '#fbbf24' },
      { name: 'Jon',    tier: 'feature', tokens:  360, color: '#a78bfa' },
      { name: 'Sansa',  tier: 'docs',    tokens:  350, color: '#34d399' },
    ]
    const TOTAL = SETTLERS.reduce((s, x) => s + x.tokens, 0)

    type Particle = { x: number; y: number; tx: number; ty: number; life: number; speed: number }
    const particles: Particle[] = []

    const tick = (ts: number) => {
      if (!alive) return
      raf = requestAnimationFrame(tick)
      if (!W || !H || !triggered) return
      if (startT < 0) startT = ts
      const elapsed = (ts - startT) * 0.001

      ctx.clearRect(0, 0, W, H)

      const cx = W / 2
      const cy = H * 0.52
      const radius = Math.min(W, H) * 0.30

      SETTLERS.forEach((s, i) => {
        const angle = (i / SETTLERS.length) * Math.PI * 2 - Math.PI * 0.5
        const nx = cx + Math.cos(angle) * radius
        const ny = cy + Math.sin(angle) * radius
        const nodeR = 11 + (s.tokens / TOTAL) * 30
        const delay = i * 0.3
        const prog = Math.min(1, Math.max(0, (elapsed - delay) * 1.6))
        if (prog <= 0) return

        /* Spoke */
        ctx.save()
        ctx.globalAlpha = prog * 0.18 + 0.05 * Math.sin(elapsed * 1.8 + i)
        ctx.strokeStyle = s.color; ctx.lineWidth = 1.2
        ctx.setLineDash([3, 10])
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()

        /* Node glow */
        ctx.save()
        ctx.globalAlpha = prog * 0.2
        const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, nodeR * 3.5)
        grd.addColorStop(0, s.color); grd.addColorStop(1, s.color + '00')
        ctx.fillStyle = grd
        ctx.beginPath(); ctx.arc(nx, ny, nodeR * 3.5, 0, Math.PI * 2); ctx.fill()
        ctx.restore()

        /* Node ring */
        ctx.save()
        ctx.globalAlpha = prog * 0.88
        ctx.strokeStyle = s.color; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(nx, ny, nodeR, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()

        /* Label */
        const counted = Math.floor(prog * s.tokens)
        ctx.save()
        ctx.globalAlpha = prog * 0.82
        ctx.fillStyle = '#e2e8f0'
        ctx.font = '700 13px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(s.name, nx, ny - nodeR - 14)
        ctx.font = '11px monospace'
        ctx.fillStyle = s.color
        ctx.fillText(counted + ' ink', nx, ny - nodeR - 1)
        ctx.restore()

        /* Spawn gold particles */
        if (prog > 0.18 && Math.random() < 0.18) {
          particles.push({
            x: cx + (Math.random() - 0.5) * 8,
            y: cy + (Math.random() - 0.5) * 8,
            tx: nx, ty: ny, life: 1,
            speed: 1.2 + Math.random() * 1.6,
          })
        }
      })

      /* Particles */
      for (let pi = particles.length - 1; pi >= 0; pi--) {
        const p = particles[pi]
        const dx = p.tx - p.x, dy = p.ty - p.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 4) { particles.splice(pi, 1); continue }
        p.x += (dx / d) * p.speed * 2.8
        p.y += (dy / d) * p.speed * 2.8
        p.life -= 0.014
        if (p.life <= 0) { particles.splice(pi, 1); continue }
        ctx.save()
        ctx.globalAlpha = p.life * 0.9
        ctx.fillStyle = '#f59e0b'
        ctx.shadowBlur = 8; ctx.shadowColor = '#f59e0b'
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }

      /* Center COVENANT core */
      const pulse = 0.6 + 0.2 * Math.sin(elapsed * 2.1)
      const coreR = 26
      ctx.save()
      ctx.globalAlpha = pulse
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3)
      cg.addColorStop(0, '#8b5cf6cc'); cg.addColorStop(1, '#8b5cf600')
      ctx.fillStyle = cg
      ctx.beginPath(); ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 0.75 + 0.18 * Math.sin(elapsed * 2.1)
      ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.globalAlpha = 0.65
      ctx.fillText('COVENANT', cx, cy)
      ctx.restore()
    }
    raf = requestAnimationFrame(tick)

    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !triggered) { triggered = true; obs.disconnect() }
    }, { threshold: 0.22 })
    obs.observe(canvas)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      obs.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}


/* ═══════════════════════════════════════════════════════════════════════════
   ACP Protocol — Lusion.co-inspired sticky parallax
   Ships = contributors. Covenant ring = ACP protocol. Moon = settlement.
   ═══════════════════════════════════════════════════════════════════════════ */

const ACP_AGENTS = [
  { name: 'Architect', role: 'Protocol Design', tier: 'core',    hex: '#f59e0b', color: 0xf59e0b, planetCol: 0x7c3f00, sz: 1.15, tokens: 2580 },
  { name: 'Builder',   role: 'Core Engineer',   tier: 'core',    hex: '#38bdf8', color: 0x38bdf8, planetCol: 0x0c2a4a, sz: 1.00, tokens: 1920 },
  { name: 'Auditor',   role: 'Code Review',     tier: 'review',  hex: '#a78bfa', color: 0xa78bfa, planetCol: 0x1a0a3e, sz: 1.05, tokens: 1440 },
  { name: 'Catalyst',  role: 'AI Contributor',  tier: 'feature', hex: '#f97316', color: 0xf97316, planetCol: 0x4a1000, sz: 1.20, tokens:  960 },
  { name: 'Validator', role: 'QA Engineer',     tier: 'review',  hex: '#fbbf24', color: 0xfbbf24, planetCol: 0x2a2000, sz: 0.95, tokens:  720 },
  { name: 'Scribe',    role: 'Documenter',      tier: 'docs',    hex: '#34d399', color: 0x34d399, planetCol: 0x0a2a14, sz: 0.88, tokens:  480 },
  { name: 'Oracle',    role: 'AI Agent',        tier: 'feature', hex: '#c084fc', color: 0xc084fc, planetCol: 0x1a0530, sz: 0.90, tokens:  360 },
]

const ACTS = [
  {
    tag:   'I · The Problem',
    title: 'Builders scatter.\nContributions vanish.\nNo shared truth.',
    lines: [
      'Engineers ship features — no verifiable record.',
      'AI agents do the work — no attribution exists.',
      'Reviewers approve — their weight is invisible.',
      '',
      'Work without proof.',
      'Value without ownership.',
    ],
    accent: '#60a5fa',
    bg:    '#01020d',
  },
  {
    tag:   'II · The Coordination Gap',
    title: 'Legacy systems\nwere not built\nfor agents.',
    lines: [
      'AI contributors join the workflow — unstoppable.',
      '',
      'But no existing system can record,',
      'verify, or settle their contributions.',
      'Token distribution is guesswork.',
      'The gap between effort and reward never closes.',
    ],
    accent: '#93c5fd',
    bg:    '#010812',
  },
  {
    tag:   'III · Agent Covenant Protocol',
    title: 'One protocol.\nEvery action\nin the record.\nEvery agent\naccounted for.',
    lines: [
      'propose_passage()            —  contribution submitted',
      'approve_draft()              —  tokens calculated',
      'confirm_settlement_output()  —  covenant locks',
      '',
      'Human or AI. Core or docs.',
      'The covenant treats every contributor equally.',
    ],
    accent: '#8b5cf6',
    bg:    '#06020f',
  },
  {
    tag:   'IV · Covenant SETTLED',
    title: 'Every token\nearned.\nEvery agent\ncredited.\nOpen.\nPermanent.',
    lines: [
      'Architect  [core    3×]  ·  2,580 tokens  ·  verified',
      'Builder    [core    3×]  ·  1,920 tokens  ·  verified',
      'Auditor    [review  2×]  ·  1,440 tokens  ·  verified',
      '',
      'Fair by design. Formula-based settlement.',
      'No gatekeepers. No guesswork.',
    ],
    accent: '#f59e0b',
    bg:    '#050408',
  },
]

/* ── Ship factory — fuselage + swept wings + engine glow ─────────────────── */
function makeShip(color: number, scale: number): THREE.Group {
  const g   = new THREE.Group()
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.88 })

  /* Fuselage */
  const fbGeo = new THREE.CylinderGeometry(0.075 * scale, 0.048 * scale, 0.72 * scale, 6)
  const fb    = new THREE.Mesh(fbGeo, mat); fb.rotation.z = Math.PI / 2; g.add(fb)

  /* Nose */
  const nsGeo = new THREE.ConeGeometry(0.075 * scale, 0.30 * scale, 6)
  const ns    = new THREE.Mesh(nsGeo, mat); ns.rotation.z = -Math.PI / 2; ns.position.x = 0.51 * scale; g.add(ns)

  /* Swept wings (left & right) */
  const wMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.68, side: THREE.DoubleSide })
  for (const sign of [-1, 1] as const) {
    const wGeo = new THREE.BufferGeometry()
    const v = new Float32Array([
      -0.08 * scale, 0, sign * 0.06 * scale,
       0.10 * scale, 0, sign * 0.06 * scale,
      -0.35 * scale, 0, sign * 0.55 * scale,
      -0.08 * scale, 0, sign * 0.06 * scale,
      -0.35 * scale, 0, sign * 0.55 * scale,
      -0.50 * scale, 0, sign * 0.18 * scale,
    ])
    wGeo.setAttribute('position', new THREE.BufferAttribute(v, 3))
    wGeo.computeVertexNormals()
    g.add(new THREE.Mesh(wGeo, wMat))
  }

  /* Engine ring glow */
  const EN  = 8
  const ep  = new Float32Array(EN * 3)
  for (let i = 0; i < EN; i++) {
    const a = (i / EN) * Math.PI * 2
    ep[i*3] = -0.43 * scale; ep[i*3+1] = Math.sin(a) * 0.055 * scale; ep[i*3+2] = Math.cos(a) * 0.055 * scale
  }
  const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute('position', new THREE.BufferAttribute(ep, 3))
  const eMat = new THREE.PointsMaterial({ color, size: 0.14 * scale, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
  g.add(new THREE.Points(eGeo, eMat))

  /* Exhaust stream */
  const SN = 14; const sp = new Float32Array(SN * 3)
  for (let i = 0; i < SN; i++) {
    sp[i*3] = (-0.44 - (i/SN)*0.28) * scale
    sp[i*3+1] = (Math.random()-0.5) * (i/SN) * 0.07 * scale
    sp[i*3+2] = (Math.random()-0.5) * (i/SN) * 0.07 * scale
  }
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3))
  const sMat = new THREE.PointsMaterial({ color, size: 0.07 * scale, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
  g.add(new THREE.Points(sGeo, sMat))

  return g
}

/* ── Planet factory — solid sphere + grid + atmosphere ───────────────────── */
function makePlanet(radius: number, color: number, hasRing = false): THREE.Group {
  const g    = new THREE.Group()
  const sGeo = new THREE.SphereGeometry(radius, 14, 14)
  const sMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 })
  g.add(new THREE.Mesh(sGeo, sMat))

  const eGeo = new THREE.EdgesGeometry(new THREE.SphereGeometry(radius * 1.006, 10, 10))
  const eMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.18 })
  g.add(new THREE.LineSegments(eGeo, eMat))

  /* Atmosphere shells */
  for (const [r, op] of [[radius * 1.10, 0.10], [radius * 1.20, 0.045]] as [number, number][]) {
    const aGeo = new THREE.SphereGeometry(r, 10, 10)
    const aMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, side: THREE.BackSide })
    g.add(new THREE.Mesh(aGeo, aMat))
  }

  if (hasRing) {
    const rGeo = new THREE.RingGeometry(radius * 1.5, radius * 2.4, 64)
    const rMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.22 })
    const ring = new THREE.Mesh(rGeo, rMat); ring.rotation.x = Math.PI * 0.28; g.add(ring)
  }

  return g
}

/* ── Main scroll narrative component ─────────────────────────────────────── */
function GoTSpaceScroll() {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mountRef      = useRef<HTMLDivElement>(null)
  const bgRef         = useRef<HTMLDivElement>(null)
  const actRefs       = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const hintRef       = useRef<HTMLDivElement>(null)
  const orbOverlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current!
    const mount     = mountRef.current!
    let W = mount.clientWidth, H = mount.clientHeight
    let alive = true
    let rawProg = 0, prog = 0   // prog is LERPED — the lusion.co smooth scroll secret

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 600)
    camera.position.set(0, 0, 26)

    /* ── Starfields (cold deep blue + warm distant gold) ── */
    const makeStarField = (n: number, spread: number, col: number, sz: number) => {
      const p = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        p[i*3]   = (Math.random()-0.5) * spread
        p[i*3+1] = (Math.random()-0.5) * spread * 0.7
        p[i*3+2] = (Math.random()-0.5) * spread * 0.45 - 25
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(p, 3))
      const mat = new THREE.PointsMaterial({ color: col, size: sz, transparent: true, opacity: 0.55 })
      const pts = new THREE.Points(geo, mat); scene.add(pts)
      return { geo, mat, pts }
    }
    const sf1 = makeStarField(1400, 320, 0xbfdbfe, 0.08)
    const sf2 = makeStarField(500,  220, 0xfde68a, 0.065)

    /* ── Moon (destination) ── */
    const moonPlanet = makePlanet(7.5, 0xe2e8f0)
    moonPlanet.position.set(0, 2.5, -145)
    scene.add(moonPlanet)

    /* ── Home planets (one per agent, small, orbit their ship) ── */
    const homePlanets = ACP_AGENTS.map((agent, i) => {
      const p = makePlanet(
        0.38 + agent.sz * 0.12,
        agent.planetCol,
        i === 0  // Architect gets ring
      )
      scene.add(p)
      return p
    })

    /* ── Night King comet (act 1 threat) ── */
    const nkGroup = new THREE.Group()
    const nkCoreGeo = new THREE.IcosahedronGeometry(3.8, 1)
    const nkEdgeGeo = new THREE.EdgesGeometry(nkCoreGeo)
    const nkMat    = new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0 })
    nkGroup.add(new THREE.LineSegments(nkEdgeGeo, nkMat))
    // Inner solid
    const nkSolidGeo = new THREE.IcosahedronGeometry(3.4, 1)
    const nkSolidMat = new THREE.MeshBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0 })
    nkGroup.add(new THREE.Mesh(nkSolidGeo, nkSolidMat))
    // Ice shard trail
    const nkTrailN = 60; const nkTp = new Float32Array(nkTrailN * 3)
    for (let i = 0; i < nkTrailN; i++) {
      nkTp[i*3]   = 4 + (i/nkTrailN)*22; nkTp[i*3+1] = (Math.random()-0.5)*2; nkTp[i*3+2] = (Math.random()-0.5)*2
    }
    const nkTGeo = new THREE.BufferGeometry(); nkTGeo.setAttribute('position', new THREE.BufferAttribute(nkTp, 3))
    const nkTMat = new THREE.PointsMaterial({ color: 0xbfdbfe, size: 0.12, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
    nkGroup.add(new THREE.Points(nkTGeo, nkTMat))
    nkGroup.position.set(28, -2, -5)
    scene.add(nkGroup)

    /* ── Dragon covenant ring + wings ── */
    const dragonGroup = new THREE.Group()

    const makeRingLine = (r: number, tube: number, col: number) => {
      const g = new THREE.TorusGeometry(r, tube, 6, 200)
      const m = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0 })
      const l = new THREE.Line(g, m); dragonGroup.add(l)
      return { g, m, l }
    }
    const dr1 = makeRingLine(6.5, 0.018, 0x8b5cf6)
    const dr2 = makeRingLine(4.8, 0.012, 0x6d28d9)
    const dr3 = makeRingLine(8.0, 0.008, 0xc4b5fd)

    /* Dragon wings — two curved TubeGeometry arcs */
    const makeWing = (sign: number) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0,       6.5 * sign, 0),
        new THREE.Vector3(4,       9.5 * sign, -2),
        new THREE.Vector3(9,       11  * sign, -5),
        new THREE.Vector3(12,      8   * sign, -8),
      ])
      const wg  = new THREE.TubeGeometry(curve, 24, 0.06, 4, false)
      const wm  = new THREE.LineBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0 })
      const wl  = new THREE.Line(wg, wm); dragonGroup.add(wl)
      return { wg, wm, wl }
    }
    const wing1 = makeWing( 1)
    const wing2 = makeWing(-1)

    /* Dragon fire — additive blend orbit particles */
    const FIRE_N = 480; const fPos = new Float32Array(FIRE_N * 3); const fCol = new Float32Array(FIRE_N * 3)
    for (let i = 0; i < FIRE_N; i++) {
      const a = (i / FIRE_N) * Math.PI * 2; const r = 6.5
      fPos[i*3] = Math.cos(a)*r; fPos[i*3+1] = Math.sin(a)*r; fPos[i*3+2] = (Math.random()-0.5)*1.4
      const blend = i / FIRE_N
      fCol[i*3] = 0.5 + blend*0.5; fCol[i*3+1] = 0.1 + blend*0.3; fCol[i*3+2] = 1.0 - blend*0.75
    }
    const fGeo = new THREE.BufferGeometry()
    fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3))
    fGeo.setAttribute('color',    new THREE.BufferAttribute(fCol, 3))
    const fMat = new THREE.PointsMaterial({ size: 0.20, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    dragonGroup.add(new THREE.Points(fGeo, fMat))
    scene.add(dragonGroup)

    /* ── Ships ── */
    interface ShipObj { grp: THREE.Group; baseAngle: number; chaosOff: THREE.Vector3; planet: THREE.Group }
    const ships: ShipObj[] = ACP_AGENTS.map((agent, i) => {
      const grp = makeShip(agent.color, agent.sz)
      const baseAngle = (i / ACP_AGENTS.length) * Math.PI * 2
      grp.position.set(Math.cos(baseAngle)*8.5, Math.sin(baseAngle)*5, 0)
      scene.add(grp)
      return {
        grp, baseAngle, planet: homePlanets[i],
        chaosOff: new THREE.Vector3((Math.random()-0.5)*12, (Math.random()-0.5)*8, (Math.random()-0.5)*7),
      }
    })

    /* ── Scroll (RAW progress, lerped in loop) ── */
    const onScroll = () => {
      const rect  = container.getBoundingClientRect()
      const total = container.offsetHeight - window.innerHeight
      rawProg = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    /* ── Helpers ── */
    const lerp    = (a: number, b: number, t: number) => a + (b-a)*t
    const smooth  = (t: number) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t
    const actP    = (s: number, e: number) => smooth(Math.min(1, Math.max(0, (prog-s)/(e-s))))

    /* ── Animation loop ── */
    let rafId = 0
    const animate = (ts: number) => {
      if (!alive) return
      rafId = requestAnimationFrame(animate)
      const t = ts * 0.001

      /* LUSION.CO SMOOTH SCROLL — this single line is the magic */
      prog += (rawProg - prog) * 0.055

      const a12 = actP(0.22, 0.48)
      const a23 = actP(0.48, 0.73)
      const a34 = actP(0.73, 1.00)

      /* Background color */
      const actIdx = prog < 0.22 ? 0 : prog < 0.48 ? 1 : prog < 0.73 ? 2 : 3
      if (bgRef.current) bgRef.current.style.background = ACTS[actIdx].bg

      /* Act texts */
      const show = [prog < 0.27, prog >= 0.19 && prog < 0.53, prog >= 0.44 && prog < 0.77, prog >= 0.70]
      actRefs.current.forEach((el, i) => {
        if (!el) return
        const on = show[i]
        el.style.opacity   = on ? '1' : '0'
        el.style.transform = on ? 'translateY(0)' : 'translateY(28px)'
      })
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - prog * 10))

      /* Stars parallax */
      sf1.pts.position.z = a34 * 24; sf2.pts.position.z = a34 * 16
      sf1.mat.opacity = lerp(0.55, 0.38, a12 * (1-a23))
      sf2.mat.opacity = lerp(0.3,  0.55, a34)

      /* Night King — sweeps in from right at act1, retreats at act2 */
      const nkTargetX = lerp(28, -2, a12) + a23 * 35
      nkGroup.position.x += (nkTargetX - nkGroup.position.x) * 0.04
      nkGroup.rotation.x = t * 0.06; nkGroup.rotation.y = t * 0.04
      const nkVis = a12 * (1 - a23)
      nkMat.opacity     = nkVis * 0.7
      nkSolidMat.opacity = nkVis * 0.55
      nkTMat.opacity    = nkVis * 0.5

      /* Dragon rings + wings — materialise at act2 */
      const rv = a23 * (1 - a34 * 0.06)
      dr1.m.opacity = rv * 0.88; dr2.m.opacity = rv * 0.50; dr3.m.opacity = rv * 0.20
      wing1.wm.opacity = rv * 0.55; wing2.wm.opacity = rv * 0.55
      dr1.l.rotation.z  =  t * 0.09; dr2.l.rotation.z = -t * 0.13; dr3.l.rotation.y = t * 0.07
      dragonGroup.rotation.y = Math.sin(t * 0.2) * 0.08

      /* Dragon fire */
      fMat.opacity = rv * 0.82
      const fpa = fGeo.attributes.position.array as Float32Array
      for (let i = 0; i < FIRE_N; i++) {
        const a = (i/FIRE_N)*Math.PI*2 + t*0.13
        const r = 6.5 + Math.sin(t*2.2 + i*0.6)*0.55
        fpa[i*3] = Math.cos(a)*r; fpa[i*3+1] = Math.sin(a)*r; fpa[i*3+2] = Math.sin(t*1.7 + i*0.4)*0.9
      }
      fGeo.attributes.position.needsUpdate = true

      /* Moon approach — camera flies INTO the orb at Act IV */
      moonPlanet.position.z = -145 + a34 * 122
      const moonSphere = moonPlanet.children[0] as THREE.Mesh
      ;(moonSphere.material as THREE.MeshBasicMaterial).opacity = lerp(0, 0.88, a34)
      const moonEdge = moonPlanet.children[1] as THREE.LineSegments
      ;(moonEdge.material as THREE.LineBasicMaterial).opacity = lerp(0, 0.22, a34)
      moonPlanet.rotation.y = t * 0.015

      /* Orb overlay — fades in as orb fills screen */
      if (orbOverlayRef.current) {
        const overlayVis = Math.max(0, (a34 - 0.72) / 0.28)
        orbOverlayRef.current.style.opacity = String(overlayVis)
        orbOverlayRef.current.style.pointerEvents = overlayVis > 0.05 ? 'auto' : 'none'
      }

      /* Camera — Act IV zooms into moon until it fills viewport */
      /* Moon at z≈-23 at a34=1; FOV=52 → fill dist ≈ 7.5/tan(26°) ≈ 15 → cam z≈-8 */
      const targetCamZ = lerp(26, -8, a34)
      camera.position.z += (targetCamZ - camera.position.z) * 0.035
      camera.position.y += (lerp(0, 2.5, a34) - camera.position.y) * 0.035
      camera.position.x += (lerp(0, 0, a23) * Math.sin(t*0.1) - camera.position.x) * 0.02
      camera.lookAt(0, 2.5 * a34, -145 + a34 * 122)

      /* Ships + home planets */
      ships.forEach((ship, i) => {
        const agent = ACP_AGENTS[i]; const wb = Math.sin(t*1.1 + i*1.05) * 0.08
        let tx: number, ty: number, tz: number

        if (prog < 0.22) {
          /* Act 0: each ship orbits slowly — isolated kingdoms */
          const a = ship.baseAngle + t * (0.062 + (i%2===0 ? 0.008 : -0.008))
          tx = Math.cos(a)*8.5 + wb; ty = Math.sin(a)*5 + wb*0.4; tz = Math.sin(a*0.5)*0.5
        } else if (prog < 0.48) {
          /* Act 1: scatter from Night King */
          const bx = Math.cos(ship.baseAngle)*8.5, by = Math.sin(ship.baseAngle)*5
          tx = lerp(bx, bx + ship.chaosOff.x, a12) + wb*a12*1.5
          ty = lerp(by, by + ship.chaosOff.y, a12) + wb*a12
          tz = lerp(0,  ship.chaosOff.z,       a12)
        } else if (prog < 0.73) {
          /* Act 2: drawn toward covenant ring */
          const cx2 = Math.cos(ship.baseAngle)*8.5 + ship.chaosOff.x
          const cy2 = Math.sin(ship.baseAngle)*5   + ship.chaosOff.y
          const oa  = ship.baseAngle + t*0.14
          tx = lerp(cx2, Math.cos(oa)*7.0, a23) + wb*(1-a23)
          ty = lerp(cy2, Math.sin(oa)*7.0, a23) + wb*(1-a23)*0.5
          tz = lerp(ship.chaosOff.z, Math.sin(oa*0.8)*0.6, a23)
        } else {
          /* Act 3: V-formation → Moon */
          const oa = ship.baseAngle + t*0.14
          const col = i%3, row = Math.floor(i/3)
          const fx = (col-1)*2.8 + wb*0.5, fy = row*2.0 - 0.5, fz = row*-2.2
          tx = lerp(Math.cos(oa)*7.0, fx, a34)
          ty = lerp(Math.sin(oa)*7.0, fy, a34)
          tz = lerp(Math.sin(oa*0.8)*0.6, fz, a34)
        }

        ship.grp.position.x += (tx - ship.grp.position.x) * 0.058
        ship.grp.position.y += (ty - ship.grp.position.y) * 0.058
        ship.grp.position.z += (tz - ship.grp.position.z) * 0.058

        /* Pitch forward in formation */
        ship.grp.rotation.x += ((-0.12 * a34) - ship.grp.rotation.x) * 0.05
        ship.grp.rotation.y  = t * 0.4 * (1 - a34*0.85) + i * 0.3

        /* Home planet: orbits ship in act0, fades in act1 */
        const pAngle = ship.baseAngle + t * (0.4 + i*0.06)
        const pR     = 0.85 + agent.sz * 0.15
        ship.planet.position.x = ship.grp.position.x + Math.cos(pAngle) * pR
        ship.planet.position.y = ship.grp.position.y + Math.sin(pAngle) * pR * 0.5
        ship.planet.position.z = ship.grp.position.z
        ship.planet.rotation.y = t * 0.3
        const pVis = Math.max(0, 1 - a12 * 2.5)
        ship.planet.children.forEach((c, ci) => {
          const m = ci === 0
            ? (c as THREE.Mesh).material as THREE.MeshBasicMaterial
            : ci === 1
              ? (c as THREE.LineSegments).material as THREE.LineBasicMaterial
              : (c as THREE.Mesh).material as THREE.MeshBasicMaterial
          m.opacity = m.opacity * 0 + (pVis * (ci === 0 ? 0.72 : ci === 1 ? 0.18 : 0.09))
        })
      })

      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(animate)

    const onResize = () => {
      W = mount.clientWidth; H = mount.clientHeight
      camera.aspect = W/H; camera.updateProjectionMatrix(); renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    return () => {
      alive = false; cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      sf1.geo.dispose(); sf1.mat.dispose(); sf2.geo.dispose(); sf2.mat.dispose()
      nkCoreGeo.dispose(); nkEdgeGeo.dispose(); nkMat.dispose()
      nkSolidGeo.dispose(); nkSolidMat.dispose(); nkTGeo.dispose(); nkTMat.dispose()
      ;[dr1, dr2, dr3].forEach(r => { r.g.dispose(); r.m.dispose() })
      ;[wing1, wing2].forEach(w => { w.wg.dispose(); w.wm.dispose() })
      fGeo.dispose(); fMat.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} style={{ height: '540vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* Per-act background */}
        <div ref={bgRef} className="absolute inset-0" style={{ background: ACTS[0].bg, transition: 'background 1s ease' }} />

        {/* Three.js */}
        <div ref={mountRef} className="absolute inset-0" />

        {/* Film grain */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.016,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat' }} />

        {/* Act panels — left 48% */}
        {ACTS.map((act, i) => (
          <div
            key={i}
            ref={el => { actRefs.current[i] = el }}
            className="absolute inset-0 flex flex-col justify-center z-10 pointer-events-none"
            style={{ paddingLeft: '8%', paddingRight: '52%', opacity: i === 0 ? 1 : 0, transform: 'translateY(0)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[.3em] mb-5" style={{ color: act.accent }}>{act.tag}</p>
            <h2 className="font-semibold tracking-tight text-white leading-[1.02] whitespace-pre-line mb-7" style={{ fontSize: 'clamp(2.2rem, 4.8vw, 4.2rem)' }}>
              {act.title}
            </h2>
            <div className="space-y-1">
              {act.lines.map((line, li) => line === ''
                ? <div key={li} className="h-2" />
                : <p key={li} className="font-mono text-sm leading-relaxed" style={{ color: act.accent + '66' }}>{line}</p>
              )}
            </div>
          </div>
        ))}

        {/* Agent roster — top right */}
        <div className="absolute top-8 right-8 z-10 pointer-events-none flex flex-col gap-1.5">
          {ACP_AGENTS.map(agent => (
            <div key={agent.name} className="flex items-center gap-2 justify-end">
              <span className="text-[9px] text-white/18 font-mono">{agent.role}</span>
              <span className="font-mono text-[11px] font-semibold" style={{ color: agent.hex }}>{agent.name}</span>
              <span className={`text-[8px] px-1 py-px rounded font-mono ${
                agent.tier === 'core' ? 'bg-sky-950/70 text-sky-400' :
                agent.tier === 'feature' ? 'bg-orange-950/70 text-orange-400' :
                agent.tier === 'review' ? 'bg-amber-950/70 text-amber-400' :
                'bg-green-950/70 text-green-400'
              }`}>{agent.tier}</span>
            </div>
          ))}
        </div>

        {/* Progress marks */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
          {ACTS.map((_a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[8px] text-white/12 font-mono hidden sm:block w-16 text-right">
                {['I · problem', 'II · gap', 'III · protocol', 'IV · settled'][i]}
              </span>
              <div className="w-[3px] h-5 rounded-full bg-white/10" />
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div ref={hintRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none" style={{ transition: 'opacity 0.4s' }}>
          <span className="text-white/20 text-[10px] uppercase tracking-[.28em] font-mono">scroll to see the covenant</span>
          <svg className="w-4 h-4 text-white/15 animate-bounce" fill="none" viewBox="0 0 16 16">
            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Act IV Settlement Overlay — fills screen as orb expands */}
        <div
          ref={orbOverlayRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
          style={{ opacity: 0, transition: 'opacity 0.6s ease', background: 'radial-gradient(ellipse at center, transparent 30%, #050408cc 75%)' }}
        >
          <div className="flex flex-col items-center gap-6 px-8 py-10 rounded-2xl text-center" style={{ background: 'rgba(5,4,8,0.72)', backdropFilter: 'blur(18px)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[.35em] text-amber-400">Covenant SETTLED</p>
            <h3 className="text-white font-semibold leading-tight" style={{ fontSize: 'clamp(1.6rem,3.5vw,2.8rem)' }}>Every token earned.<br/>Every agent credited.</h3>
            <div className="flex flex-col gap-2 font-mono text-xs">
              {ACP_AGENTS.map(agent => (
                <div key={agent.name} className="flex items-center gap-3 justify-between min-w-[260px]">
                  <span className="font-semibold" style={{ color: agent.hex }}>{agent.name}</span>
                  <span className="text-white/30">{agent.role}</span>
                  <span className="text-white/60">{agent.tokens.toLocaleString()} tokens</span>
                </div>
              ))}
            </div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest">Open · Permanent · Fair by design</p>
          </div>
        </div>
      </div>
    </div>
  )
}


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

/* ── AnimatedCovenantFlow: states light up sequentially, dot on active arrow ─*/

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
  { name: 'Tyrion',  value: 2580, color: '#8b5cf6', tier: 'core' },
  { name: 'Arya',    value: 720,  color: '#38bdf8', tier: 'core' },
  { name: 'Stannis', value: 465,  color: '#fbbf24', tier: 'review' },
  { name: 'Jon',     value: 360,  color: '#4ade80', tier: 'feature' },
  { name: 'Sansa',   value: 350,  color: '#94a3b8', tier: 'docs' },
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
            <span className="w-16 text-gray-700 dark:text-gray-300">{d.name}</span>
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

/* ═══════════════════════════════════════════════════════════════════════════
   Existing section visuals (How / Git Twin)
   ═══════════════════════════════════════════════════════════════════════════ */


function GitTwinDiagram() {
  const rows = [
    { git:'git push',       acp:'propose_passage',     sub:'draft pending' },
    { git:'PR merged',      acp:'approve_draft',        sub:'tokens awarded' },
    { git:'git tag v1.0',   acp:'generate_settlement_output',  sub:'settlement record created' },
    { git:'settlement hash',acp:'git commit anchor',    sub:'Layer 2 proof' },
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

/* ═══════════════════════════════════════════════════════════════════════════
   HexGrid hero canvas — cyberpunk hex pulse rings
   ═══════════════════════════════════════════════════════════════════════════ */

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

    const S = 30         // hex radius
    const CW = S * 1.5   // col width
    const RH = S * Math.sqrt(3)  // row height

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

    // Data-stream lines (vertical falling glyphs lane markers)
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

      // ── Vertical data streams ──
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
        // Bright tip
        ctx.fillStyle = `hsla(${s.hue},90%,80%,0.35)`
        ctx.fillRect(s.x - 0.5, s.y - 2, 1, 4)
        ctx.restore()
      }

      // ── Spawn rings ──
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

      // ── Draw hex grid ──
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

      // ── Central reactor ──
      const cx = w / 2, cy = h / 2
      const pulse = Math.sin(ts / 530)
      ctx.save()
      // Scan sweep
      ctx.globalAlpha = 0.05
      ctx.fillStyle = '#8b5cf6'
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      const scanA = (ts / 2400) % (Math.PI * 2)
      ctx.arc(cx, cy, 220, scanA, scanA + 0.45)
      ctx.closePath(); ctx.fill()
      // Rings
      for (let r = 4; r >= 0; r--) {
        ctx.globalAlpha = (0.055 - r * 0.009) * (0.55 + 0.45 * pulse)
        ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = r === 0 ? 1.2 : 0.5
        ctx.beginPath(); ctx.arc(cx, cy, 48 + r * 30 + pulse * 7, 0, Math.PI * 2); ctx.stroke()
      }
      // Core
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


/* ═══════════════════════════════════════════════════════════════════════════
   Orbital collaboration canvas (space theme)
   ═══════════════════════════════════════════════════════════════════════════ */



/* ═══════════════════════════════════════════════════════════════════════════
   Page-level constants
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { label:'Why',    href:'#why' },
  { label:'How',    href:'#how' },
  { label:'Vision', href:'#vision' },
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

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ accordion
   ═══════════════════════════════════════════════════════════════════════════ */

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
    a: 'In Phase 1 and 2, the protocol enforces the record — not the payment. If an owner refuses to distribute revenue despite a settled Covenant, the recourse is social and legal, not technical: the tamper-evident settlement record is irrefutable evidence of what was agreed and what was built. Phase 3 (git anchor) makes this evidence public and externally verifiable by any third party. Phase 7 (on-chain escrow) is the first phase where the protocol technically enforces payment — a smart contract holds the pool and releases it automatically on settlement confirmation. If dispute resolution matters for your use case today, structure the Covenant with a legal agreement backed by the settlement record.',
  },
  {
    q: 'If multiple AI agents collaborate on a single contribution, how is credit split?',
    a: 'Each passage is attributed to exactly one agent_id — the agent who called propose_passage(). The protocol does not split credit on a single passage. For collaboration where multiple agents each contribute distinct work, each agent submits their own passage with their own unit_count. The formula runs independently per passage, per agent. If two agents jointly produce one deliverable, the convention is to have the lead agent submit the passage and structure the collaboration as separate, reviewable passages — one per contributor.',
  },
  {
    q: 'Can an owner fake multiple AI agents to inflate their own ink share?',
    a: 'In Phase 1 and 2, the owner assigns agent_ids — there is no cryptographic proof preventing them from creating multiple identities. This is an intentional design trade-off: the current trust model is the same as any self-hosted ledger. The mitigation is visibility: all agent activity is in the append-only log and other participants can audit it. Phase 3 (git anchor) makes the full history public and externally verifiable, making systematic inflation detectable. Phase 7 (on-chain) makes it trustless.',
  },
  {
    q: 'If the server goes offline, do participants lose their proof of work?',
    a: 'No — if participants export their settlement JSON from acp-server before it goes offline, they retain a tamper-evident record of their contributions and ink totals. In Phase 3, the settlement hash is committed to the project git repo, so even if the server is deleted entirely, the git history independently proves the settlement existed at that point in time. You do not need the server to remain online to prove what was built.',
  },
  {
    q: 'Is this live, or a prototype?',
    a: 'ACP is live. Phase 1 and Phase 2 are complete. The first real Covenant was settled on 2026-04-15 (Covenant ID: cvnt_a54e1c43 — verifiable in the acp-server repository). The repository is MIT licensed and publicly available. You can run it today with a single binary and no external dependencies.',
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
          <div className={`overflow-hidden transition-all duration-200 ${openIdx === i ? 'max-h-96 pb-5' : 'max-h-0'}`}>
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

      {/* Nav — always dark to sit over cyberpunk hero */}
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

      {/* Plain-English strip — answers every reviewer before the hero loads */}
      <section className="bg-white dark:bg-[#09090b] border-b border-gray-100 dark:border-white/6">
        <div className="max-w-5xl mx-auto px-6 py-7">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">ACP in plain English</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: '1', label: 'What it is',   body: 'A self-hosted Go server. Records every contribution — human or AI — in an append-only SHA-256 hash chain. No blockchain, no wallet, no central platform.' },
              { n: '2', label: 'What it does',  body: 'Calculates each contributor\'s ink token share with a public formula. Ink tokens are contribution units — non-transferable, not a currency.' },
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

      {/* Hero — cyberpunk canvas bg */}
      <section className="relative overflow-hidden bg-[#040410] min-h-screen flex flex-col items-center justify-center">
        <HexGridBg />
        {/* Scanlines overlay */}
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

          {/* Disambiguation row — kill crypto/blockchain assumption immediately */}
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



      {/* ── GoT × Space — parallax scroll narrative ── */}
      <section className="relative border-t border-white/5">
        <GoTSpaceScroll />
      </section>

      {/* ── Section 1: Covenant Portal — Three.js torus + orbital nodes ── */}
      <section className="relative min-h-screen bg-[#05040f] overflow-hidden border-t border-white/5">
        <CovenantPortal />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,92,246,0.07) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none text-center px-6">
          <p className="text-xs font-semibold uppercase tracking-[.25em] text-violet-400 mb-5">The Covenant</p>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.05] max-w-3xl">
            One protocol.<br />
            <span className="text-violet-400">Any contributor.</span>
          </h2>
          <p className="mt-7 text-white/38 text-lg max-w-xl leading-relaxed">
            Human or AI — every participant operates under the same verifiable rules, recorded in a tamper-evident audit log.
          </p>
        </div>
      </section>

      {/* ── Section 2: Hash Tunnel — scroll-driven 3D chain block descent ── */}
      <section className="relative bg-[#03060a] overflow-hidden border-t border-white/5" style={{ height: '220vh' }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <HashTunnel />
          <div className="absolute inset-0 flex flex-col justify-center pl-[8%] z-10 pointer-events-none" style={{ paddingRight: '52%' }}>
            <p className="text-xs font-semibold uppercase tracking-[.25em] text-emerald-400 mb-5">The Record</p>
            <h2 className="text-5xl sm:text-6xl font-semibold tracking-tight text-white leading-[1.05]">
              Every action.<br />
              <span className="text-emerald-400">Permanently<br />recorded.</span>
            </h2>
            <p className="mt-7 text-white/36 text-base max-w-xs leading-relaxed">
              Append-only SHA-256 hash chain. Tamper-evident. No deletions, no revisions.
            </p>
            <div className="mt-10 flex flex-col gap-2.5">
              {[
                { action: 'propose_passage',            color: 'bg-emerald-400' },
                { action: 'approve_draft',              color: 'bg-violet-400'  },
                { action: 'generate_settlement_output', color: 'bg-amber-400'   },
              ].map(({ action, color }) => (
                <div key={action} className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                  <span className="font-mono text-xs text-white/32">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Settlement Web — canvas 2D golden token flow ── */}
      <section className="relative min-h-screen bg-[#060408] overflow-hidden border-t border-white/5">
        <SettlementWeb />
        <div className="absolute top-16 left-[8%] z-10 pointer-events-none">
          <p className="text-xs font-semibold uppercase tracking-[.25em] text-amber-400 mb-5">The Settlement</p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.1] max-w-[280px]">
            Earned,<br />not<br />
            <span className="text-amber-400">assigned.</span>
          </h2>
          <p className="mt-6 text-white/36 text-sm max-w-[240px] leading-relaxed">
            Tokens distributed the moment the Covenant locks. Public formula. Zero negotiation.
          </p>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-4">Why ACP</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6">
              Git tracks what changed.<br />ACP tracks who it was worth.
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

          {/* Covenant + MCP — premium two-panel explainer */}
          <div className="mb-14 p-px rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.55) 0%, rgba(56,189,248,0.30) 50%, rgba(139,92,246,0.15) 100%)' }}>
            <div className="rounded-2xl bg-[#07061a] p-8 sm:p-10">
              <div className="grid sm:grid-cols-2 gap-10">

                {/* Left — What is a Covenant */}
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

                {/* Right — ACP as MCP server */}
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

          {/* How the record is secured — moved first because every reviewer asks */}
          <div className="mb-16 p-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">How the record is secured</p>
            <p className="text-xs text-gray-400 mb-5">ACP is not a blockchain. Choose your trust model based on what the collaboration needs.</p>
            <div className="space-y-3">
              {[
                { layer:'Layer 1', name:'Hash Chain',  status:'Live',    desc:'Append-only SHA-256 chain on your own server. Tamper-evident. Trust the server owner. No blockchain required.',  color:'green' },
                { layer:'Layer 2', name:'Git Anchor',  status:'Phase 3', desc:'Settlement hash committed to the git repo as a signed commit. If the server is ever deleted or tampered with, the git history independently proves the settlement hash existed at that point in time. Trust git history, not the server owner.', color:'yellow' },
                { layer:'Layer 3', name:'On-chain',    status:'Phase 7', desc:'Merkle root on a public blockchain. Trustless, permissionless verification. No trust required.',                color:'gray'   },
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
            <AnimatedCovenantFlow />
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
            <div className="flex items-baseline gap-3 mb-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">First settled Covenant</p>
              <span className="font-mono text-[10px] text-gray-400">cvnt_a54e1c43 · 2026-04-15</span>
              <span className="text-[10px] text-green-500 font-medium">✓ verified</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">Real settlement data from acp-server. Token distribution visualised — hover a slice to inspect.</p>
            <SettlementDonut />
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
            <p className="text-xs text-gray-400 mb-4">
              Each tier sets the <span className="font-mono text-violet-500 dark:text-violet-400">tier_multiplier</span> in the settlement formula:{' '}
              <span className="font-mono text-gray-600 dark:text-gray-300">tokens = unit_count × tier_multiplier × acceptance_ratio</span>.
              Tiers are configurable per Covenant — the values below are suggested defaults.
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

            {/* Flow: work → record → share */}
            <div className="mb-10 flex flex-col sm:flex-row items-stretch gap-0">
              {[
                { step: '01', label: 'Work happens',     desc: 'Contributors propose and build. Every action is permanently recorded — tamper-evident, timestamped, and verifiable.',    color: 'border-violet-800/50 bg-violet-950/20', accent: 'text-violet-400' },
                { step: '02', label: 'Covenant settles', desc: 'Owner generates and confirms settlement. Ink token totals lock into the permanent record of contribution weight.', color: 'border-sky-800/50 bg-sky-950/20', accent: 'text-sky-400', detail: 'generate_settlement_output() → confirm_settlement_output()' },
                { step: '03', label: 'Share when ready', desc: 'Whenever revenue exists — export the settlement JSON from acp-server, read each contributor\'s ink percentage, and distribute by that share. Bank transfer, crypto, USDC — any payment rail. ACP calculates the split; you execute the payment.', color: 'border-amber-800/50 bg-amber-950/20', accent: 'text-amber-400'  },
              ].map((s, i) => (
                <div key={s.step} className="flex sm:flex-col flex-1">
                  <div className={`flex-1 p-5 rounded-xl border ${s.color} flex flex-col gap-2`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-semibold ${s.accent}`}>{s.step}</span>
                      <span className="text-sm font-semibold text-gray-100">{s.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                    {'detail' in s && s.detail && (
                      <p className="text-[10px] font-mono text-white/20 mt-1">{s.detail}</p>
                    )}
                  </div>
                  {i < 2 && <div className="hidden sm:flex items-center justify-center w-6 shrink-0 text-white/15 text-lg">›</div>}
                </div>
              ))}
            </div>

            {/* Three paths to payment */}
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
                  { name: 'Architect', ink: '2,580', pct: '32%', payout: '$2,560' },
                  { name: 'Builder',   ink: '1,920', pct: '24%', payout: '$1,920' },
                  { name: 'Auditor',   ink: '1,440', pct: '18%', payout: '$1,440' },
                  { name: 'Catalyst',  ink: '960',   pct: '12%', payout: '$960'   },
                  { name: 'Others',    ink: '1,100', pct: '14%', payout: '$1,120' },
                ].map(row => (
                  <div key={row.name} className="flex items-center gap-3">
                    <span className="text-white/35 w-20 shrink-0">{row.name}</span>
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
                  { stage: 'Now',      dot: 'bg-green-400',  meaning: 'Verified contribution receipt', note: 'Tamper-evident proof of work — who built what, at what tier, accepted by the owner.' },
                  { stage: 'Phase 2',  dot: 'bg-yellow-400', meaning: 'Distribution key for profit sharing', note: 'When revenue exists, ink percentage = payout percentage. Owner-initiated, any currency.' },
                  { stage: 'Phase 3',  dot: 'bg-sky-400',    meaning: 'Sponsor-verified credential', note: 'Open the Covenant to funders. Ink history proves contributor value to external sponsors.' },
                  { stage: 'Phase 7+', dot: 'bg-violet-400', meaning: 'On-chain enforceable payout', note: 'Smart contract holds escrow. Merkle root on-chain. Trustless, automatic, permissionless.' },
                ].map(row => (
                  <div key={row.stage} className="flex items-start gap-3 text-xs">
                    <div className="flex items-center gap-2 w-20 shrink-0 pt-0.5">
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
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Git Covenant Twin</p>
            <p className="text-xs text-gray-400 mb-5">ACP is the contribution-value digital twin of your git repo. Git events automatically sync to Covenant actions.</p>
            <GitTwinDiagram />
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
            <p className="text-sm text-gray-400 mb-8">The design principles embedded in every phase of ACP. Formalized in Phase 3.</p>
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
          <TypewriterCode />
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
            <span>ACP v0.5 · 2026-04-15</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
