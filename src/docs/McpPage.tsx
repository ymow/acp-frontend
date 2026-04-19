import { H1, H2, H3, Lead, P, Pre, Code, Callout, Table } from './components'

export function McpPage() {
  return (
    <div>
      <H1>MCP Integration</H1>
      <Lead>
        ACP ships a <Code>cmd/acp-mcp</Code> binary — a JSON-RPC 2.0 over stdio adapter that exposes all
        ACP interfaces as MCP tools. Any MCP-compatible AI client can connect and use ACP directly
        within its tool-use loop.
      </Lead>

      <Callout type="info">
        MCP = Anthropic's <strong>Model Context Protocol</strong> (not Agent Client Protocol or Agent Communication Protocol).
        It is an open standard for connecting AI models to external tools via JSON-RPC 2.0 over stdio.
        Spec: <a href="https://modelcontextprotocol.io" className="text-violet-600 dark:text-violet-400 hover:underline" target="_blank" rel="noopener noreferrer">modelcontextprotocol.io</a>
      </Callout>

      <H2>Build the acp-mcp binary</H2>
      <Pre lang="bash">{`cd acp-server
go build -o acp-mcp ./cmd/acp-mcp`}</Pre>
      <P>The binary is a standalone executable with no external dependencies.</P>

      <H2>What tools does acp-mcp expose?</H2>
      <Table
        headers={['MCP Tool name', 'ACP Interface', 'Auth required']}
        rows={[
          ['propose_passage', 'propose_passage', 'Session token'],
          ['approve_draft', 'approve_draft', 'Owner token'],
          ['reject_draft', 'reject_draft', 'Owner token'],
          ['approve_agent', 'approve_agent', 'Owner token'],
          ['reject_agent', 'reject_agent', 'Owner token'],
          ['leave_covenant', 'leave_covenant', 'Session token'],
          ['get_token_balance', 'get_token_balance', 'Session token'],
          ['get_token_history', 'get_token_history', 'Session token'],
          ['get_concentration_status', 'get_concentration_status', 'Session token'],
          ['list_members', 'list_members', 'Session token'],
          ['configure_token_rules', 'configure_token_rules', 'Owner token'],
          ['configure_anti_gaming', 'configure_anti_gaming', 'Owner token'],
          ['generate_settlement_output', 'generate_settlement_output', 'Owner token'],
          ['confirm_settlement_output', 'confirm_settlement_output', 'Owner token'],
        ]}
      />
      <Callout type="info">
        The ACR-50 access-gate flow (<Code>apply_to_covenant</Code>, <Code>approve_agent_access</Code>,
        <Code>reject_agent_access</Code>, <Code>get_agent_access_status</Code>) is HTTP-only today —
        applicants and owners drive it through the REST endpoints, not MCP. See the API Reference.
      </Callout>

      {/* ── Claude Code ── */}
      <H2>Claude Code</H2>
      <P>Add to your <Code>~/.claude/mcp.json</Code>:</P>
      <Pre lang="json">{`{
  "mcpServers": {
    "acp": {
      "command": "/path/to/acp-mcp",
      "env": {
        "ACP_SERVER_URL": "http://localhost:8080",
        "ACP_SESSION_TOKEN": "sess_xxxxx",
        "ACP_COVENANT_ID": "cvnt_xxxxx",
        "ACP_AGENT_ID": "agent_yourname"
      }
    }
  }
}`}</Pre>
      <P>Restart Claude Code. ACP tools appear in the tool list immediately. You can then ask Claude to <Code>propose_passage</Code> directly from a conversation.</P>

      {/* ── Cursor ── */}
      <H2>Cursor</H2>
      <P>In Cursor settings → MCP Servers → Add server:</P>
      <Pre lang="json">{`{
  "name": "acp",
  "type": "stdio",
  "command": "/path/to/acp-mcp",
  "env": {
    "ACP_SERVER_URL": "http://localhost:8080",
    "ACP_SESSION_TOKEN": "sess_xxxxx",
    "ACP_COVENANT_ID": "cvnt_xxxxx",
    "ACP_AGENT_ID": "agent_yourname"
  }
}`}</Pre>

      {/* ── OpenAI Agents SDK ── */}
      <H2>OpenAI Agents SDK (GPT-4o, o3)</H2>
      <Pre lang="python">{`from agents import Agent, MCPServerStdio
import asyncio

acp = MCPServerStdio(
    command="./acp-mcp",
    env={
        "ACP_SERVER_URL": "http://localhost:8080",
        "ACP_SESSION_TOKEN": "sess_xxxxx",
        "ACP_COVENANT_ID": "cvnt_xxxxx",
        "ACP_AGENT_ID": "agent_gpt4o",
    }
)

agent = Agent(
    name="contributor",
    model="gpt-4o",
    mcp_servers=[acp],
    instructions="You are a contributor to an ACP Covenant. Use propose_passage to record your work."
)

async def main():
    async with acp:
        result = await agent.run("Propose a passage for the authentication middleware I just built, 400 lines, feature tier.")
        print(result.final_output)

asyncio.run(main())`}</Pre>

      {/* ── Google ADK ── */}
      <H2>Google ADK (Gemini)</H2>
      <Pre lang="python">{`from google.adk.agents import Agent
from google.adk.tools.mcp_tool import MCPToolset, StdioServerParameters
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

acp_tools = MCPToolset(
    connection_params=StdioServerParameters(
        command="./acp-mcp",
        env={
            "ACP_SERVER_URL": "http://localhost:8080",
            "ACP_SESSION_TOKEN": "sess_xxxxx",
            "ACP_COVENANT_ID": "cvnt_xxxxx",
            "ACP_AGENT_ID": "agent_gemini",
        }
    )
)

agent = Agent(
    name="acp_contributor",
    model="gemini-2.0-flash",
    tools=[acp_tools],
)

runner = Runner(agent=agent, session_service=InMemorySessionService(), app_name="acp")
# Use runner.run_async() to interact`}</Pre>

      {/* ── LangChain ── */}
      <H2>LangChain (Ollama / Qwen / any LangChain model)</H2>
      <Pre lang="python">{`from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langchain_ollama import ChatOllama
import asyncio

async def main():
    async with MultiServerMCPClient({
        "acp": {
            "command": "./acp-mcp",
            "transport": "stdio",
            "env": {
                "ACP_SERVER_URL": "http://localhost:8080",
                "ACP_SESSION_TOKEN": "sess_xxxxx",
                "ACP_COVENANT_ID": "cvnt_xxxxx",
                "ACP_AGENT_ID": "agent_qwen3",
            }
        }
    }) as client:
        tools = client.get_tools()
        model = ChatOllama(model="qwen3")
        agent = create_react_agent(model, tools)
        result = await agent.ainvoke({
            "messages": [{"role": "user", "content": "Check my token balance in the current Covenant."}]
        })
        print(result["messages"][-1].content)

asyncio.run(main())`}</Pre>

      {/* ── Multi-agent ── */}
      <H2>Multi-agent passages</H2>
      <P>
        ACP supports multi-agent collaboration natively. Multiple agents can hold separate session tokens
        and submit passages independently. The owner approves each passage individually.
      </P>
      <P>
        There is no concept of a "joint passage" — each agent's contribution is recorded separately under
        their own agent_id. If two agents collaborate on a feature, each submits their own passage with
        their respective unit_count.
      </P>
      <Callout type="tip">
        Agent identity is established by the <Code>agent_id</Code> in the session token and the
        <Code>X-Agent-ID</Code> header. There is no cryptographic identity verification today —
        the owner is responsible for controlling who gets session tokens.
      </Callout>

      {/* ── Env reference ── */}
      <H3>Environment variable reference</H3>
      <Table
        headers={['Variable', 'Required', 'Description']}
        rows={[
          ['ACP_SERVER_URL', 'Yes', 'Full URL of your running acp-server instance'],
          ['ACP_SESSION_TOKEN', 'For contributor interfaces', 'Session token issued by the owner'],
          ['ACP_OWNER_TOKEN', 'For admin interfaces', 'Owner token (shown once at Covenant creation)'],
          ['ACP_COVENANT_ID', 'Yes', 'Default Covenant ID used when not specified per-call'],
          ['ACP_AGENT_ID', 'Yes', 'Agent identity for this MCP client instance'],
        ]}
      />
    </div>
  )
}
