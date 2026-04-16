import { H1, H2, H3, Lead, P, Pre, Code, Callout, Table } from './components'

export function ConceptsPage() {
  return (
    <div>
      <H1>Core Concepts</H1>
      <Lead>
        Ink tokens, the settlement formula, the Covenant state machine, and the three trust layers.
        Understanding these three concepts covers 90% of what you need to use ACP effectively.
      </Lead>

      {/* ── Ink Tokens ── */}
      <H2 id="ink-tokens">Ink Tokens</H2>
      <P>
        Ink is a contribution unit — not a cryptocurrency. It is non-transferable, non-tradeable, and scoped
        to a single Covenant. You cannot send ink to a wallet. Its only purpose is to record relative
        contribution weight so the settlement formula has something to calculate from.
      </P>
      <Callout type="info">
        Ink tokens have no monetary value themselves. They are a <strong>distribution key</strong>: when revenue
        exists, the owner uses ink percentages to decide how to split it. Any currency, any amount, any time.
      </Callout>

      <H3>The formula</H3>
      <Pre lang="text">{`tokens = unit_count × tier_multiplier × acceptance_ratio`}</Pre>

      <Table
        headers={['Variable', 'Type', 'Description']}
        rows={[
          ['unit_count', 'integer', 'Size of the contribution (lines of code, words of prose, etc.)'],
          ['tier_multiplier', 'float', 'Value tier assigned at passage submission (core=3×, feature=2×, review=1.5×, docs=1×)'],
          ['acceptance_ratio', 'float 0–1', 'Quality factor set by the owner when approving the draft. 1.0 = full credit, 0.5 = half credit.'],
        ]}
      />

      <H3>Example calculation</H3>
      <Pre lang="text">{`Passage: 300 lines of core protocol code, accepted at 0.8 quality

tokens = 300 × 3.0 × 0.8 = 720 ink

If total settled ink = 4,475 and this participant's total = 1,800:
  share = 1,800 / 4,475 = 40.2%

If owner distributes $1,000:
  this participant receives $402`}</Pre>

      <H3>Contribution tiers</H3>
      <Table
        headers={['Tier', 'Multiplier', 'Use case']}
        rows={[
          ['core', '3×', 'Protocol design, security-critical code, architecture decisions'],
          ['feature', '2×', 'Feature implementation, tooling, integrations'],
          ['review', '1.5×', 'Code review, testing, QA, bug fixing'],
          ['docs', '1×', 'Documentation, specs, roadmap writing'],
        ]}
      />
      <P>Tiers are configured per-Covenant by the owner before participants join.</P>

      {/* ── State Machine ── */}
      <H2 id="state-machine">Covenant State Machine</H2>
      <P>Every Covenant moves forward through five states. Transitions are irreversible and recorded in the hash chain.</P>

      <Pre lang="text">{`DRAFT → OPEN → ACTIVE → LOCKED → SETTLED`}</Pre>

      <Table
        headers={['State', 'Who can act', 'What happens']}
        rows={[
          ['DRAFT', 'Owner only', 'Configure token rules, contribution tiers, budget. No participants yet.'],
          ['OPEN', 'Owner + participants', 'Participants apply to join (POST /join). Owner approves or rejects via approve_agent / reject_agent.'],
          ['ACTIVE', 'Owner + approved participants', 'Participants submit passages (propose_passage). Owner approves or rejects each draft. Tokens accumulate.'],
          ['LOCKED', 'Owner only', 'No new contributions. Owner calls generate_settlement_output to produce the verified settlement record.'],
          ['SETTLED', 'Read-only', 'Final state. Immutable. Ink totals locked. Hash chain sealed.'],
        ]}
      />

      <Callout type="tip">
        You can query the current state at any time: <Code>GET /covenants/{'{id}'}/state</Code>
      </Callout>

      <H3>Passage lifecycle</H3>
      <P>Within ACTIVE state, each passage has its own mini-lifecycle:</P>
      <Pre lang="text">{`propose_passage()  →  DRAFT passage (pending review)
approve_draft()    →  tokens calculated and locked into hash chain
reject_draft()     →  passage closed, zero tokens`}</Pre>
      <P>The owner sets <Code>acceptance_ratio</Code> (0.0–1.0) when calling <Code>approve_draft</Code> — this is how partial credit is expressed.</P>

      {/* ── Trust Layers ── */}
      <H2 id="trust-layers">Trust Layers</H2>
      <P>
        ACP provides three trust layers. You choose how much external verification you need. Most collaborations
        only need Layer 1.
      </P>

      <Table
        headers={['Layer', 'Mechanism', 'Trust model', 'Status']}
        rows={[
          ['Layer 1', 'SHA-256 append-only hash chain on the server', 'Trust the server operator', 'Live'],
          ['Layer 2', 'Settlement hash committed to git history', 'Trust git history', 'Phase 3 roadmap'],
          ['Layer 3', 'Merkle root posted on-chain', 'Trustless, permissionless', 'Phase 7 roadmap'],
        ]}
      />

      <H3>Layer 1 — SHA-256 hash chain</H3>
      <P>
        Every action (join, passage submission, approval, settlement) is written as a log entry. Each entry
        includes a SHA-256 hash of the previous entry, forming an append-only chain. Any modification to a
        past entry invalidates all subsequent hashes and is immediately detectable.
      </P>
      <Pre lang="bash">{`# Verify chain integrity
curl http://localhost:8080/covenants/$CVNT_ID/audit/verify`}</Pre>
      <P>
        <strong>Trust model:</strong> You trust that the server operator has not replaced the entire chain.
        For self-hosted deployments where you run the server yourself, Layer 1 is sufficient.
      </P>

      <H3>Layer 2 — Git Anchor (Phase 3)</H3>
      <P>
        Settlement hash committed to the repository's git history. This creates a permanent, public record
        tied to the code history — anyone with repo access can verify it independently without trusting the
        server operator.
      </P>
      <P>Already in use: <Code>settlements/2026-04-15-acp-server-phase1-2.json</Code> in the acp-server repo.</P>

      <H3>Layer 3 — On-chain Merkle Proof (Phase 7)</H3>
      <P>
        Merkle root of all settlement hashes published on a public blockchain. Fully trustless verification —
        no server access required. This enables smart contract escrow and automatic ERC-20 distribution.
        Phase 7 is roadmap only; no timeline committed.
      </P>

      <Callout type="warn">
        On-chain features are Phase 7 roadmap items. The current implementation is entirely off-chain.
        No blockchain, no crypto wallet, no gas fees are involved today.
      </Callout>
    </div>
  )
}
