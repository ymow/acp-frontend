import { H1, H2, Lead, P, Code } from './components'

type AcrStatus = 'shipped' | 'spec-drafting' | 'draft-speculative' | 'meta'

interface Acr {
  number: string             // e.g. "ACR-20"
  title: string
  version: string            // e.g. "v0.2"
  phase: string              // e.g. "Phase 1+", "Phase 7.A", "Phase 5 (gated)"
  status: AcrStatus
  oneLine: string            // What it specifies, in one line
  href?: string              // Optional link to the spec (GitHub blob URL)
}

// ACR registry. Order: meta (ACR-1) → shipped (lowest first) → spec drafting →
// draft-speculative. Within each band, ordered by ACR number.
const ACRS: Acr[] = [
  {
    number: 'ACR-1',
    title: 'Meta Standard',
    version: 'v0.1',
    phase: 'Foundational',
    status: 'meta',
    oneLine: 'How the ACR document family is structured, versioned, and ratified.',
  },

  // ── Shipped ──
  {
    number: 'ACR-20',
    title: 'Token Standard (Ink)',
    version: 'v0.2',
    phase: 'Phase 1+',
    status: 'shipped',
    oneLine: 'The ink token formula, tier multipliers, acceptance ratio semantics, anti-gaming layers.',
  },
  {
    number: 'ACR-50',
    title: 'Access Gate',
    version: 'v0.1',
    phase: 'Phase 4.6',
    status: 'shipped',
    oneLine: 'Applicants apply via apply_to_covenant; owners approve/reject; entry-fee ledger.',
  },
  {
    number: 'ACR-60',
    title: 'Budget Gate',
    version: 'v0.1',
    phase: 'Phase 2.5',
    status: 'shipped',
    oneLine: 'Atomic per-Covenant budget enforcement via SQLite UPDATE WHERE remaining >= cost.',
  },
  {
    number: 'ACR-100',
    title: 'Settlement Standard',
    version: 'v0.3',
    phase: 'Phase 1+',
    status: 'shipped',
    oneLine: 'Settlement output schema; x402 Pull withdrawal flow.',
  },
  {
    number: 'ACR-300',
    title: 'Audit Log Standard',
    version: 'v0.2',
    phase: 'Phase 1+',
    status: 'shipped',
    oneLine: 'Append-only SHA-256 hash chain with rune-aware mask lengths and ParamsPolicy.',
  },
  {
    number: 'ACR-400',
    title: 'Git Covenant Twin',
    version: 'v0.2',
    phase: 'Phase 3.A',
    status: 'shipped',
    oneLine: 'ed25519-signed settlement anchors written to refs/notes/acp-anchors. Trust Layer 2.',
  },
  {
    number: 'ACR-700',
    title: 'Key Management & At-Rest Encryption',
    version: 'v0.1',
    phase: 'Phase 4.5',
    status: 'shipped',
    oneLine: 'AES-256-GCM with versioned keyring + KeyProvider interface for KMS / Vault adapters.',
  },

  // ── Spec drafting (Phase 7.A blocker) ──
  {
    number: 'ACR-500',
    title: 'Covenant Escrow Standard',
    version: 'v0.1 + Decisions v0.1 + v0.2 PROVISIONAL',
    phase: 'Phase 7.A',
    status: 'spec-drafting',
    oneLine: 'Funded Covenant escrow + auto-settlement. 10 working-group decisions queued.',
  },

  // ── Draft / speculative (Phase 5/6/7.B/C/D) ──
  {
    number: 'ACR-200',
    title: 'Cross-Covenant Reputation',
    version: 'v0.1',
    phase: 'Phase 5 (gated on 7.A)',
    status: 'draft-speculative',
    oneLine: 'Agent Reputation Score (ARS) across settled Covenants; tier auto-upgrade; federation.',
  },
  {
    number: 'ACR-510',
    title: 'Multi-Rail Payment Routing',
    version: 'v0.1',
    phase: 'Phase 7.B (gated on 7.A)',
    status: 'draft-speculative',
    oneLine: 'x402 micropayments + Base L2 ERC-20 + fiat gateway + multi-hop inter-Covenant flows.',
  },
  {
    number: 'ACR-520',
    title: 'Agent Autonomous Payment Mandate',
    version: 'v0.1',
    phase: 'Phase 7.C (gated on 7.B)',
    status: 'draft-speculative',
    oneLine: 'Pre-authorised constraint-bounded self-directed payments with caps + revocation.',
  },
  {
    number: 'ACR-530',
    title: 'On-Chain Merkle Proof',
    version: 'v0.1',
    phase: 'Phase 7.D (gated on 7.A)',
    status: 'draft-speculative',
    oneLine: 'Settlement-root publishing on-chain + GT claim path + dispute-challenge mechanism.',
  },
  {
    number: 'ACR-600',
    title: 'Genesis Migration',
    version: 'v0.1',
    phase: 'Phase 6 (gated on adopter)',
    status: 'draft-speculative',
    oneLine: 'Pre-ACP git history → Genesis Tokens with frozen time_weight curve + 2% genesis tax.',
  },
]

const STATUS_STYLE: Record<AcrStatus, { label: string; bg: string; fg: string }> = {
  meta:               { label: 'meta',         bg: 'bg-gray-100 dark:bg-gray-800',     fg: 'text-gray-600 dark:text-gray-400' },
  shipped:            { label: 'shipped',      bg: 'bg-green-50 dark:bg-green-950/40', fg: 'text-green-700 dark:text-green-400' },
  'spec-drafting':    { label: 'spec drafting',bg: 'bg-amber-50 dark:bg-amber-950/40', fg: 'text-amber-700 dark:text-amber-400' },
  'draft-speculative':{ label: 'draft · speculative', bg: 'bg-violet-50 dark:bg-violet-950/40', fg: 'text-violet-700 dark:text-violet-400' },
}

export function AcrIndexPage() {
  const grouped: Record<AcrStatus, Acr[]> = {
    meta: [],
    shipped: [],
    'spec-drafting': [],
    'draft-speculative': [],
  }
  for (const a of ACRS) grouped[a.status].push(a)

  return (
    <div>
      <H1>ACR Specs</H1>
      <Lead>
        Each ACR (Agent Covenant Resolution) is a single specification document that governs one
        protocol concern. ACRs are versioned independently and ratified by the working group.
        Implementation lives in <Code>acp-server</Code>; the canonical spec text lives in the
        InkMesh spec repo.
      </Lead>

      <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">Reading order for newcomers</p>
        <P>
          Start with <strong>ACR-20</strong> (Ink) and <strong>ACR-100</strong> (Settlement) for the
          formula and end-to-end flow. <strong>ACR-300</strong> for audit semantics.
          <strong> ACR-50</strong> for access gating. Save the <em>draft · speculative</em> rows
          for after you've understood the shipped surface — they describe protocol directions, not
          current behaviour.
        </P>
      </div>

      <H2>Shipped</H2>
      <P>These ACRs are implemented in acp-server today and govern current protocol behaviour.</P>
      <AcrTable acrs={grouped.shipped} />

      <H2>Spec drafting</H2>
      <P>
        ACR drafted but not yet ratified. Open decisions block implementation; the working group is
        the gating authority. See the live ratification queue at{' '}
        <a
          href="https://github.com/ymow/acp-server/blob/main/docs/PHASE-7A-DECISIONS.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 dark:text-violet-400 hover:underline"
        >
          docs/PHASE-7A-DECISIONS.md
        </a>.
      </P>
      <AcrTable acrs={grouped['spec-drafting']} />

      <H2>Draft · speculative</H2>
      <P>
        Each of these documents a future direction whose implementation is gated on a specific
        external trigger (Phase 7.A real-tx data, first OSS adopter, etc.). They exist so the
        design space is in writing — they are NOT permission to implement. See each spec's
        preamble for its specific gate.
      </P>
      <AcrTable acrs={grouped['draft-speculative']} />

      <H2>Meta</H2>
      <AcrTable acrs={grouped.meta} />

      <div className="mt-12 p-5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">For contributors</p>
        <P>
          New ACRs follow the format in <Code>ACR-1 Meta Standard</Code>: numbered preamble, the
          problem, the spec body, open questions, ratification path, "what this is NOT." Drafts
          land in the InkMesh repo with a <Code>v0.1-DRAFT</Code> stamp; promotion through v0.2 →
          v0.3-RATIFIED happens at working-group meetings recorded in each spec's Decision Log.
        </P>
      </div>
    </div>
  )
}

function AcrTable({ acrs }: { acrs: Acr[] }) {
  if (acrs.length === 0) return null
  return (
    <div className="not-prose mb-8">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-200 dark:border-gray-800">
            <th className="text-left font-semibold py-2 pr-3 w-24">ACR</th>
            <th className="text-left font-semibold py-2 pr-3">Title · version · phase</th>
            <th className="text-left font-semibold py-2 pr-3 w-32">Status</th>
          </tr>
        </thead>
        <tbody>
          {acrs.map((a) => {
            const style = STATUS_STYLE[a.status]
            const linkProps = a.href
              ? { href: a.href, target: '_blank' as const, rel: 'noopener noreferrer' }
              : undefined
            const headingClass = 'font-mono font-semibold text-gray-900 dark:text-gray-100'
            return (
              <tr key={a.number} className="border-b border-gray-100 dark:border-gray-900 align-top">
                <td className="py-3 pr-3">
                  {linkProps ? (
                    <a {...linkProps} className={`${headingClass} hover:text-violet-600 dark:hover:text-violet-400 hover:underline`}>
                      {a.number}
                    </a>
                  ) : (
                    <span className={headingClass}>{a.number}</span>
                  )}
                </td>
                <td className="py-3 pr-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{a.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {a.version} · {a.phase}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                    {a.oneLine}
                  </p>
                </td>
                <td className="py-3 pr-3">
                  <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.fg}`}>
                    {style.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
