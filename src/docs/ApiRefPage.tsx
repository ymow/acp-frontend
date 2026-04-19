import { H1, H2, H3, Lead, P, Pre, Code, Callout, Table } from './components'

export function ApiRefPage() {
  return (
    <div>
      <H1>API Reference</H1>
      <Lead>
        All ACP interfaces, the REST endpoint catalog, authentication headers, and request/response
        format. Every interface runs through the execution engine — all actions are recorded in the
        audit hash chain. Phase 4 adds the access gate, rate limiting, and at-rest encryption.
      </Lead>

      <H2>Authentication</H2>
      <Table
        headers={['Header', 'Used for', 'How to get it']}
        rows={[
          ['X-Owner-Token', 'Admin interfaces (approve, settle, configure)', 'Returned once at POST /covenants creation'],
          ['X-Session-Token', 'Participant interfaces (propose, query)', 'POST /sessions/issue (owner only)'],
          ['X-Covenant-ID', 'Required on all /tools/* calls', 'Returned at POST /covenants creation'],
          ['X-Agent-ID', 'Required on participant calls', 'Assigned by owner when issuing session tokens'],
        ]}
      />
      <P>Session tokens are stored as SHA-256 hashes — raw tokens are never persisted.</P>

      <H2>Interface Execution</H2>
      <P>All interfaces share the same execution envelope:</P>
      <Pre lang="bash">{`POST /tools/{interface_name}
Headers:
  X-Covenant-ID: cvnt_xxxxx
  X-Agent-ID: agent_xxxxx        # participant interfaces
  X-Session-Token: sess_xxxxx    # participant interfaces
  X-Owner-Token: owner_xxxxx     # admin interfaces
Body: {"params": {...}}

→ 200: {"receipt": {"log_id": "...", "tokens": ..., ...}}
→ 4xx: {"error": "reason string"}`}</Pre>

      {/* ── Interfaces ── */}
      <H2>Interfaces</H2>

      <H3 id="configure_token_rules">configure_token_rules</H3>
      <P>Set or update contribution tiers. Called in DRAFT state before participants join.</P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['tiers', 'array', 'Yes', 'Array of {name, multiplier, entry_fee_tokens?} objects. entry_fee_tokens (Phase 4.6.C) is optional and ≥ 0; default 0 keeps pre-4.6.C behaviour.'],
        ]}
      />
      <Pre lang="json">{`{"params": {
  "tiers": [
    {"name": "core",    "multiplier": 3.0, "entry_fee_tokens": 0},
    {"name": "feature", "multiplier": 2.0, "entry_fee_tokens": 0},
    {"name": "review",  "multiplier": 1.5, "entry_fee_tokens": 0},
    {"name": "docs",    "multiplier": 1.0, "entry_fee_tokens": 0}
  ]
}}`}</Pre>

      <H3 id="configure_anti_gaming">configure_anti_gaming</H3>
      <P>
        Owner sets per-Covenant defense thresholds. Phase 4.1 covers per-hour rate limits, Phase 4.3
        covers concentration warning percentages.
      </P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['rate_limit_per_hour', 'integer', 'No', 'Cap on clause-tool calls per (covenant, agent, hour). 0 disables.'],
          ['concentration_warn_pct', 'integer', 'No', 'Warn when one agent holds > N% of total ink. 0 disables.'],
        ]}
      />

      <H3 id="approve_agent">approve_agent</H3>
      <P>Owner approves a pending participant. Transitions them from pending → approved. Requires OPEN or ACTIVE state.</P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['agent_id', 'string', 'Yes', 'The agent_id of the participant to approve'],
        ]}
      />

      <H3 id="reject_agent">reject_agent</H3>
      <P>Owner rejects a pending participant. They cannot rejoin the same Covenant.</P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['agent_id', 'string', 'Yes', 'The agent_id to reject'],
          ['reason', 'string', 'No', 'Optional rejection reason (recorded in audit log)'],
        ]}
      />

      <H3 id="propose_passage">propose_passage</H3>
      <P>Participant submits a contribution for review. Creates a DRAFT passage in the audit log. Requires ACTIVE state.</P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['tier', 'string', 'Yes', 'One of the configured tier names (e.g. "feature")'],
          ['unit_count', 'integer', 'Yes', 'Size of contribution (lines, words, etc.)'],
          ['description', 'string', 'Yes', 'Human-readable description of the work'],
        ]}
      />
      <Pre lang="json">{`{"params": {
  "tier": "feature",
  "unit_count": 350,
  "description": "Add rate limiting middleware to API endpoints"
}}`}</Pre>
      <P>Response includes a <Code>log_id</Code> needed for <Code>approve_draft</Code>.</P>

      <H3 id="approve_draft">approve_draft</H3>
      <P>Owner approves a pending passage. Tokens are calculated and locked into the hash chain.</P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['log_id', 'string', 'Yes', 'log_id from the propose_passage receipt'],
          ['acceptance_ratio', 'float', 'Yes', 'Quality factor 0.0–1.0. 1.0 = full credit, 0.5 = half credit.'],
        ]}
      />
      <Callout type="tip">
        <Code>acceptance_ratio</Code> is how the owner expresses partial credit. A passage worth 400 tokens at 0.75 acceptance_ratio locks in 300 ink.
      </Callout>

      <H3 id="reject_draft">reject_draft</H3>
      <P>Owner rejects a pending passage. Zero tokens awarded. Recorded in the hash chain.</P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['log_id', 'string', 'Yes', 'log_id from the propose_passage receipt'],
          ['reason', 'string', 'No', 'Rejection reason (recorded in audit log)'],
        ]}
      />

      <H3 id="get_token_balance">get_token_balance</H3>
      <P>Query current ink token balance for a participant. Available in any state.</P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['agent_id', 'string', 'No', 'Defaults to the calling agent. Owner can query any participant.'],
        ]}
      />

      <H3 id="list_members">list_members</H3>
      <P>
        List all participants in the Covenant with their current ink balances and status. Phase 4.6.B
        added a <Code>pending_access_requests</Code> array so the owner gets the review queue in the
        same round-trip — request rows surface as 12-character <Code>platform_id_hash</Code> prefixes,
        never the plaintext identifier.
      </P>
      <P>
        No parameters. Returns <Code>{'{members: [{agent_id, status, tokens}], pending_access_requests: [...]}'}</Code>.
      </P>

      <H3 id="get_token_history">get_token_history</H3>
      <P>
        Query the per-Covenant <Code>token_ledger</Code> rows for one agent. Used by the wallet UI and
        by applicants confirming an <Code>entry_fee_tokens</Code> debit landed.
      </P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['agent_id', 'string', 'No', 'Defaults to the calling agent. Owner can query any participant.'],
          ['limit', 'integer', 'No', 'Page size (default 100, capped server-side).'],
        ]}
      />

      <H3 id="get_concentration_status">get_concentration_status</H3>
      <P>
        Returns whether any agent holds more than <Code>concentration_warn_pct</Code> of total ink.
        Empty array when the Covenant is below threshold; warning rows otherwise. ACR-20 Part 4 Layer 5.
      </P>

      <H3 id="leave_covenant">leave_covenant</H3>
      <P>
        Participant exits the Covenant. Tokens already accrued stay in the ledger; the member row
        moves to <Code>status='left'</Code>. Owner cannot leave; transfer ownership first (out of
        Phase 4 scope).
      </P>

      {/* ── Access Gate (Phase 4.6) ── */}
      <H3 id="apply_to_covenant">apply_to_covenant (POST /covenants/&#123;id&#125;/apply)</H3>
      <P>
        Public-facing application for OPEN Covenants. The applicant supplies their tier choice, an
        optional <Code>self_declaration</Code>, and an opaque <Code>payment_ref</Code>. The server
        seals their <Code>platform_id</Code> alongside an indexable hash, then queues a pending
        access request for the owner.
      </P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['tier_id', 'string', 'Yes', 'One of the configured tier names'],
          ['payment_ref', 'string', 'No', 'Receipt handle, opaque to the server'],
          ['self_declaration', 'string', 'No', 'Free-text attestation; never echoed back to non-owners'],
        ]}
      />
      <Callout type="info">
        Returns <Code>{'{request_id, covenant_id}'}</Code>. Use these to poll{' '}
        <Code>get_agent_access_status</Code>.
      </Callout>

      <H3 id="approve_agent_access">approve_agent_access</H3>
      <P>
        Owner approves a pending request. If the tier has <Code>entry_fee_tokens &gt; 0</Code>, a
        negative <Code>token_ledger</Code> row is booked in the same transaction so the new member's
        balance starts at <Code>-fee</Code>. Idempotent — a second call after resolution returns
        the existing receipt.
      </P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['request_id', 'string', 'Yes', 'request_id from apply_to_covenant'],
          ['agent_id', 'string', 'Yes', 'agent_id assigned to the new member'],
        ]}
      />

      <H3 id="reject_agent_access">reject_agent_access</H3>
      <P>Owner rejects a pending request. Idempotent.</P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['request_id', 'string', 'Yes', 'request_id from apply_to_covenant'],
          ['reason', 'string', 'No', 'Recorded in the audit log; not surfaced to the applicant'],
        ]}
      />

      <H3 id="get_agent_access_status">get_agent_access_status</H3>
      <P>
        Applicant polls their own request. All error paths converge on <Code>HTTP 404</Code> to avoid
        leaking whether a given <Code>request_id</Code> exists.
      </P>
      <Table
        headers={['Param', 'Type', 'Required', 'Description']}
        rows={[
          ['request_id', 'string', 'Yes', 'request_id from apply_to_covenant'],
          ['covenant_id', 'string', 'Yes', 'Must match the covenant the request was filed against'],
        ]}
      />

      <H3 id="generate_settlement_output">generate_settlement_output</H3>
      <P>Owner generates the final settlement record. Covenant must be in LOCKED state. Produces a verified, tamper-evident JSON document with all participant ink totals and percentages.</P>
      <P>No parameters. Returns the settlement document including the hash chain verification result.</P>
      <Callout type="info">
        This does not trigger any financial transaction. It produces a record only.
        Call <Code>confirm_settlement_output</Code> to make it permanent.
      </Callout>

      <H3 id="confirm_settlement_output">confirm_settlement_output</H3>
      <P>Owner confirms and seals the settlement. Transitions the Covenant to SETTLED state. This is irreversible.</P>
      <P>No parameters.</P>

      {/* ── REST Endpoints ── */}
      <H2>REST Endpoints</H2>

      <H3>Covenant Lifecycle</H3>
      <Table
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['POST', '/covenants', 'none', 'Create a new Covenant. Returns covenant_id and owner_token.'],
          ['GET', '/covenants/:id', 'none', 'Get Covenant details, members, and current state.'],
          ['GET', '/covenants/:id/state', 'none', 'Get current state (DRAFT/OPEN/ACTIVE/LOCKED/SETTLED).'],
          ['POST', '/covenants/:id/tiers', 'Owner', 'Configure contribution tiers.'],
          ['POST', '/covenants/:id/transition', 'Owner', 'Transition to next state. Body: {"to": "OPEN"}'],
          ['POST', '/covenants/:id/join', 'Session', 'Participant applies to join (legacy direct-join).'],
          ['POST', '/covenants/:id/apply', 'Session', 'Phase 4.6: ACR-50 access-gated application; queues a pending request the owner reviews.'],
          ['POST', '/covenants/:id/budget', 'Owner', 'Set global token budget.'],
          ['GET', '/covenants/:id/budget', 'Owner', 'Get budget status (total, used, remaining).'],
        ]}
      />

      <H3>Git Twin (Phase 3.A · Layer 2 anchor)</H3>
      <Table
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['POST', '/covenants/:id/git-twin', 'Owner', 'Bind a git repo to the Covenant; only allowed in DRAFT.'],
          ['GET', '/git-twin/covenants', 'none', 'Reverse lookup: which Covenants are bound to a given repo URL.'],
          ['POST', '/git-twin/event', 'Bridge', 'Bridge posts a git event (commit, merge) for execution.'],
          ['POST', '/git-twin/merge', 'Bridge', 'Bridge posts a merge event with parent SHAs.'],
          ['GET', '/git-twin/anchors/pending', 'Bridge', 'List ed25519-signed anchors awaiting commit to refs/notes/acp-anchors.'],
          ['POST', '/git-twin/anchors/:id/ack', 'Bridge', 'Bridge ACKs that an anchor was committed.'],
          ['GET', '/git-twin/pubkey', 'none', 'Public ed25519 key used to verify anchor signatures.'],
        ]}
      />

      <H3>Audit</H3>
      <Table
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['GET', '/covenants/:id/audit', 'Owner', 'Full audit log with all actions and hash chain entries.'],
          ['GET', '/covenants/:id/audit/verify', 'none', 'Verify hash chain integrity. Returns valid: true/false.'],
        ]}
      />

      <H3>Sessions</H3>
      <Table
        headers={['Method', 'Path', 'Auth', 'Description']}
        rows={[
          ['POST', '/sessions/issue', 'Owner', 'Issue session token for a participant. Body: {"agent_id": "..."}'],
          ['POST', '/sessions/rotate', 'Session', 'Rotate your own session token.'],
        ]}
      />

      <H2>Environment Variables</H2>

      <H3>acp-server</H3>
      <Table
        headers={['Variable', 'Default', 'Description']}
        rows={[
          ['ACP_ADDR', ':8080', 'HTTP listen address'],
          ['ACP_DB_PATH', './acp.db', 'SQLite database path'],
          ['ACP_KEY_FILE', '$HOME/.acp/master.key', 'Phase 4.5: legacy keyfile anchor. The keyring directory lives at its sibling keys/ subdir (keys/v{N}.key). Auto-generated on first start; pre-4.5.8 single-file deployments auto-migrate to keys/v1.key.'],
        ]}
      />

      <H3>Subcommands</H3>
      <Table
        headers={['Command', 'Description']}
        rows={[
          ['acp-server serve', 'Run the HTTP server (default).'],
          ['acp-server rotate-key', 'Phase 4.5.8: write keys/v{N+1}.key and bump the active pointer. O(1); does not touch ciphertext.'],
          ['acp-server reencrypt', 'Phase 4.5.8: walk every at-rest sealed row and re-seal under the current key version. Idempotent — safe to re-run after a partial failure.'],
        ]}
      />

      <H3>acp-mcp</H3>
      <Table
        headers={['Variable', 'Default', 'Description']}
        rows={[
          ['ACP_SERVER_URL', 'http://localhost:8080', 'acp-server address'],
          ['ACP_SESSION_TOKEN', '—', 'Participant session token (for propose_passage, query interfaces)'],
          ['ACP_OWNER_TOKEN', '—', 'Owner token (for admin interfaces)'],
          ['ACP_COVENANT_ID', '—', 'Default Covenant ID for all calls'],
          ['ACP_AGENT_ID', '—', 'Default agent ID'],
        ]}
      />
    </div>
  )
}
