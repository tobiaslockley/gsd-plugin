#!/usr/bin/env node

/**
 * GSD MCP Server -- Packaged plugin MCP server
 *
 * Exposes GSD project state as MCP resources and workflow mutation tools.
 * Designed to run from ${CLAUDE_PLUGIN_ROOT}/mcp/server.cjs via plugin manifest.
 *
 * Resources (read-only):
 *   gsd://state       - Project state (STATE.md frontmatter as JSON)
 *   gsd://roadmap     - Project roadmap (ROADMAP.md as markdown)
 *   gsd://requirements - Requirements (REQUIREMENTS.md as markdown)
 *   gsd://config      - Project config (.planning/config.json as JSON)
 *   gsd://phase/{N}   - Phase summary (JSON)
 *   gsd://phase/{N}/context - Phase context (CONTEXT.md as markdown)
 *
 * Tools (mutations):
 *   gsd_init_phase, gsd_plan_status, gsd_advance_plan, gsd_record_metric,
 *   gsd_transition_phase, gsd_add_decision, gsd_add_blocker,
 *   gsd_resolve_blocker, gsd_record_session, gsd_commit_docs
 *
 * Transport: stdio (stdin/stdout JSON-RPC)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Resolve GSD bin/lib from plugin root (server lives at <root>/mcp/server.cjs)
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const libDir = path.join(pluginRoot, 'bin', 'lib');

// Import GSD library modules
let core, state, roadmap, frontmatter, phase;
try {
  core = require(path.join(libDir, 'core.cjs'));
  state = require(path.join(libDir, 'state.cjs'));
  roadmap = require(path.join(libDir, 'roadmap.cjs'));
  frontmatter = require(path.join(libDir, 'frontmatter.cjs'));
  phase = require(path.join(libDir, 'phase.cjs'));
} catch (err) {
  // If lib modules are not available, the server will start but resources
  // will return errors. This allows graceful degradation during development.
  process.stderr.write(`GSD MCP: Warning -- could not load bin/lib modules: ${err.message}\n`);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      process.stderr.write(`GSD MCP: read failed for ${filePath}: ${err.code}\n`);
    }
    return null;
  }
}

function findPlanningDir() {
  if (!core || !core.findProjectRoot || !core.planningDir) {
    const fallback = path.join(process.cwd(), '.planning');
    return fs.existsSync(fallback) ? fallback : null;
  }
  const root = core.findProjectRoot(process.cwd());
  const dir = core.planningDir(root);
  return fs.existsSync(dir) ? dir : null;
}

/**
 * Run a library cmd* function and return its stdout/stderr/exitCode. Delegates
 * to core.captureOutput so the cmd* fns don't need to know they're being
 * captured. Replaces the old process.stdout monkey-patch approach.
 */
function runCmd(fn, ...args) {
  if (!core || !core.captureOutput) {
    return { stdout: '', stderr: 'core.captureOutput unavailable', exitCode: 1 };
  }
  const captured = core.captureOutput(() => fn(...args));
  return {
    stdout: captured.stdout.join(''),
    stderr: captured.stderr.join(''),
    exitCode: captured.exitCode || 0,
  };
}

function toolResult(captured, fallbackText) {
  const content = [];
  const text = captured.stdout || fallbackText || '';
  if (text) content.push({ type: 'text', text });
  if (captured.stderr) content.push({ type: 'text', text: captured.stderr });
  const isError = captured.exitCode ? true : undefined;
  return isError ? { content, isError } : { content };
}

// ─── Simple stdio JSON-RPC transport ────────────────────────────────────────

let requestBuffer = '';

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

// ─── Resource handlers ──────────────────────────────────────────────────────

const resourceHandlers = {
  'gsd://state': () => {
    const planningDir = findPlanningDir();
    if (!planningDir) return { error: 'No .planning/ directory found' };
    const content = safeRead(path.join(planningDir, 'STATE.md'));
    if (!content) return { error: 'STATE.md not found' };
    if (frontmatter && frontmatter.extractFrontmatter) {
      const fm = frontmatter.extractFrontmatter(content);
      if (fm && Object.keys(fm).length > 0) {
        return { contents: [{ uri: 'gsd://state', mimeType: 'application/json', text: JSON.stringify(fm, null, 2) }] };
      }
    }
    return { contents: [{ uri: 'gsd://state', mimeType: 'text/markdown', text: content }] };
  },

  'gsd://roadmap': () => {
    const planningDir = findPlanningDir();
    if (!planningDir) return { error: 'No .planning/ directory found' };
    const content = safeRead(path.join(planningDir, 'ROADMAP.md'));
    if (!content) return { error: 'ROADMAP.md not found' };
    return { contents: [{ uri: 'gsd://roadmap', mimeType: 'text/markdown', text: content }] };
  },

  'gsd://requirements': () => {
    const planningDir = findPlanningDir();
    if (!planningDir) return { error: 'No .planning/ directory found' };
    const content = safeRead(path.join(planningDir, 'REQUIREMENTS.md'));
    if (!content) return { error: 'REQUIREMENTS.md not found' };
    return { contents: [{ uri: 'gsd://requirements', mimeType: 'text/markdown', text: content }] };
  },

  'gsd://config': () => {
    const planningDir = findPlanningDir();
    if (!planningDir) return { error: 'No .planning/ directory found' };
    const content = safeRead(path.join(planningDir, 'config.json'));
    if (!content) return { error: 'config.json not found' };
    return { contents: [{ uri: 'gsd://config', mimeType: 'application/json', text: content }] };
  }
};

function handlePhaseResource(phaseNum) {
  const planningDir = findPlanningDir();
  if (!planningDir) return { error: 'No .planning/ directory found' };

  const phasesDir = path.join(planningDir, 'phases');
  if (!fs.existsSync(phasesDir)) return { error: 'No phases/ directory found' };

  // Find the phase directory matching the number
  const prefix = String(phaseNum).padStart(2, '0');
  const entries = fs.readdirSync(phasesDir);
  const phaseDir = entries.find(e => e.startsWith(prefix + '-'));
  if (!phaseDir) return { error: `Phase ${phaseNum} not found` };

  const fullPath = path.join(phasesDir, phaseDir);
  // Collect plan and summary info
  const files = fs.readdirSync(fullPath);
  const plans = files.filter(f => f.endsWith('-PLAN.md'));
  const summaries = files.filter(f => f.endsWith('-SUMMARY.md'));

  return {
    contents: [{
      uri: `gsd://phase/${phaseNum}`,
      mimeType: 'application/json',
      text: JSON.stringify({
        phase: phaseNum,
        directory: phaseDir,
        plans: plans.length,
        summaries: summaries.length,
        files: files
      }, null, 2)
    }]
  };
}

function handlePhaseContextResource(phaseNum) {
  const planningDir = findPlanningDir();
  if (!planningDir) return { error: 'No .planning/ directory found' };

  const phasesDir = path.join(planningDir, 'phases');
  const prefix = String(phaseNum).padStart(2, '0');
  const entries = fs.readdirSync(phasesDir);
  const phaseDir = entries.find(e => e.startsWith(prefix + '-'));
  if (!phaseDir) return { error: `Phase ${phaseNum} not found` };

  const contextFile = path.join(phasesDir, phaseDir, `${prefix}-CONTEXT.md`);
  const content = safeRead(contextFile);
  if (!content) return { error: `CONTEXT.md not found for phase ${phaseNum}` };

  return {
    contents: [{
      uri: `gsd://phase/${phaseNum}/context`,
      mimeType: 'text/markdown',
      text: content
    }]
  };
}

function validateToolArgs(toolDef, args) {
  const schema = toolDef.inputSchema || {};
  const required = schema.required || [];
  for (const field of required) {
    if (args[field] === undefined || args[field] === null || args[field] === '') {
      return { ok: false, error: `Missing required parameter: ${field}` };
    }
  }
  const props = schema.properties || {};
  for (const [k, v] of Object.entries(args)) {
    const spec = props[k];
    if (!spec) continue;
    if (spec.type === 'string' && typeof v !== 'string') return { ok: false, error: `${k} must be string` };
    if (spec.type === 'number' && typeof v !== 'number') return { ok: false, error: `${k} must be number` };
    if (spec.type === 'array' && !Array.isArray(v)) return { ok: false, error: `${k} must be array` };
  }
  return { ok: true };
}

// ─── Tool handlers ──────────────────────────────────────────────────────────

const toolDefinitions = [
  {
    name: 'gsd_plan_status',
    description: 'Get current GSD plan execution status',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'gsd_advance_plan',
    description: 'Advance the current plan counter in STATE.md',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'gsd_record_metric',
    description: 'Record execution metrics for a plan',
    inputSchema: {
      type: 'object',
      properties: {
        phase: { type: 'string', description: 'Phase identifier (e.g., "01")' },
        plan: { type: 'string', description: 'Plan identifier (e.g., "02")' },
        duration: { type: 'string', description: 'Duration (e.g., "5min")' },
        tasks: { type: 'number', description: 'Number of tasks completed' },
        files: { type: 'number', description: 'Number of files modified' }
      },
      required: ['phase', 'plan', 'duration']
    }
  },
  {
    name: 'gsd_add_decision',
    description: 'Add a decision to STATE.md accumulated context',
    inputSchema: {
      type: 'object',
      properties: {
        phase: { type: 'string', description: 'Phase where decision was made' },
        summary: { type: 'string', description: 'Decision summary text' }
      },
      required: ['summary']
    }
  },
  {
    name: 'gsd_add_blocker',
    description: 'Add a blocker to STATE.md',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Blocker description' }
      },
      required: ['text']
    }
  },
  {
    name: 'gsd_resolve_blocker',
    description: 'Remove a resolved blocker from STATE.md',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Blocker text to remove' }
      },
      required: ['text']
    }
  },
  {
    name: 'gsd_record_session',
    description: 'Update session continuity info in STATE.md',
    inputSchema: {
      type: 'object',
      properties: {
        stopped_at: { type: 'string', description: 'Description of where work stopped' }
      },
      required: ['stopped_at']
    }
  },
  {
    name: 'gsd_commit_docs',
    description: 'Commit planning documentation files to git. Rejects if config `commit_docs` is false and any staged file is under .planning/.',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Commit message' },
        files: { type: 'array', items: { type: 'string' }, description: 'Files to commit' }
      },
      required: ['message', 'files']
    }
  }
];

function handleToolCall(name, args) {
  try {
    switch (name) {
      case 'gsd_plan_status': {
        const planningDir = findPlanningDir();
        if (!planningDir) return { content: [{ type: 'text', text: 'No .planning/ directory found' }], isError: true };
        const stateContent = safeRead(path.join(planningDir, 'STATE.md'));
        if (!stateContent) return { content: [{ type: 'text', text: 'STATE.md not found' }], isError: true };
        return { content: [{ type: 'text', text: stateContent }] };
      }

      case 'gsd_advance_plan': {
        if (!state || !state.cmdStateAdvancePlan) {
          return { content: [{ type: 'text', text: 'state module not available' }], isError: true };
        }
        const captured = runCmd(state.cmdStateAdvancePlan, process.cwd(), false);
        return toolResult(captured, 'Plan advanced');
      }

      case 'gsd_record_metric': {
        if (!state || !state.cmdStateRecordMetric) {
          return { content: [{ type: 'text', text: 'state module not available' }], isError: true };
        }
        const captured = runCmd(state.cmdStateRecordMetric, process.cwd(), {
          phase: args.phase,
          plan: args.plan,
          duration: args.duration,
          tasks: args.tasks,
          files: args.files,
        }, false);
        return toolResult(captured, 'Metric recorded');
      }

      case 'gsd_add_decision': {
        if (!state || !state.cmdStateAddDecision) {
          return { content: [{ type: 'text', text: 'state module not available' }], isError: true };
        }
        const captured = runCmd(state.cmdStateAddDecision, process.cwd(), {
          phase: args.phase,
          summary: args.summary,
        }, false);
        return toolResult(captured, 'Decision added');
      }

      case 'gsd_add_blocker': {
        if (!state || !state.cmdStateAddBlocker) {
          return { content: [{ type: 'text', text: 'state module not available' }], isError: true };
        }
        const captured = runCmd(state.cmdStateAddBlocker, process.cwd(), args.text, false);
        return toolResult(captured, 'Blocker added');
      }

      case 'gsd_resolve_blocker': {
        if (!state || !state.cmdStateResolveBlocker) {
          return { content: [{ type: 'text', text: 'state module not available' }], isError: true };
        }
        const captured = runCmd(state.cmdStateResolveBlocker, process.cwd(), args.text, false);
        return toolResult(captured, 'Blocker resolved');
      }

      case 'gsd_record_session': {
        if (!state || !state.cmdStateRecordSession) {
          return { content: [{ type: 'text', text: 'state module not available' }], isError: true };
        }
        const captured = runCmd(state.cmdStateRecordSession, process.cwd(), {
          stopped_at: args.stopped_at,
        }, false);
        return toolResult(captured, 'Session recorded');
      }

      case 'gsd_commit_docs': {
        if (!Array.isArray(args.files) || args.files.some(f => typeof f !== 'string')) {
          return { content: [{ type: 'text', text: 'files must be an array of strings' }], isError: true };
        }
        if (typeof args.message !== 'string' || !args.message.trim()) {
          return { content: [{ type: 'text', text: 'message must be a non-empty string' }], isError: true };
        }

        // Honour config.commit_docs=false — refuse any .planning/ file.
        try {
          const cwd = process.cwd();
          const config = core && core.loadConfig ? core.loadConfig(cwd) : {};
          if (config.commit_docs === false) {
            const planningFiles = args.files.filter(
              f => f.startsWith('.planning/') || f.startsWith('.planning\\')
            );
            if (planningFiles.length > 0) {
              return {
                content: [{
                  type: 'text',
                  text: `commit_docs is false; refusing to commit ${planningFiles.length} .planning/ file(s)`,
                }],
                isError: true,
              };
            }
          }
        } catch { /* config unreadable — fall through to commit attempt */ }

        try {
          if (args.files.length > 0) {
            execFileSync('git', ['add', '--', ...args.files], { stdio: 'pipe' });
          }
          execFileSync('git', ['commit', '-m', args.message], { stdio: 'pipe' });
          return { content: [{ type: 'text', text: `Committed: ${args.message}` }] };
        } catch (err) {
          return { content: [{ type: 'text', text: `Commit failed: ${err.message}` }], isError: true };
        }
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: `Tool error: ${err.message}` }], isError: true };
  }
}

// ─── MCP Protocol Handler ───────────────────────────────────────────────────

let SERVER_INFO;
try {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf8')
  );
  SERVER_INFO = { name: manifest.name || 'gsd', version: manifest.version || '0.0.0' };
} catch {
  SERVER_INFO = { name: 'gsd', version: '0.0.0' };
}

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2024-11-05'];

const CAPABILITIES = {
  resources: { listChanged: false },
  tools: {}
};

function handleRequest(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize': {
      const requested = params && params.protocolVersion;
      const chosen = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
        ? requested
        : '2024-11-05';
      return sendResponse(id, {
        protocolVersion: chosen,
        serverInfo: SERVER_INFO,
        capabilities: CAPABILITIES
      });
    }

    case 'ping':
      return sendResponse(id, {});

    case 'notifications/initialized':
      // Client acknowledgement, no response needed
      return;

    case 'resources/list':
      return sendResponse(id, {
        resources: [
          { uri: 'gsd://state', name: 'GSD State', description: 'Current project state from STATE.md', mimeType: 'application/json' },
          { uri: 'gsd://roadmap', name: 'GSD Roadmap', description: 'Project roadmap from ROADMAP.md', mimeType: 'text/markdown' },
          { uri: 'gsd://requirements', name: 'GSD Requirements', description: 'Project requirements from REQUIREMENTS.md', mimeType: 'text/markdown' },
          { uri: 'gsd://config', name: 'GSD Config', description: 'Project config from .planning/config.json', mimeType: 'application/json' }
        ]
      });

    case 'resources/read': {
      const uri = params && params.uri;
      if (!uri) return sendError(id, -32602, 'Missing uri parameter');

      // Check static resources first
      if (resourceHandlers[uri]) {
        const result = resourceHandlers[uri]();
        if (result.error) return sendError(id, -32603, result.error);
        return sendResponse(id, result);
      }

      // Check parameterized phase resources
      const phaseMatch = uri.match(/^gsd:\/\/phase\/(\d+)$/);
      if (phaseMatch) {
        const result = handlePhaseResource(parseInt(phaseMatch[1]));
        if (result.error) return sendError(id, -32603, result.error);
        return sendResponse(id, result);
      }

      const contextMatch = uri.match(/^gsd:\/\/phase\/(\d+)\/context$/);
      if (contextMatch) {
        const result = handlePhaseContextResource(parseInt(contextMatch[1]));
        if (result.error) return sendError(id, -32603, result.error);
        return sendResponse(id, result);
      }

      return sendError(id, -32602, `Unknown resource URI: ${uri}`);
    }

    case 'tools/list':
      return sendResponse(id, { tools: toolDefinitions });

    case 'resources/templates/list':
      return sendResponse(id, {
        resourceTemplates: [
          { uriTemplate: 'gsd://phase/{N}', name: 'GSD Phase Summary', mimeType: 'application/json' },
          { uriTemplate: 'gsd://phase/{N}/context', name: 'GSD Phase Context', mimeType: 'text/markdown' },
        ],
      });

    case 'tools/call': {
      const toolName = params && params.name;
      const toolArgs = (params && params.arguments) || {};
      if (!toolName) return sendError(id, -32602, 'Missing tool name');
      const def = toolDefinitions.find(t => t.name === toolName);
      if (!def) return sendError(id, -32601, `Unknown tool: ${toolName}`);
      const check = validateToolArgs(def, toolArgs);
      if (!check.ok) return sendError(id, -32602, check.error);
      const result = handleToolCall(toolName, toolArgs);
      return sendResponse(id, result);
    }

    default:
      return sendError(id, -32601, `Method not found: ${method}`);
  }
}

// ─── stdio transport ────────────────────────────────────────────────────────

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  requestBuffer += chunk;

  while (true) {
    // LSP-style Content-Length framing (optional; accepted if headers present)
    const headerEnd = requestBuffer.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const header = requestBuffer.substring(0, headerEnd);
      const contentLengthMatch = header.match(/Content-Length:\s*(\d+)/i);
      if (contentLengthMatch) {
        const contentLength = parseInt(contentLengthMatch[1], 10);
        const bodyStart = headerEnd + 4;
        const totalLength = bodyStart + contentLength;
        if (requestBuffer.length < totalLength) break;
        const body = requestBuffer.substring(bodyStart, totalLength);
        requestBuffer = requestBuffer.substring(totalLength);
        try {
          handleRequest(JSON.parse(body));
        } catch (err) {
          process.stderr.write(`GSD MCP: Failed to parse request: ${err.message}\n`);
        }
        continue;
      }
    }

    // Newline-delimited JSON (MCP stdio spec)
    const newlineIdx = requestBuffer.indexOf('\n');
    if (newlineIdx === -1) break;
    const line = requestBuffer.substring(0, newlineIdx).trim();
    requestBuffer = requestBuffer.substring(newlineIdx + 1);
    if (!line) continue;
    try {
      handleRequest(JSON.parse(line));
    } catch (err) {
      process.stderr.write(`GSD MCP: Failed to parse request: ${err.message}\n`);
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

// Signal readiness
process.stderr.write('GSD MCP server started (plugin-packaged)\n');
