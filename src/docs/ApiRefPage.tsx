import { H1, H2, H3, Lead, P, Pre, Code, Callout, Table } from './components'

export function ApiRefPage() {
  return (
    <div>
      <H1>API Reference</H1>
      <Lead>
        All 10 ACP interfaces, the REST endpoint catalog, authentication headers, and request/response format.
        Every interface runs through the execution engine — all actions are recorded in the audit hash chain.
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
          ['tiers', 'array', 'Yes', 'Array of {name, multiplier} objects'],
        ]}
      />
      <Pre lang="json">{`{"params": {
  "tiers": [
    {"name": "core",    "multiplier": 3.0},
    {"name": "feature", "multiplier": 2.0},
    {"name": "review",  "multiplier": 1.5},
    {"name": "docs",    "multiplier": 1.0}
  ]
}}`}</Pre>

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
      <P>List all participants in the Covenant with their current ink balances and status.</P>
      <P>No parameters. Returns array of <Code>{'{agent_id, status, tokens}'}</Code> objects.</P>

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
          ['POST', '/covenants/:id/join', 'Session', 'Participant applies to join.'],
          ['POST', '/covenants/:id/budget', 'Owner', 'Set global token budget.'],
          ['GET', '/covenants/:id/budget', 'Owner', 'Get budget status (total, used, remaining).'],
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
