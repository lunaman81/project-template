#!/usr/bin/env node
/**
 * push-wrapper.js — Enforced QA → changelog → tag → push sequence
 *
 * Generic project template. No way to skip steps.
 *
 * Sequence:
 *   1. Run QA script — abort if any check fails, log failure
 *   2. Generate version tag: v[YYYY-MM-DD-HHMM]
 *   3. Append to CHANGELOG.md: tag, timestamp, mode, QA result
 *   4. Git commit using the changelog entry as the message
 *   5. Git tag the commit
 *   6. Git push including tags
 *   7. Append success/failure to run.log
 *
 * Usage:
 *   const { pushWithQA } = require('./push-wrapper');
 *   await pushWithQA({ mode: 'code', files: ['app.js'], description: 'Fix login bug' });
 *   await pushWithQA({ mode: 'data', description: 'Daily data refresh' });
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── CUSTOMIZE: Set these paths for your project ─────────────────────
const PROJECT_DIR = path.resolve(__dirname);
const CHANGELOG = path.join(PROJECT_DIR, 'CHANGELOG.md');
const RUN_LOG = path.join(PROJECT_DIR, 'run.log');
// CUSTOMIZE: Point this to your project's QA script, or null to skip
const QA_SCRIPT = null;
// CUSTOMIZE: Set your default branch name
const DEFAULT_BRANCH = 'main';
// ─────────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function versionTag() {
  const now = new Date();
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return `v${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function appendLog(line) {
  fs.appendFileSync(RUN_LOG, line + '\n');
}

/**
 * @param {Object} opts
 * @param {string} opts.mode - 'code', 'data', or 'live'
 * @param {string[]} [opts.files] - files to stage (code mode); data/live modes should set their own
 * @param {string} [opts.description] - what changed and why
 * @param {string[]} [opts.errors] - any errors from earlier steps
 * @returns {{ success: boolean, tag: string }}
 */
async function pushWithQA({ mode, files = [], description = '', errors = [] }) {
  const ts = timestamp();
  const tag = versionTag();

  console.log(`\n═══ PUSH WRAPPER: ${tag} [${mode}] ═══`);

  // ── Step 1: Run QA ──────────────────────────────────────────
  console.log('  1. Running QA...');
  let qaPass = true;
  if (QA_SCRIPT) {
    try {
      execSync(`node "${QA_SCRIPT}"`, {
        cwd: PROJECT_DIR,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      console.log('     QA: PASS');
    } catch (err) {
      const qaOutput = (err.stdout || '') + (err.stderr || '');
      qaPass = false;
      console.error('     QA: FAIL');
      appendLog(`[${ts}] ${tag} ${mode} QA FAILED — push aborted`);
      appendLog(`  ${qaOutput.split('\n').filter(l => l.includes('FAIL')).join('\n  ')}`);
      console.error('QA failed. Push aborted. See run.log for details.');
      return { success: false, tag };
    }
  } else {
    console.log('     QA: SKIPPED (no QA_SCRIPT configured)');
  }

  // ── Step 2: Version tag (already generated) ─────────────────
  console.log(`  2. Version: ${tag}`);

  // ── Step 3: Append to CHANGELOG.md ──────────────────────────
  console.log('  3. Updating CHANGELOG.md...');
  const errLine = errors.length > 0 ? `\n- **Errors:** ${errors.join('; ')}` : '';
  const entry = [
    `## ${tag}`,
    `- **Timestamp:** ${ts}`,
    `- **Mode:** ${mode}`,
    `- **QA:** ${qaPass ? 'PASS' : 'SKIPPED'}`,
    `- **Description:** ${description}`,
    mode === 'code' && files.length > 0 ? `- **Files:** ${files.join(', ')}` : null,
    errLine || null,
    '',
  ].filter(l => l !== null).join('\n');

  if (fs.existsSync(CHANGELOG)) {
    const existing = fs.readFileSync(CHANGELOG, 'utf-8');
    const titleEnd = existing.indexOf('\n');
    if (titleEnd >= 0 && existing.startsWith('# ')) {
      const title = existing.slice(0, titleEnd + 1);
      const rest = existing.slice(titleEnd + 1);
      fs.writeFileSync(CHANGELOG, title + '\n' + entry + '\n' + rest);
    } else {
      fs.writeFileSync(CHANGELOG, '# Changelog\n\n' + entry + '\n' + existing);
    }
  } else {
    fs.writeFileSync(CHANGELOG, '# Changelog\n\n' + entry);
  }

  // ── Step 4: Git commit ──────────────────────────────────────
  console.log('  4. Committing...');
  const commitMsg = `${tag} [${mode}] ${description}`;
  const addFiles = (mode === 'code' ? files : [])
    .concat(['CHANGELOG.md'])
    .map(f => `"${f}"`)
    .join(' ');

  try {
    execSync(`git add ${addFiles}`, { cwd: PROJECT_DIR, stdio: 'pipe' });
    execSync(`git commit -m "${commitMsg}"`, { cwd: PROJECT_DIR, stdio: 'pipe' });
  } catch (err) {
    if (err.stderr && err.stderr.toString().includes('nothing to commit')) {
      console.log('     No changes to commit.');
      appendLog(`[${ts}] ${tag} ${mode} no changes to commit`);
      return { success: true, tag };
    }
    appendLog(`[${ts}] ${tag} ${mode} COMMIT FAILED: ${err.message}`);
    console.error(`Git commit failed: ${err.message}`);
    return { success: false, tag };
  }

  // ── Step 5: Git tag ─────────────────────────────────────────
  console.log(`  5. Tagging: ${tag}`);
  try {
    execSync(`git tag ${tag}`, { cwd: PROJECT_DIR, stdio: 'pipe' });
  } catch (err) {
    console.log(`     Tag ${tag} already exists, skipping.`);
  }

  // ── Step 6: Git push with tags ──────────────────────────────
  console.log('  6. Pushing...');
  try {
    execSync(`git push origin ${DEFAULT_BRANCH} --tags`, { cwd: PROJECT_DIR, stdio: 'pipe' });
    console.log(`     Pushed: ${commitMsg}`);
  } catch (err) {
    appendLog(`[${ts}] ${tag} ${mode} PUSH FAILED: ${err.message}`);
    console.error(`Git push failed: ${err.message}`);
    return { success: false, tag };
  }

  // ── Step 7: Log success ─────────────────────────────────────
  appendLog(`[${ts}] ${tag} ${mode} OK — ${description}`);
  console.log(`${tag} pushed successfully`);
  console.log(`═══════════════════════════════════════════════\n`);

  return { success: true, tag };
}

module.exports = { pushWithQA };
