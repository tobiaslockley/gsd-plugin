'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const SERVER_PATH = path.join(__dirname, 'server.cjs');

function mktemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function rpc(requests, { cwd } = {}) {
  const body = requests.map(r => JSON.stringify(r)).join('\n') + '\n';
  const res = spawnSync('node', [SERVER_PATH], {
    input: body,
    cwd: cwd || process.cwd(),
    encoding: 'utf8',
    timeout: 5000,
  });
  const lines = (res.stdout || '').split('\n').filter(Boolean);
  return lines.map(l => JSON.parse(l));
}

test('initialize negotiates protocol version and reports manifest version', () => {
  const responses = rpc([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
  ]);
  assert.equal(responses.length, 1);
  assert.equal(responses[0].result.protocolVersion, '2025-06-18');
  assert.equal(responses[0].result.serverInfo.name, 'gsd');
  assert.match(responses[0].result.serverInfo.version, /^\d+\.\d+\.\d+/);
});

test('initialize falls back when protocol version is unknown', () => {
  const responses = rpc([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1999-01-01' } },
  ]);
  assert.equal(responses[0].result.protocolVersion, '2024-11-05');
});

test('ping returns empty result', () => {
  const responses = rpc([
    { jsonrpc: '2.0', id: 1, method: 'ping' },
  ]);
  assert.deepEqual(responses[0].result, {});
});

test('tools/call rejects missing required parameter', () => {
  const responses = rpc([
    {
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'gsd_record_metric', arguments: { phase: '01' } },
    },
  ]);
  assert.equal(responses[0].error.code, -32602);
  assert.match(responses[0].error.message, /Missing required parameter/);
});

test('tools/call rejects unknown tool', () => {
  const responses = rpc([
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'gsd_nope', arguments: {} } },
  ]);
  assert.equal(responses[0].error.code, -32601);
});

test('gsd_commit_docs rejects shell-injection attempt in message', () => {
  const tmp = mktemp('gsd-commit-test-');
  try {
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: tmp });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    execFileSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: tmp });
    const docFile = path.join(tmp, 'doc.md');
    fs.writeFileSync(docFile, 'hello\n');
    execFileSync('git', ['add', 'doc.md'], { cwd: tmp });
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: tmp });

    fs.writeFileSync(docFile, 'update\n');

    const sentinel = path.join(tmp, 'pwned');
    const injectedMessage = `hi"; touch "${sentinel}"; echo "`;

    const responses = rpc([
      {
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: {
          name: 'gsd_commit_docs',
          arguments: { message: injectedMessage, files: ['doc.md'] },
        },
      },
    ], { cwd: tmp });

    assert.equal(fs.existsSync(sentinel), false, 'injection sentinel must not be created');

    const log = execFileSync('git', ['log', '-1', '--pretty=%s'], { cwd: tmp, encoding: 'utf8' }).trim();
    assert.equal(log, injectedMessage, 'commit subject must be the literal injected string');

    assert.ok(responses[0].result, 'tool should have returned a result');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('gsd_commit_docs refuses .planning/ files when commit_docs=false', () => {
  const tmp = mktemp('gsd-commit-docs-');
  try {
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: tmp });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tmp });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmp });
    execFileSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: tmp });
    const planningDir = path.join(tmp, '.planning');
    fs.mkdirSync(planningDir);
    fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify({ commit_docs: false }));
    fs.writeFileSync(path.join(planningDir, 'STATE.md'), '---\n---\n');
    execFileSync('git', ['add', '.'], { cwd: tmp });
    execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: tmp });

    fs.writeFileSync(path.join(planningDir, 'STATE.md'), '---\nkey: value\n---\n');

    const responses = rpc([
      {
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: {
          name: 'gsd_commit_docs',
          arguments: { message: 'docs: update', files: ['.planning/STATE.md'] },
        },
      },
    ], { cwd: tmp });

    assert.equal(responses[0].result.isError, true);
    assert.match(responses[0].result.content[0].text, /commit_docs is false/);

    const log = execFileSync('git', ['log', '-1', '--pretty=%s'], { cwd: tmp, encoding: 'utf8' }).trim();
    assert.equal(log, 'init', 'no new commit should have been created');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('gsd_advance_plan executes the library fn and returns its output', () => {
  const tmp = mktemp('gsd-advance-');
  try {
    const planningDir = path.join(tmp, '.planning');
    fs.mkdirSync(planningDir);
    fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify({ commit_docs: false }));
    fs.writeFileSync(path.join(planningDir, 'STATE.md'), [
      '---',
      '---',
      '',
      '# State',
      '',
      '**Current Plan:** 2',
      '**Total Plans in Phase:** 5',
      '**Status:** Ready to execute',
      '**Last Activity:** -',
      '',
    ].join('\n'));

    const responses = rpc([
      { jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'gsd_advance_plan', arguments: {} } },
    ], { cwd: tmp });

    assert.equal(responses[0].result.isError, undefined, 'should not be an error');
    const text = responses[0].result.content.map(c => c.text).join('');
    assert.match(text, /"advanced":\s*true/);
    assert.match(text, /"current_plan":\s*3/);

    const stateContent = fs.readFileSync(path.join(planningDir, 'STATE.md'), 'utf8');
    assert.match(stateContent, /\*\*Current Plan:\*\*\s*3/, 'STATE.md should be updated to plan 3');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('gsd://state uses the shared frontmatter parser', () => {
  const tmp = mktemp('gsd-state-res-');
  try {
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: tmp });
    const planningDir = path.join(tmp, '.planning');
    fs.mkdirSync(planningDir);
    fs.writeFileSync(path.join(planningDir, 'STATE.md'), [
      '---',
      'current_plan: 3',
      'progress:',
      '  percent: 42',
      '---',
      '',
      '# body',
      '',
    ].join('\n'));

    const responses = rpc([
      { jsonrpc: '2.0', id: 1, method: 'resources/read', params: { uri: 'gsd://state' } },
    ], { cwd: tmp });

    const payload = JSON.parse(responses[0].result.contents[0].text);
    assert.equal(payload.current_plan, '3');
    assert.ok(payload.progress, 'nested progress should be present');
    assert.equal(payload.progress.percent, '42');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
