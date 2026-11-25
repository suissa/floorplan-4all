// Identify the agent using this skill. Claude Code and Codex have native integrations; any other
// coding agent can identify itself with --agent or FLOORPLAN_AGENT. Unknown environments are never
// mistaken for Claude Code. "none" is reserved for unattended runs and explicit opt-out.
import { isUnattended } from './common.mjs';

const DETECT = {
  claude: (env) => !!env.CLAUDECODE,
  codex: (env) => !!(env.CODEX_THREAD_ID || env.CODEX_SESSION_ID),
  none: () => false,
};
export const AGENTS = Object.keys(DETECT);

function agentId(value) {
  const id = String(value || '').trim().toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-').replace(/^[._-]+|[._-]+$/g, '').slice(0, 40);
  return /^[a-z0-9]/.test(id) ? id : 'other';
}

export function detectAgent(args = {}, env = process.env) {
  const explicit = args.agent || env.FLOORPLAN_AGENT || env.FLOORPLAN_AGENT_NAME;
  if (explicit) return agentId(explicit);
  if (isUnattended(env)) return 'none';
  return Object.keys(DETECT).find((agent) => agent !== 'none' && DETECT[agent](env)) || 'other';
}

const CLI_NAMES = { claude: 'the Claude Code CLI', codex: 'Codex' };
/** Label the command that answers questions, including a user-configured third-party CLI. */
export function cliLabel(engine, version = '', displayName = '') {
  const usual = displayName || CLI_NAMES[engine] || 'configured AI agent';
  const v = String(version || '').trim();
  const named = /^([A-Za-z][\w.-]{0,40})\s+v?\d/.exec(v)?.[1];
  const known = engine === 'codex' ? /codex/i : engine === 'claude' ? /claude/i : null;
  if (!named || (known && known.test(v))) return usual;
  const command = engine === 'codex' ? 'codex' : engine === 'claude' ? 'claude' : 'configured';
  return `${named}, found as the ${command} command`;
}
