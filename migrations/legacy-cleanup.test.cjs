'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

function withFakeHome(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-legacy-test-'));
  const originalHome = process.env.HOME;
  process.env.HOME = tmp;

  // Reset the module cache so LEGACY_PATHS re-resolve against the fake HOME.
  delete require.cache[require.resolve('./legacy-cleanup.cjs')];

  try {
    return fn(tmp, require('./legacy-cleanup.cjs'));
  } finally {
    process.env.HOME = originalHome;
    delete require.cache[require.resolve('./legacy-cleanup.cjs')];
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

test('audit functions do not mutate user-curated config files', () => {
  withFakeHome((home, mod) => {
    const claudeDir = path.join(home, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });

    const settingsPath = path.join(claudeDir, 'settings.json');
    const settingsBody = JSON.stringify({
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: '~/.claude/hooks/gsd-session-state.sh' }] },
        ],
      },
    }, null, 2) + '\n';
    fs.writeFileSync(settingsPath, settingsBody);

    const agentsDir = path.join(claudeDir, 'agents');
    fs.mkdirSync(agentsDir);
    fs.writeFileSync(path.join(agentsDir, 'gsd-sentinel.md'), '# sentinel\n');

    const skillsDir = path.join(claudeDir, 'skills', 'gsd-sentinel');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'SKILL.md'), '# skill sentinel\n');

    const hooksDir = path.join(claudeDir, 'hooks');
    fs.mkdirSync(hooksDir);
    const hookPath = path.join(hooksDir, 'gsd-session-state.sh');
    fs.writeFileSync(hookPath, '#!/bin/sh\necho sentinel\n');

    const projectDir = path.join(home, 'project');
    fs.mkdirSync(projectDir);
    const mcpPath = path.join(projectDir, '.mcp.json');
    const mcpBody = JSON.stringify({
      mcpServers: {
        gsd: { command: 'node', args: ['/home/user/.claude/get-shit-done/mcp/server.cjs'] },
      },
    }, null, 2) + '\n';
    fs.writeFileSync(mcpPath, mcpBody);

    const settingsFindings = mod.auditSettingsJson();
    const agentFindings = mod.auditGsdAgents();
    const skillFindings = mod.auditGsdSkills();
    const hookFindings = mod.auditHookFiles();
    const mcpFindings = mod.auditMcpJson(projectDir);

    assert.ok(settingsFindings.length > 0, 'settings audit should report legacy hook');
    assert.ok(agentFindings.length > 0, 'agents audit should report gsd-*.md');
    assert.ok(skillFindings.length > 0, 'skills audit should report gsd-* dir');
    assert.ok(hookFindings.length > 0, 'hooks audit should report legacy script');
    assert.ok(mcpFindings.length > 0, 'mcp audit should report legacy server');

    assert.equal(fs.readFileSync(settingsPath, 'utf8'), settingsBody, 'settings.json untouched');
    assert.equal(fs.readFileSync(mcpPath, 'utf8'), mcpBody, '.mcp.json untouched');
    assert.ok(fs.existsSync(path.join(agentsDir, 'gsd-sentinel.md')), 'agent file intact');
    assert.ok(fs.existsSync(path.join(skillsDir, 'SKILL.md')), 'skill dir intact');
    assert.ok(fs.existsSync(hookPath), 'hook script intact');
  });
});

test('module no longer exports autoMigrate or destructive clean* fns', () => {
  withFakeHome((_home, mod) => {
    assert.equal(typeof mod.autoMigrate, 'undefined');
    assert.equal(typeof mod.cleanSettingsHooks, 'undefined');
    assert.equal(typeof mod.cleanGsdAgents, 'undefined');
    assert.equal(typeof mod.cleanGsdSkills, 'undefined');
    assert.equal(typeof mod.cleanHookFiles, 'undefined');
    assert.equal(typeof mod.cleanMcpEntries, 'undefined');
  });
});
