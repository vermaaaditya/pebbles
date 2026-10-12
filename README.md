# Pebbles — Autonomous AI Teammates with Governed Authority

> **Small agents. Big work.**  
> Developed for the **ArmorIQ Flow State 2026** Hackathon.

Pebbles is an autonomous AI workforce platform where users delegate real software-engineering tasks to specialized AI teammates under cryptographic governance.

The defining architectural principle:
> **Agents should be capable of autonomous execution without having unrestricted authority.**

---

## 1. The Autonomous Workforce

| Teammate | Role | Authority Boundary | Allowed Tools |
| :--- | :--- | :--- | :--- |
| **Lead Pebble** | Workforce Architect | Coordination, Planning & Certification | Task planning, subtask delegation, evidence compilation |
| **Research Pebble** | Context & Security Analyst | Strict Read-Only Workspace Inspection | `workspace.list_files`, `workspace.read_file`, `workspace.search_files` |
| **Builder Pebble** | Sandboxed Engineer | Workspace Source Modification & Test Execution | `workspace.read_file`, `workspace.write_file`, `workspace.run_tests` |

---

## 2. Core Architecture

```
USER REQUEST
  │
  ▼
LEAD PEBBLE (Synthesizes Structured Plan)
  │
  ├───────────────────────────────┐
  ▼                               ▼
RESEARCH PEBBLE                 BUILDER PEBBLE
  │                               │
  ▼                               ▼
MCP TOOL REQUEST                MCP TOOL REQUEST
  │                               │
  └───────────────┬───────────────┘
                  ▼
        ARMORIQ GOVERNANCE GATE
        (Cryptographic Intent & Policy Evaluation)
          ├── ALLOW  ──► Execute MCP Tool in Workspace Sandbox
          ├── HOLD   ──► Pause & Request Human-in-the-Loop Approval
          └── DENY   ──► Block Tool Execution & Record Violation
                  │
                  ▼
          OBSERVED RESULT
                  │
                  ▼
          EVIDENCE TRAIL
                  │
                  ▼
       LEAD PEBBLE FINAL CERTIFICATION
```

### Key Security & Governance Features
1. **Mandatory Execution Boundary**: Authorization is enforced immediately adjacent to tool execution. Agents cannot self-grant authority or bypass checks via prompt injections.
2. **Fail-Closed ArmorIQ Mode**: When production ArmorIQ mode is selected (`ARMORIQ_MODE=armoriq`), any missing API key, network failure, or policy violation strictly halts protected actions (`DENY`). It never executes optimistically.
3. **Explicit Local Development Policy**: When `ARMORIQ_MODE=local_policy` is selected, all decisions are tagged as `[LOCAL_DEV_POLICY]` and never masqueraded as genuine ArmorIQ decisions.
4. **Interactive HOLD Gates**: High-impact operations (e.g. modifying root configs or package manifests) trigger a `HOLD`, presenting an interactive approval modal to the user.
5. **Path & Command Sandboxing**: The workspace MCP server strictly enforces sandboxing—rejecting null bytes, path traversals (`..`), access to `.env`/credentials, and unapproved shell commands.

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons.
- **Backend**: Node.js 22, TypeScript, Fastify, Server-Sent Events (SSE).
- **Tools**: Official `@modelcontextprotocol/sdk` (Model Context Protocol).
- **Governance**: Official `@armoriq/sdk` (Intent verification & policy evaluation).
- **Testing**: Vitest with unit and end-to-end integration test coverage.

---

## 4. Getting Started

### Prerequisites
- Node.js >= 18.0.0 (Tested on Node 22.19.0)
- npm >= 9.0.0

### Setup
1. **Clone / Navigate to Repository:**
   ```bash
   cd D:/PROJECTS/pebbles
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
   *(For development, `ARMORIQ_MODE=local_policy` works out of the box with zero external API keys required).*

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Build All Packages:**
   ```bash
   npm run build
   ```

5. **Run Test Suites:**
   ```bash
   npm test
   ```

6. **Start Backend & Frontend Services:**
   - **Backend**:
     ```bash
     npm run start:backend
     ```
     *(Runs on http://localhost:3001)*
   - **Frontend**:
     ```bash
     npm run start:frontend
     ```
     *(Runs on http://localhost:5173)*

---

## 5. Repository Structure

```
pebbles/
├── .env.example                 # Documented configuration variables
├── package.json                 # Monorepo workspaces config
├── packages/
│   ├── mcp-server/              # Sandboxed MCP Server (Official MCP SDK)
│   │   ├── src/sandbox.ts       # Path traversal & command security layer
│   │   ├── src/tools/           # workspace.list_files, read, search, write, run_tests
│   │   └── src/server.ts        # McpServer instantiation
│   ├── backend/                 # Fastify Orchestrator & Governance API
│   │   ├── src/authorization/   # ArmorIQ integration & Local Policy engines
│   │   ├── src/orchestration/   # Lead, Research, Builder Pebble agents
│   │   ├── src/mcp/client.ts    # Official MCP Client
│   │   ├── src/store/           # Task store with SSE live streams
│   │   └── tests/               # Security, tool, and orchestration tests
│   └── frontend/                # Dark-first React + Vite + Tailwind workspace
│       └── src/components/      # Sidebar, TaskWorkspace, Feeds, HoldApprovalModal
└── workspace-sandbox/
    └── sample-repo/             # Sandboxed test repository for agents
```

---

## 6. Verification Status

- [x] **Local MCP Server**: Verified with official `@modelcontextprotocol/sdk`. Tools execute within strict workspace sandbox boundaries.
- [x] **Agent Team Roles**: Lead, Research, and Builder Pebble roles operate with explicit task handoffs and role confinement.
- [x] **Governed Authority**: Production ArmorIQ provider enforces fail-closed semantics; local dev policy provider strictly isolates scopes and handles interactive holds.
- [x] **Test Verification**: 19 automated tests passing across 4 test suites covering sandbox containment, MCP tools, permissions, and end-to-end orchestration.
- [x] **Real-Time UI**: Server-Sent Events stream live task updates, tool evaluations, and hold approvals.
