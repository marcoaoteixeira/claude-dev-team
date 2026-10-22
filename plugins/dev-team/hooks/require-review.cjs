#!/usr/bin/env node
// PreToolUse hook (Bash): gate `git push` behind a passed review + QA.
//
// development-pipeline writes, after review and QA approve a branch:
//   <main checkout>/.claude/state/reviews/<branch with / replaced by __>.json
//   {"branch": "...", "commit": "<sha>", "timestamp": "...", "ticket": "..."}
//
// A push is allowed only when the commit being pushed is the reviewed commit,
// or descends from it with nothing but Markdown files changed since
// (CHANGELOG/README/docs written after review). Pushes to the default branch
// are always denied. Works from worktrees: refs are resolved in the repo the
// command runs in, markers are read from the main checkout.
//
// Pushes that are not ours to judge (tags only, --delete, unparsable) pass.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

function git(dir, ...args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

// Split a shell command into words, honoring simple quotes.
function words(cmd) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(cmd))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let data;
  try { data = JSON.parse(input); } catch { process.exit(0); }
  const command = data?.tool_input?.command ?? '';
  let dir = data?.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();

  // Only the git push segment of a compound command matters.
  const segments = command.split(/&&|\|\||;|\n/);
  for (const seg of segments) {
    const w = words(seg.trim());
    if (w[0] === 'cd' && w[1]) { dir = path.resolve(dir, w[1]); continue; }
    if (w[0] !== 'git') continue;

    let i = 1;
    let gitDir = dir;
    while (i < w.length && w[i].startsWith('-')) {
      if (w[i] === '-C') { gitDir = path.resolve(dir, w[i + 1]); i += 2; } else if (w[i] === '-c') { i += 2; } else { i += 1; }
    }
    if (w[i] !== 'push') continue;
    check(gitDir, w.slice(i + 1));
  }
  process.exit(0);
});

function check(dir, args) {
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--delete' || a === '-d' || a === '--tags' && args.length === 1) return;
    if (a === '--all' || a === '--mirror') deny('Pushing all branches is not allowed by the review gate. Push one reviewed branch.');
    if (a === '-o' || a === '--push-option' || a === '--repo' || a === '--receive-pack') { i++; continue; }
    if (a.startsWith('-')) continue;
    positional.push(a);
  }

  const remote = positional[0] ?? 'origin';
  let refspec = positional[1];
  if (!refspec) refspec = git(dir, 'rev-parse', '--abbrev-ref', 'HEAD');
  if (!refspec || refspec === 'HEAD') return; // detached / cannot tell
  if (refspec.startsWith('+')) refspec = refspec.slice(1);
  const [srcRaw, dstRaw] = refspec.split(':');
  const src = srcRaw === 'HEAD' || srcRaw === '' ? git(dir, 'rev-parse', '--abbrev-ref', 'HEAD') : srcRaw;
  if (!src) return;
  if (src.startsWith('refs/tags/') || git(dir, 'show-ref', '--verify', '--quiet', `refs/tags/${src}`) !== null && git(dir, 'show-ref', '--verify', `refs/heads/${src}`) === null) return;
  const dst = (dstRaw ?? src).replace(/^refs\/heads\//, '');
  const branch = src.replace(/^refs\/heads\//, '');

  const defaultRef = git(dir, 'symbolic-ref', '--short', `refs/remotes/${remote}/HEAD`);
  const defaultBranch = defaultRef ? defaultRef.replace(`${remote}/`, '') : null;
  const protectedBranches = new Set([defaultBranch, 'main', 'master', 'develop'].filter(Boolean));
  if (protectedBranches.has(dst)) deny(`Direct push to '${dst}' is not allowed. Push a feature branch and open a PR.`);

  const sha = git(dir, 'rev-parse', '--verify', `${src}^{commit}`);
  if (!sha) return;

  const commonDir = git(dir, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  const mainRoot = commonDir ? path.dirname(commonDir) : dir;
  const marker = path.join(mainRoot, '.claude', 'state', 'reviews', `${branch.replace(/[\\/]/g, '__')}.json`);
  const manual = 'If you want to push without the pipeline review, run the push yourself (`! git push ...`).';

  if (!fs.existsSync(marker)) deny(`No review record for branch '${branch}' (${marker}). Review and QA must pass before pushing. ${manual}`);
  let reviewed;
  try { reviewed = JSON.parse(fs.readFileSync(marker, 'utf8')).commit; } catch { /* handled below */ }
  if (!reviewed) deny(`Review record for '${branch}' is unreadable. Re-run the review. ${manual}`);
  if (reviewed === sha) return;

  if (git(dir, 'merge-base', '--is-ancestor', reviewed, sha) === null) {
    deny(`Branch '${branch}' (${sha.slice(0, 8)}) does not contain the reviewed commit ${reviewed.slice(0, 8)}. Re-run the review. ${manual}`);
  }
  const changed = (git(dir, 'diff', '--name-only', `${reviewed}..${sha}`) ?? '').split('\n').filter(Boolean);
  const nonDocs = changed.filter((f) => !/\.md$/i.test(f));
  if (nonDocs.length) {
    deny(`Commits after the review of '${branch}' change code: ${nonDocs.slice(0, 5).join(', ')}${nonDocs.length > 5 ? ', …' : ''}. Re-run review on the new commits. ${manual}`);
  }
}
