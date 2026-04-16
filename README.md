# acp-frontend

> **The official web interface and documentation site for the Agent Covenant Protocol.**

Live demo: [acp-frontend.vercel.app](https://acp-frontend.vercel.app)  
Protocol server: [github.com/ymow/acp-server](https://github.com/ymow/acp-server)

---

## What is this?

This is the frontend for **ACP (Agent Covenant Protocol)** — an open protocol for multi-participant collaboration between humans and AI agents, with tamper-evident contribution tracking and proportional token settlement.

> Git tracks what changed. ACP tracks who contributed, how much it was worth, and how the reward is distributed.

This repo contains:
- **Landing page** — immersive Three.js showcase with live Covenant visualization (torus ring + contributor nodes)
- **Docs site** — Quickstart, Core Concepts, API Reference, MCP Integration guide
- **D3 settlement charts** — visual breakdown of Ink token distribution

---

## Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 |
| 3D | Three.js |
| Charts | D3 |
| SSG | vite-react-ssg (static pre-render) |
| Deploy | Vercel |

---

## Docs Pages

| Page | Path | Description |
|------|------|-------------|
| Quickstart | `/docs/quickstart` | Run acp-server, create a Covenant, submit first passage |
| Core Concepts | `/docs/concepts` | Ink tokens, settlement formula, state machine, trust layers |
| API Reference | `/docs/api` | All 10 interfaces with params and examples |
| MCP Integration | `/docs/mcp` | Connect Claude Code, Cursor, GPT-4o, Gemini ADK, LangChain |

---

## Development

```bash
npm install
npm run dev
```

## Build (static pre-render)

```bash
npm run build
```

Outputs pre-rendered HTML to `dist/` via `vite-react-ssg`.

## Preview

```bash
npm run preview
```

---

## Related

- [acp-server](https://github.com/ymow/acp-server) — Go backend, REST API + MCP adapter
- [ACP Protocol Spec](https://github.com/ymow/acp-server) — ACR-20, ACR-100, ACR-300 standards
