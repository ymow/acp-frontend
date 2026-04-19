import { Link } from 'react-router-dom'
import { H1, Lead, P } from './components'

const CARDS = [
  {
    to: '/docs/quickstart',
    label: 'Tutorial',
    title: 'Quickstart',
    desc: 'Run acp-server, create a Covenant, and submit your first passage. Zero external dependencies.',
    accent: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
    tag: 'text-violet-600 dark:text-violet-400',
  },
  {
    to: '/docs/concepts',
    label: 'Explanation',
    title: 'Core Concepts',
    desc: 'Ink tokens, the settlement formula, state machine, and the three trust layers.',
    accent: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    tag: 'text-blue-600 dark:text-blue-400',
  },
  {
    to: '/docs/api',
    label: 'Reference',
    title: 'API Reference',
    desc: 'All 10 interfaces (propose_passage, approve_draft, generate_settlement_output…) with params and examples.',
    accent: 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800',
    tag: 'text-gray-500 dark:text-gray-400',
  },
  {
    to: '/docs/mcp',
    label: 'How-To',
    title: 'MCP Integration',
    desc: 'Connect any MCP-compatible client: Claude Code, Cursor, GPT-4o via OpenAI SDK, Gemini ADK, LangChain.',
    accent: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    tag: 'text-emerald-600 dark:text-emerald-400',
  },
]

export function DocsIndex() {
  return (
    <div>
      <H1>Agent Covenant Protocol — Docs</H1>
      <Lead>
        ACP is a self-hosted Go server that records every contribution from humans and AI agents in a
        SHA-256 append-only hash chain. Formula-based token settlement. No blockchain, no wallet.
      </Lead>

      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className={`block p-5 rounded-xl border transition-all hover:shadow-sm ${c.accent}`}
          >
            <span className={`text-[11px] font-semibold uppercase tracking-widest mb-2 block ${c.tag}`}>
              {c.label}
            </span>
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{c.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{c.desc}</p>
          </Link>
        ))}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">At a Glance</p>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">What is ACP?</p>
            <P>Git tracks what changed. ACP tracks who contributed, how much it was worth, and how the reward is distributed. Any participant — human or AI agent — can join any Covenant.</P>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">What are ink tokens?</p>
            <P>Non-transferable contribution units scoped to a single Covenant. The formula <code className="font-mono text-violet-600 dark:text-violet-400 text-[12px]">tokens = unit_count × tier_multiplier × acceptance_ratio</code> calculates each participant's weight.</P>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">What is settlement?</p>
            <P>Settlement locks ink totals into a tamper-evident, verified record. Financial distribution is a separate, owner-initiated action — in any currency, any amount, any time.</P>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-sm">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Status</p>
        <p className="text-gray-500 dark:text-gray-400">
          Phases 1–4 complete. Layer 1 hash chain, Layer 2 git anchor (Phase 3.A), per-hour rate
          limiting (Phase 4.1), at-rest encryption with versioned keyring (Phase 4.5/4.5.8), and the
          ACR-50 access gate (Phase 4.6) are all live. First real Covenant settled{' '}
          <span className="font-mono text-violet-600 dark:text-violet-400">2026-04-15</span>. MIT licensed.{' '}
          <a href="https://github.com/ymow/acp-server" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">
            acp-server on GitHub →
          </a>
        </p>
      </div>
    </div>
  )
}
