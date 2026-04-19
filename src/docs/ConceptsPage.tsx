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
          ['unit_count', 'integer', 'Self-reported size of the contribution. Convention is per-project: code → lines changed, prose → word count, design → screens. Phase 3 will auto-derive this from git diffs.'],
          ['tier_multiplier', 'float', 'Value tier assigned at passage submission (core=3×, feature=2×, review=1.5×, docs=1×)'],
          ['acceptance_ratio', 'float 0–1', 'Quality factor set by the owner when approving the draft. 1.0 = full credit, 0.5 = half credit. This is the owner\'s correction lever for inflated counts.'],
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
          ['Layer 2', 'ed25519-signed settlement anchor on refs/notes/acp-anchors', 'Trust git history + signing key', 'Live (Phase 3.A)'],
          ['Layer 3', 'Merkle root posted on-chain', 'Trustless, permissionless', 'Phase 7 · roadmap'],
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

      <H3>Layer 2 — Git Covenant Twin anchor (Phase 3.A · Live)</H3>
      <P>
        The settlement hash is committed to the repository's git history as a signed note on
        <Code>refs/notes/acp-anchors</Code>. Anyone with repo access can verify the anchor independently
        without trusting the server operator.
      </P>
      <P>
        ACR-400 v0.2 uses <Code>ed25519</Code> signatures over the canonical JSON body of each anchor. The
        server's public key is served at <Code>GET /git-twin/pubkey</Code>; a verifier runs
        <Code>git notes --ref=refs/notes/acp-anchors show &lt;commit&gt;</Code> and checks the signature
        against that key. Tampering with any field — <Code>total_tokens</Code>, <Code>snapshot_hash</Code>,
        <Code>settlement_hash</Code> — invalidates the signature.
      </P>
      <P>Reference artefact: <Code>settlements/2026-04-15-acp-server-phase1-2.json</Code> in the acp-server repo.</P>

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

      {/* ── Defense Layer (Phase 4) ── */}
      <H2 id="defense-layer">Defense Layer (Phase 4)</H2>
      <P>
        Phase 4 hardens the server for environments where strangers can apply to join. Three pieces:
        rate limiting, at-rest encryption, and an explicit access gate.
      </P>

      <H3 id="rate-limiting">Per-hour rate limiting (ACR-20 Part 4 Layer 2)</H3>
      <P>
        Every clause-tool call increments a per-(covenant, agent, hour) counter. Exceeding the limit
        returns <Code>HTTP 429</Code> with a structured error envelope. Defaults are conservative;
        owners tune them via <Code>configure_anti_gaming</Code>. Counters are stored in SQLite, so
        the gate survives restarts.
      </P>

      <H3 id="at-rest-encryption">At-rest encryption (ACR-700)</H3>
      <P>
        Personally identifiable platform identifiers (e.g. <Code>github:octocat</Code>) are sealed
        with AES-256-GCM before being written to disk. The ciphertext layout is self-describing:
      </P>
      <Pre lang="text">{`[version: 1 byte] [key_version: 3 bytes BE u24] [nonce: 12 bytes] [ct + tag: variable]`}</Pre>
      <P>
        AAD binds each blob to its row identity (<Code>"acp-server|" + row_id + "|" + column</Code>),
        so cut-and-paste of one row's ciphertext into another row fails authentication. Read paths
        only ever surface a 12-character hash prefix, never the plaintext identifier.
      </P>

      <H3 id="key-rotation">Key rotation (Phase 4.5.8)</H3>
      <P>
        The keyring lives at <Code>$ACP_KEY_FILE/../keys/v&#123;N&#125;.key</Code>. Rotation is
        two commands, intentionally split so a long re-seal scan does not block the rotation itself:
      </P>
      <Pre lang="bash">{`acp-server rotate-key   # O(1): writes the next v{N+1}.key, bumps the active pointer
acp-server reencrypt    # O(rows): re-seals every row sealed under an older version. Idempotent.`}</Pre>
      <P>
        Existing ciphertext stays readable indefinitely because old key files are kept on disk and
        the §2.3 header records which version each row was sealed under.
      </P>

      <H3 id="key-provider">Bring your own KMS</H3>
      <P>
        The reference build keeps keys on local disk (<Code>LocalKeyfileProvider</Code>). The
        <Code>KeyProvider</Code> interface lets operators plug in AWS KMS, HashiCorp Vault, GCP KMS,
        Azure Key Vault, or an HSM — the server never depends on a built-in KMS. Contract and
        adapter skeleton:
      </P>
      <P>
        <a
          href="https://github.com/ymow/acp-server/blob/main/docs/key-provider.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 dark:text-violet-400 hover:underline"
        >
          docs/key-provider.md →
        </a>
      </P>

      <H3 id="access-gate">Access gate (ACR-50 · Phase 4.6)</H3>
      <P>
        Open Covenants accept <Code>apply_to_covenant</Code> from anyone holding a session token.
        The owner queue is exposed via <Code>list_members</Code> (the response includes
        <Code>pending_access_requests</Code>); decisions go through <Code>approve_agent_access</Code>
        / <Code>reject_agent_access</Code>. Tier-level <Code>entry_fee_tokens</Code> is booked as a
        negative <Code>token_ledger</Code> row inside the same transaction as the approval, so the
        new member starts at <Code>-fee</Code> and earns out from there. Applicants poll status via
        <Code>get_agent_access_status</Code>; all error paths converge on <Code>404</Code> to avoid
        existence-leak.
      </P>
    </div>
  )
}
