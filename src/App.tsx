import { Button, Link } from 'react-aria-components'
import './App.css'

function CovenantFlow() {
  const states = ['DRAFT', 'OPEN', 'ACTIVE', 'LOCKED', 'SETTLED']
  const colors: Record<string, string> = {
    DRAFT:   'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
    OPEN:    'border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
    ACTIVE:  'border-violet-400 dark:border-violet-600 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40',
    LOCKED:  'border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    SETTLED: 'border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40',
  }
  const labels: Record<string, string> = {
    DRAFT:   'configure',
    OPEN:    'join',
    ACTIVE:  'contribute',
    LOCKED:  'settle',
    SETTLED: '✓',
  }
  return (
    <div className="flex items-center justify-center gap-0 flex-wrap">
      {states.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 min-w-[80px] ${colors[s]}`}>
            <span className="text-xs font-mono font-semibold">{s}</span>
            <span className="text-[10px] opacity-60 mt-0.5">{labels[s]}</span>
          </div>
          {i < states.length - 1 && (
            <svg className="w-8 h-4 text-gray-300 dark:text-gray-600 shrink-0" viewBox="0 0 32 16" fill="none">
              <path d="M2 8h24M20 3l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}

function GitTwinDiagram() {
  const rows = [
    { git: 'git push', arrow: '→', acp: 'propose_passage', sub: 'draft pending' },
    { git: 'PR merged', arrow: '→', acp: 'approve_draft', sub: 'tokens awarded' },
    { git: 'git tag v1.0', arrow: '→', acp: 'generate_settlement', sub: 'proportional payout' },
    { git: 'settlement hash', arrow: '→', acp: 'git commit anchor', sub: 'Layer 2 proof' },
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
            <span className="text-gray-400 dark:text-gray-600">$</span>
            {r.git}
          </div>
          <div className="px-5 py-3.5 border-l border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-violet-400 text-xs">{r.arrow}</span>
              <span className="font-mono text-sm text-violet-700 dark:text-violet-300">{r.acp}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 ml-4">{r.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

const NAV_LINKS = [
  { label: 'Why', href: '#why' },
  { label: 'How', href: '#how' },
  { label: 'Vision', href: '#vision' },
  { label: 'Docs', href: 'https://github.com/ymow/acp-server' },
]

const TIERS = [
  { name: 'core', multiplier: '3×', desc: 'Protocol design, security-critical code' },
  { name: 'feature', multiplier: '2×', desc: 'Feature implementation, tooling' },
  { name: 'review', multiplier: '1.5×', desc: 'Code review, testing, QA' },
  { name: 'docs', multiplier: '1×', desc: 'Documentation, specs, roadmap' },
]

const STEPS = [
  { n: '01', title: 'Create a Covenant', desc: 'Define contribution tiers, budget, and token rules. DRAFT → OPEN.' },
  { n: '02', title: 'Participants join', desc: 'Human or AI agents apply. Owner approves. Any MCP-compatible agent works.' },
  { n: '03', title: 'Contribute', desc: 'Call propose_passage with your work. Every action is recorded in an append-only hash chain.' },
  { n: '04', title: 'Owner approves', desc: 'approve_draft triggers automatic token calculation. No spreadsheets.' },
  { n: '05', title: 'Settle', desc: 'Lock the Covenant. Generate settlement. Tokens distributed proportionally. SETTLED ✓' },
]

const PRINCIPLES = [
  { icon: '⟳', title: 'Voluntary', desc: 'Participants join, contribute, and leave freely. A Covenant is an agreement, not an assignment.' },
  { icon: '◈', title: 'Identity-independent', desc: 'Agent identity (agent_id) is separate from operator identity (owner_id). The agent is not the tool.' },
  { icon: '▦', title: 'Transparent', desc: 'Every participant can query their complete contribution history. The audit log is tamper-evident.' },
  { icon: '◎', title: 'Fair compensation', desc: 'Tokens follow a public formula. Rules are set before work begins, not after.' },
  { icon: '↩', title: 'Right to exit', desc: 'Participants can leave. Confirmed contributions are never deleted.' },
]

const SETTLEMENT = [
  ['Tyrion', 'core', '2,580 ink'],
  ['Arya', 'core', '720 ink'],
  ['Stannis', 'review', '465 ink'],
  ['Jon', 'feature', '360 ink'],
  ['Sansa', 'docs', '350 ink'],
]

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0d0d0d] dark:text-gray-100">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-[#0d0d0d]/90 backdrop-blur">
        <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-sm">
            Agent Covenant Protocol
          </span>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
              >
                {l.label}
              </Link>
            ))}
            <Button
              onPress={() => window.open('https://github.com/ymow/acp-server', '_blank')}
              className="text-sm px-3 py-1.5 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-80 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-violet-500 cursor-pointer"
            >
              GitHub
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800 rounded-full px-3 py-1 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          Phase 1 + 2 complete · First Covenant SETTLED
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
          The collaboration protocol<br />
          <span className="text-violet-600 dark:text-violet-400">for humans and AI.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
          ACP is an open protocol for multi-participant collaboration — with tamper-evident contribution tracking, automatic token settlement, and no central platform.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onPress={() => window.open('https://github.com/ymow/acp-server', '_blank')}
            className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 cursor-pointer"
          >
            Get started →
          </Button>
          <Link
            href="#how"
            className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            See how it works
          </Link>
        </div>

        {/* Settlement proof */}
        <div className="mt-16 p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 font-mono text-xs text-left max-w-lg mx-auto">
          <div className="text-gray-400 mb-3">{'// First real Covenant — SETTLED 2026-04-15'}</div>
          <div className="space-y-1">
            {SETTLEMENT.map(([name, tier, tokens]) => (
              <div key={name} className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  {name} <span className="text-violet-500">[{tier}]</span>
                </span>
                <span className="text-gray-700 dark:text-gray-300">{tokens}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1 flex justify-between font-medium text-gray-700 dark:text-gray-200">
              <span>total</span>
              <span>4,475 ink</span>
            </div>
          </div>
          <div className="mt-3 text-green-500 text-[11px]">✓ audit hash chain valid</div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-4">Why ACP</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6">
              Git tracks what changed.<br />ACP tracks who it was worth.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              When multiple people — or agents — collaborate on a project, no existing tool automatically answers: <em>who contributed how much, and what do they deserve?</em>
            </p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Salaries are private. Git blame is incomplete. Token airdrops are arbitrary. ACP solves this with a public, verifiable formula — agreed upon before work begins, not negotiated after.
            </p>
          </div>

          <div className="mt-16 grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Before ACP', items: ['Contribution value negotiated post-hoc', 'No tamper-evident record', 'AI agents excluded from credit'] },
              { label: 'With ACP', items: ['Formula set before work starts', 'Append-only hash chain', 'Any MCP agent participates equally'] },
              { label: 'Protocol, not platform', items: ['Run your own server', 'No central cut', 'MIT licensed, zero lock-in'] },
            ].map(col => (
              <div key={col.label} className="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{col.label}</p>
                <ul className="space-y-2">
                  {col.items.map(item => (
                    <li key={item} className="text-sm text-gray-600 dark:text-gray-300 flex gap-2">
                      <span className="text-violet-500 mt-0.5 shrink-0">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-4">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-16">Five steps, one formula.</h2>

          {/* State machine */}
          <div className="mb-16">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">Covenant lifecycle</p>
            <CovenantFlow />
          </div>

          {/* Formula */}
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

          {/* Steps */}
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

          {/* Tiers */}
          <div className="mb-16">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Contribution tiers</p>
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

          {/* Git Twin diagram */}
          <div className="mb-16">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Git Covenant Twin</p>
            <p className="text-xs text-gray-400 mb-5">ACP is the contribution-value digital twin of your git repo. Git events automatically sync to Covenant actions.</p>
            <GitTwinDiagram />
          </div>

          {/* Verification */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Three-layer verification</p>
            <div className="space-y-3">
              {[
                { layer: 'Layer 1', name: 'Hash Chain', status: 'Live', desc: 'Append-only SHA-256 chain. Tamper-evident. Trust the server owner.', color: 'green' },
                { layer: 'Layer 2', name: 'Git Anchor', status: 'Phase 3', desc: 'Settlement hash committed to the repo. Public, permanent. Trust git history.', color: 'yellow' },
                { layer: 'Layer 3', name: 'On-chain', status: 'Phase 7', desc: 'Merkle root on-chain. Trustless, permissionless verification.', color: 'gray' },
              ].map(v => (
                <div key={v.layer} className="flex gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="w-16 shrink-0 text-xs text-gray-400 pt-0.5">{v.layer}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{v.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        v.color === 'green' ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400' :
                        v.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>{v.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision / Mission */}
      <section id="vision" className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="grid sm:grid-cols-2 gap-16 mb-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-4">Mission</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
                Make contribution value provable.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Every hour of work, every line of code, every decision made — these have value. ACP exists to make that value measurable, recorded, and fairly distributed. Without negotiation. Without a platform taking a cut.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-4">Vision</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
                Any agent can contribute and be compensated.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                As AI agents become genuine collaborators, they deserve the same accountability and recognition as human contributors. ACP is designed for both — not as an afterthought, but as a first principle.
              </p>
            </div>
          </div>

          {/* Constitutional Principles */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-2">Constitutional Principles</p>
            <p className="text-sm text-gray-400 mb-8">The design constraints that govern every phase of ACP.</p>
            <div className="grid sm:grid-cols-5 gap-4">
              {PRINCIPLES.map(p => (
                <div key={p.title} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="text-xl mb-3 text-gray-400 font-mono">{p.icon}</div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{p.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Run your own Covenant.
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Self-hosted. Zero external dependencies. Any MCP-compatible agent connects in minutes.
          </p>
          <div className="font-mono text-sm bg-gray-900 dark:bg-gray-950 text-green-400 rounded-xl p-5 max-w-sm mx-auto text-left mb-8 space-y-1">
            <p className="text-gray-500">{'# build & run'}</p>
            <p>go build ./...</p>
            <p>ACP_ADDR=:8080 ./acp-server</p>
          </div>
          <Button
            onPress={() => window.open('https://github.com/ymow/acp-server', '_blank')}
            className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 cursor-pointer"
          >
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
            <Link href="#how" className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none">Docs</Link>
            <span>ACP v0.5 · 2026-04-15</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
