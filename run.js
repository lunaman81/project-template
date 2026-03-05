#!/usr/bin/env node
/**
 * run.js — Entry point for all push modes
 *
 * Usage:
 *   node run.js --code "feat: add login page"
 *   node run.js --push
 *   node run.js --live
 *
 * CUSTOMIZE FOR YOUR PROJECT:
 *   --code: Works out of the box. Stages files + pushes with QA.
 *   --push: Add your batch/scheduled data logic (e.g. pull from API, generate report).
 *   --live: Add your real-time integration logic (e.g. connect to live API, merge data).
 */

const { pushWithQA } = require('./push-wrapper');

const args = process.argv.slice(2);

async function main() {
  // ── --code mode ───────────────────────────────────────────────
  // Pushes code changes with a description.
  // CUSTOMIZE: Add any pre-push build steps (lint, compile, etc.)
  if (args[0] === '--code') {
    const description = args.slice(1).join(' ');
    if (!description) {
      console.error('Usage: node run.js --code "description of changes"');
      process.exit(1);
    }

    // CUSTOMIZE: List the files your project typically changes,
    // or use '.' to stage everything. Be explicit to avoid pushing secrets.
    const files = ['.'];

    await pushWithQA({ mode: 'code', files, description });
    return;
  }

  // ── --push mode ───────────────────────────────────────────────
  // For batch/scheduled data pushes (e.g. daily report, CSV export).
  // CUSTOMIZE: Replace the stub below with your data-fetching logic.
  //   Example: pull data from an API, write to a file, then push.
  if (args[0] === '--push') {
    console.log('── Push mode: batch data ──');

    // CUSTOMIZE: Add your data-fetching logic here.
    // Example:
    //   const data = await fetchFromAPI();
    //   fs.writeFileSync('data/latest.json', JSON.stringify(data));
    console.log('   (stub) No data source configured yet.');

    // CUSTOMIZE: Set files to the data files your project generates
    const dataFiles = [];
    const description = 'Batch data push';

    await pushWithQA({ mode: 'data', files: dataFiles, description });
    return;
  }

  // ── --live mode ───────────────────────────────────────────────
  // For real-time/live integration pushes (e.g. live API merge, streaming data).
  // CUSTOMIZE: Replace the stub below with your live integration logic.
  //   Example: connect to a gateway, merge live data, then push.
  if (args[0] === '--live') {
    console.log('── Live mode: real-time integration ──');

    // CUSTOMIZE: Add your live integration logic here.
    // Example:
    //   await connectToGateway();
    //   const liveData = await fetchLiveData();
    //   fs.writeFileSync('data/live.json', JSON.stringify(liveData));
    console.log('   (stub) No live integration configured yet.');

    const liveFiles = [];
    const description = 'Live data push';

    await pushWithQA({ mode: 'live', files: liveFiles, description });
    return;
  }

  // ── No valid flag ─────────────────────────────────────────────
  console.log('Usage:');
  console.log('  node run.js --code "description"   Push code changes');
  console.log('  node run.js --push                 Batch data push');
  console.log('  node run.js --live                 Live integration push');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
