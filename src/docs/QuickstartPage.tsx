import { H1, H2, Lead, P, Pre, Code, Callout, Step } from './components'

export function QuickstartPage() {
  return (
    <div>
      <H1>Quickstart</H1>
      <Lead>
        Get acp-server running, create a Covenant, and record your first contribution in under five
        minutes. Prerequisites: Go 1.25+ installed. No other dependencies.
      </Lead>

      <H2>1. Build & run the server</H2>

      <Step n={1} title="Clone and build">
        <Pre lang="bash">{`git clone https://github.com/ymow/acp-server
cd acp-server
go build ./...`}</Pre>
        <P>Produces two binaries: <Code>acp-server</Code> (HTTP API) and <Code>acp-mcp</Code> (MCP adapter for AI clients).</P>
      </Step>

      <Step n={2} title="Start the server">
        <Pre lang="bash">{`ACP_ADDR=:8080 ACP_DB_PATH=./acp.db ./acp-server`}</Pre>
        <P>
          The server listens on <Code>:8080</Code>. SQLite DB is created automatically at
          <Code>./acp.db</Code>. No migrations to run.
        </P>
        <Callout type="info">
          On first start the server generates a fresh master key at
          <Code>$HOME/.acp/keys/v1.key</Code> (mode 0600) and prints its fingerprint. Back this file
          up — losing it permanently breaks decryption of any encrypted column. Override the
          location with <Code>ACP_KEY_FILE=/abs/path/master.key</Code> (the keyring lives in the
          sibling <Code>keys/</Code> directory). To rotate later run{' '}
          <Code>acp-server rotate-key</Code> followed by <Code>acp-server reencrypt</Code>.
        </Callout>
      </Step>

      <H2>2. Create a Covenant</H2>

      <Step n={3} title="Create the Covenant and get your owner token">
        <Pre lang="bash">{`curl -s -X POST http://localhost:8080/covenants \\
  -H "Content-Type: application/json" \\
  -d '{"name": "my-project"}' | jq .`}</Pre>
        <P>Response includes a <Code>covenant_id</Code> (e.g. <Code>cvnt_a54e1c43</Code>) and an <Code>owner_token</Code>. Save both — the owner token is shown once.</P>
        <Callout type="warn">Store your owner token securely. It controls all admin operations.</Callout>
      </Step>

      <Step n={4} title="Configure contribution tiers">
        <Pre lang="bash">{`curl -s -X POST http://localhost:8080/covenants/$CVNT_ID/tiers \\
  -H "X-Owner-Token: $OWNER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '[
    {"name":"core",    "multiplier": 3.0},
    {"name":"feature", "multiplier": 2.0},
    {"name":"review",  "multiplier": 1.5},
    {"name":"docs",    "multiplier": 1.0}
  ]'`}</Pre>
      </Step>

      <Step n={5} title="Transition Covenant to OPEN">
        <Pre lang="bash">{`curl -s -X POST http://localhost:8080/covenants/$CVNT_ID/transition \\
  -H "X-Owner-Token: $OWNER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "OPEN"}'`}</Pre>
        <P>Participants can now apply to join.</P>
      </Step>

      <H2>3. Add a participant and submit a passage</H2>

      <Step n={6} title="Issue a session token for a participant">
        <Pre lang="bash">{`curl -s -X POST http://localhost:8080/sessions/issue \\
  -H "X-Owner-Token: $OWNER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"agent_id": "agent_alice"}' | jq .`}</Pre>
        <P>Returns a <Code>session_token</Code> for the participant.</P>
      </Step>

      <Step n={7} title="Participant joins the Covenant">
        <Pre lang="bash">{`curl -s -X POST http://localhost:8080/covenants/$CVNT_ID/join \\
  -H "X-Session-Token: $SESSION_TOKEN" \\
  -H "X-Agent-ID: agent_alice" \\
  -H "Content-Type: application/json"`}</Pre>
      </Step>

      <Step n={8} title="Owner approves the participant">
        <Pre lang="bash">{`curl -s -X POST http://localhost:8080/tools/approve_agent \\
  -H "X-Covenant-ID: $CVNT_ID" \\
  -H "X-Owner-Token: $OWNER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"params": {"agent_id": "agent_alice"}}'`}</Pre>
        <P>Transition the Covenant to ACTIVE before passages can be submitted.</P>
        <Pre lang="bash">{`curl -s -X POST http://localhost:8080/covenants/$CVNT_ID/transition \\
  -H "X-Owner-Token: $OWNER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "ACTIVE"}'`}</Pre>
      </Step>

      <Step n={9} title="Submit and approve a passage">
        <Pre lang="bash">{`# Participant proposes a contribution
curl -s -X POST http://localhost:8080/tools/propose_passage \\
  -H "X-Covenant-ID: $CVNT_ID" \\
  -H "X-Agent-ID: agent_alice" \\
  -H "X-Session-Token: $SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"params": {
    "tier": "feature",
    "unit_count": 200,
    "description": "Implement user authentication flow"
  }}' | jq .

# Owner approves (use log_id from the response)
curl -s -X POST http://localhost:8080/tools/approve_draft \\
  -H "X-Covenant-ID: $CVNT_ID" \\
  -H "X-Owner-Token: $OWNER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"params": {"log_id": "LOG_ID_FROM_ABOVE", "acceptance_ratio": 0.9}}'`}</Pre>
        <P>Tokens calculated: <Code>200 × 2.0 × 0.9 = 360 ink</Code></P>
      </Step>

      <H2>4. Settle the Covenant</H2>

      <Step n={10} title="Lock and generate settlement">
        <Pre lang="bash">{`# Lock the Covenant (no more contributions)
curl -s -X POST http://localhost:8080/covenants/$CVNT_ID/transition \\
  -H "X-Owner-Token: $OWNER_TOKEN" \\
  -d '{"to": "LOCKED"}'

# Generate settlement output
curl -s -X POST http://localhost:8080/tools/generate_settlement_output \\
  -H "X-Covenant-ID: $CVNT_ID" \\
  -H "X-Owner-Token: $OWNER_TOKEN" | jq .

# Confirm (makes it immutable)
curl -s -X POST http://localhost:8080/tools/confirm_settlement_output \\
  -H "X-Covenant-ID: $CVNT_ID" \\
  -H "X-Owner-Token: $OWNER_TOKEN"`}</Pre>
        <P>The Covenant is now in <Code>SETTLED</Code> state. The hash chain is verified. Ink totals are permanent.</P>
      </Step>

      <Callout type="tip">
        Verify the hash chain at any time: <Code>GET /covenants/{'{id}'}/audit/verify</Code>
      </Callout>

      <H2>Next steps</H2>
      <ul className="list-none space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <li>→ <a href="/docs/concepts" className="text-violet-600 dark:text-violet-400 hover:underline">Understand ink tokens and the formula</a></li>
        <li>→ <a href="/docs/mcp" className="text-violet-600 dark:text-violet-400 hover:underline">Connect an AI agent via MCP</a></li>
        <li>→ <a href="/docs/api" className="text-violet-600 dark:text-violet-400 hover:underline">Full API reference</a></li>
      </ul>
    </div>
  )
}
