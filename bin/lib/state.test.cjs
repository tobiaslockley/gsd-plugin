'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const GSD_TOOLS = path.join(__dirname, '..', 'gsd-tools.cjs');

function mkPlanning() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-state-test-'));
  const planningDir = path.join(tmp, '.planning');
  fs.mkdirSync(planningDir);
  fs.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify({ commit_docs: false }));
  fs.writeFileSync(path.join(planningDir, 'STATE.md'), [
    '---',
    '---',
    '',
    '# Project State',
    '',
    '**Current Plan:** 0',
    '',
    '**Total Plans in Phase:** 10000',
    '',
    '**Status:** Ready to execute',
    '',
    '**Last Activity:** -',
    '',
  ].join('\n'));
  return tmp;
}

test('advance-plan: 50 concurrent advances produce 50 updates, no lost writes', async () => {
  const tmp = mkPlanning();
  try {
    const N = 50;
    const runs = Array.from({ length: N }, () => new Promise((resolve) => {
      const child = require('child_process').spawn(
        'node',
        [GSD_TOOLS, 'state', 'advance-plan', '--raw'],
        { cwd: tmp, env: { ...process.env, GSD_LOCK_TIMEOUT_MS: '20' } },
      );
      child.on('exit', (code) => resolve(code || 0));
      child.stderr.on('data', () => {});
      child.stdout.on('data', () => {});
    }));
    const codes = await Promise.all(runs);
    assert.ok(codes.every(c => c === 0), `all children exited cleanly, got: ${codes}`);

    const content = fs.readFileSync(path.join(tmp, '.planning', 'STATE.md'), 'utf8');
    const m = content.match(/\*\*Current Plan:\*\*\s*(\d+)/);
    assert.ok(m, 'STATE.md should still contain Current Plan field');
    const finalPlan = parseInt(m[1], 10);
    assert.equal(finalPlan, N, `expected Current Plan=${N} after ${N} advances, got ${finalPlan}`);

    const leftoverLocks = fs.readdirSync(path.join(tmp, '.planning')).filter(f => f.endsWith('.lock'));
    assert.deepEqual(leftoverLocks, [], 'no orphan .lock files should remain');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('acquireStateLock throws rather than corrupting under contention', () => {
  const { spawnSync } = require('child_process');
  const tmp = mkPlanning();
  try {
    const statePath = path.join(tmp, '.planning', 'STATE.md');
    const lockPath = statePath + '.lock';
    fs.writeFileSync(lockPath, String(process.pid));
    // Hold the lock fresh so it's never seen as stale.
    const start = Date.now();
    fs.utimesSync(lockPath, new Date(), new Date());

    const child = spawnSync(
      'node',
      [GSD_TOOLS, 'state', 'advance-plan', '--raw'],
      { cwd: tmp, env: { ...process.env, GSD_LOCK_TIMEOUT_MS: '30' }, encoding: 'utf8', timeout: 10000 },
    );
    const elapsed = Date.now() - start;
    // 10 retries × ~30ms + jitter: should surface an error
    assert.notEqual(child.status, 0, 'child should fail when lock is contended');
    assert.ok(elapsed > 200, 'child should have waited through retry loop');

    // Lockfile preserved (not force-unlinked)
    assert.ok(fs.existsSync(lockPath), 'held lock must not be force-unlinked by contender');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
