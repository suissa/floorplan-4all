# Other coding agents

Floorplan is an agent-agnostic skill. Any coding agent that can read the skill instructions, inspect a workspace and run Node.js can scan, describe, build and refresh a map. Claude Code and Codex have native integrations for the interactive Ask bar. Other agents can connect through the generic local CLI adapter described here.

## What the adapter expects

The adapter starts one local command for each question, in the codebase root. It passes the map instructions and the question to that process, then reads its standard output. Your command must:

1. Enforce read-only access to the workspace itself. Use the agent's own read-only sandbox or a wrapper that applies one. Floorplan does **not** sandbox third-party CLIs.
2. Read the task from standard input, unless you put the `{prompt}` placeholder in the argument list.
3. Print one JSON object to standard output. A plain-text response is also accepted, but it won't populate the answer board.

A useful response looks like this:

```json
{
  "title": "How checkout works",
  "answer": "The checkout page sends the order to the API...",
  "items": [
    { "id": "f:src/routes/checkout.ts", "note": "Receives the checkout request." }
  ],
  "steps": [],
  "followups": ["Where is payment captured?"]
}
```

The `items` and `steps` entries can refer to existing map IDs, such as `f:relative/path.ts`, node IDs or route IDs. The server ignores unknown IDs when drawing the board. The adapter may return plain text instead of JSON; that answer is shown as text without map references.

## Configure a custom CLI

Set these variables in the terminal session where you start `floorplan/serve.mjs`:

| Variable | Purpose |
|---|---|
| `FLOORPLAN_AGENT_COMMAND` | Executable or absolute path of your agent CLI or a wrapper for it |
| `FLOORPLAN_AGENT_ARGS` | JSON array of arguments; defaults to `[]` |
| `FLOORPLAN_AGENT_NAME` | Display name, e.g. `OpenCode` or `Aider` |
| `FLOORPLAN_AGENT_READ_ONLY` | Must be `1`, `true` or `yes` to enable the custom CLI |
| `FLOORPLAN_AGENT` | Optional identity recorded in the map, e.g. `opencode` |
| `FLOORPLAN_MODEL` | Optional model name |
| `FLOORPLAN_AGENT_VERSION` | Optional version label shown by the map |
| `FLOORPLAN_AGENT_STRUCTURED` | Set to `1` only if the CLI enforces the supplied JSON schema; enables blueprint Change mode |

Example using a wrapper executable that reads stdin, invokes your chosen agent in its read-only mode and prints the JSON response:

```bash
export FLOORPLAN_AGENT=opencode
export FLOORPLAN_AGENT_NAME="OpenCode"
export FLOORPLAN_AGENT_COMMAND="/absolute/path/to/floorplan-agent-wrapper"
export FLOORPLAN_AGENT_ARGS='[]'
export FLOORPLAN_AGENT_READ_ONLY=1
node floorplan/serve.mjs --engine custom
```

The wrapper is deliberately user-supplied: different agent CLIs have different command syntax and different ways to enforce read-only access. Use the exact read-only option documented by your CLI. Do not set `FLOORPLAN_AGENT_READ_ONLY=1` just to make the Ask bar available; it is an explicit assertion that the command you configured cannot modify the codebase.

PowerShell equivalent:

```powershell
$env:FLOORPLAN_AGENT = "opencode"
$env:FLOORPLAN_AGENT_NAME = "OpenCode"
$env:FLOORPLAN_AGENT_COMMAND = "C:\path\to\floorplan-agent-wrapper.exe"
$env:FLOORPLAN_AGENT_ARGS = "[]"
$env:FLOORPLAN_AGENT_READ_ONLY = "1"
node floorplan/serve.mjs --engine custom
```

### Argument placeholders

Each string in `FLOORPLAN_AGENT_ARGS` is passed as a single argument. No shell parses the command, expands variables, or interprets metacharacters. The adapter replaces these placeholders before starting the process:

| Placeholder | Value |
|---|---|
| `{prompt}` | Full instructions, map context, schema and question |
| `{root}` | Absolute codebase root |
| `{model}` | Value of `FLOORPLAN_MODEL` |
| `{mode}` | `ask`, `flow` or `change` |
| `{schema}` | JSON schema text for the response |
| `{schemaFile}` | Path to a file containing the strict JSON schema |
| `{session}` | In-memory conversation ID |

When no argument contains `{prompt}`, the prompt is sent through standard input. When `{prompt}` is present, standard input is left empty. Follow-up turns are kept in the local server's memory (up to four previous question/answer pairs); they are not written to the agent's chat history.

If you want to force the generic adapter when a native CLI is also installed, pass `--engine custom` or set `FLOORPLAN_ENGINE=custom`. Without a forced engine, Floorplan prefers the agent that built the map and can fall back to another available adapter.

### Blueprint Change mode

By default, the custom adapter supports questions and requested flows. To expose the blueprint **Change** mode, set `FLOORPLAN_AGENT_STRUCTURED=1` only when your command enforces the schema supplied with each request. Include `{schema}` or `{schemaFile}` in `FLOORPLAN_AGENT_ARGS` if your CLI accepts a schema directly or from a file. The adapter must return valid JSON matching that schema. If those guarantees are unavailable, leave the variable unset; Change mode stays hidden.

## Without a custom CLI

The skill still works with other agents for creating and refreshing maps. If your agent cannot provide a local, read-only CLI command, open `floorplan/index.html` directly and use the rest of the map. The interactive Ask bar requires a native or configured CLI adapter.
