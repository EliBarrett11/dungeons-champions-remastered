// Browser smoke test for the prototype Expedition (M2 AC-11; M3 checkpoint D: roster Champions).
//
// Drives the production build in a real Chromium through Playwright. Playwright is NOT a repository
// dependency: this script uses a separately installed copy (for example a global install), found
// through NODE_PATH. Usage, from the repository root:
//
//   npm run build
//   NODE_PATH="$(npm root -g)" node apps/web/scripts/smoke.mjs [screenshot-directory]
//
// Exit code 0 means every check passed; 1 means a check failed; 2 means Playwright is unavailable.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('smoke: cannot run: Playwright is not installed (set NODE_PATH to a directory that contains it).');
  process.exit(2);
}

const webDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shots = process.argv[2] ? resolve(process.argv[2]) : null;
if (shots) mkdirSync(shots, { recursive: true });
const PORT = 4317;
const BASE = `http://127.0.0.1:${PORT}/`;

let failures = 0;
function check(condition, label) {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}`);
  if (!condition) failures += 1;
}

function startPreview() {
  // Run Vite's own entry point with this Node binary (not through npx), so killing the child
  // process really stops the server.
  const vitePackage = createRequire(join(webDir, 'package.json')).resolve('vite/package.json');
  const viteBin = join(dirname(vitePackage), 'bin', 'vite.js');
  const server = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: webDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((resolveReady, reject) => {
    const timeout = setTimeout(() => reject(new Error('vite preview did not start')), 20_000);
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes(String(PORT))) {
        clearTimeout(timeout);
        resolveReady(server);
      }
    });
    server.on('exit', (code) => reject(new Error(`vite preview exited with ${code}`)));
  });
}

async function shot(page, name) {
  if (shots) await page.screenshot({ path: join(shots, `${name}.png`), fullPage: true });
}

const text = (page, testId) => page.getByTestId(testId).innerText();

async function placeTeam(page) {
  for (const [instance, slot] of [['c1', 1], ['c2', 0], ['c3', 8]]) {
    await page.getByTestId(`select-${instance}`).click();
    await page.getByTestId(`slot-${slot}`).click();
  }
}

async function fightAndFinish(page, { skip = true } = {}) {
  await page.getByTestId('start-battle').click();
  await page.getByTestId('screen-battle').waitFor();
  if (skip) await page.getByTestId('skip-battle').click();
  await page.getByTestId('battle-result').waitFor({ timeout: 30_000 });
  const outcome = await text(page, 'battle-outcome');
  return outcome;
}

async function main() {
  const server = await startPreview();
  const browser = await chromium.launch();
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

    // ---- Flow 1: seed 24 clears all three Monster Rounds, then restarts cleanly. ----
    await page.goto(`${BASE}?seed=24`);
    await page.getByTestId('screen-preparation').waitFor();
    check((await page.title()).startsWith('Dungeons & Champions'), 'app loads with its title');
    check((await text(page, 'status-seed')) === '24', 'seed from the URL is used');
    const benchText = await page.locator('[data-testid^="bench-"]').allInnerTexts();
    check(benchText.length === 4, `bench shows 4 roster Champions (got ${benchText.length})`);
    check(benchText.every((t) => /DC-\d{3}/.test(t) && /Proposed Role:/.test(t)), 'bench cards show roster IDs and PROPOSED Roles');
    const traits = await page.locator('[data-testid^="traits-DC-"]').allInnerTexts();
    check(traits.length === 4 && traits.every((t) => t.split(' · ').length === 3), `each card shows Class · Race · Origin (${traits.join(' | ')})`);
    check(benchText.some((t) => t.includes('Temporary placeholder stats')), 'placeholder stats are labelled (seed 24 bench has a Ranger)');
    await page.locator('[data-testid="bench-c1"] summary').click();
    check((await text(page, 'bench-c1')).includes('Proposed abilities (not implemented)') && (await text(page, 'bench-c1')).includes('Ultimate:'), 'proposed abilities are shown and marked not implemented');
    check(await page.getByTestId('start-battle').isDisabled(), 'Start battle is disabled with no team');
    await shot(page, '01-preparation-empty');

    await placeTeam(page);
    await page.getByTestId('select-c4').click();
    check(await page.getByTestId('slot-2').isEnabled(), 'empty slot is clickable when a Champion is selected');
    await page.getByTestId('slot-2').click();
    check((await text(page, 'message')).includes('At most 3 Champions'), 'a fourth Champion is refused with a message');
    check(await page.getByTestId('start-battle').isEnabled(), 'Start battle is enabled with a legal team');
    await shot(page, '02-preparation-team');

    // Round 1 plays back without skipping, to exercise the animation path.
    let outcome = await fightAndFinish(page, { skip: false });
    check(outcome === 'Victory', `round 1 shows Victory (got ${outcome})`);
    check((await page.getByTestId('battle-log').locator('li').count()) > 10, 'combat log lists events');
    check((await text(page, 'hp-m1-1')) === 'Defeated', 'defeated monster is shown as defeated');
    const firstLog = await text(page, 'battle-log');
    await shot(page, '03-battle-victory');
    await page.getByTestId('finish-battle').click();
    await page.getByTestId('screen-reward').waitFor();
    await shot(page, '04-reward');
    await page.getByTestId('choose-e1-champion-a').click();
    await page.getByTestId('screen-decision').waitFor();
    check((await text(page, 'status-gold')) === '1', 'reward Gold applied once (1)');
    check((await text(page, 'status-bench')) === '5', 'reward Champion joined the bench (5)');
    await shot(page, '05-decision');
    await page.getByTestId('continue').click();
    await page.getByTestId('screen-preparation').waitFor();
    check((await text(page, 'status-round')) === '2 / 3', 'continue moves to Monster Round 2');

    outcome = await fightAndFinish(page);
    check(outcome === 'Victory', `round 2 shows Victory (got ${outcome})`);
    await page.getByTestId('finish-battle').click();
    await page.getByTestId('choose-e2-gold').click();
    check((await text(page, 'status-gold')) === '4', 'Gold totals 4 after round 2');
    await page.getByTestId('continue').click();
    outcome = await fightAndFinish(page);
    check(outcome === 'Victory', `round 3 shows Victory (got ${outcome})`);
    await page.getByTestId('finish-battle').click();
    await page.getByTestId('choose-e3-champion-a').click();
    await page.getByTestId('screen-ended').waitFor();
    check((await text(page, 'end-title')) === 'Expedition cleared!', 'end screen shows the clear');
    check((await text(page, 'end-summary')).includes('Monster Rounds won: 3 of 3. Gold: 5. Champions: 6.'), 'end summary totals');
    await shot(page, '06-cleared');

    await page.getByTestId('new-expedition').click();
    await page.getByTestId('screen-preparation').waitFor();
    check((await text(page, 'status-gold')) === '0', 'new Expedition resets Gold');
    check((await text(page, 'status-bench')) === '4', 'new Expedition resets the bench');
    check((await text(page, 'status-round')) === '1 / 3', 'new Expedition starts at round 1');
    check((await page.getByTestId('battle-log').count()) === 0, 'no stale battle log after restart');
    check(await page.getByTestId('start-battle').isDisabled(), 'no stale formation after restart');

    // Two synchronous clicks on Start battle: only one battle starts; the second is refused.
    await placeTeam(page);
    await page.getByTestId('start-battle').evaluate((el) => {
      el.click();
      el.click();
    });
    await page.getByTestId('screen-battle').waitFor();
    check(
      (await text(page, 'message')).includes('"startBattle" is not available during the battle phase'),
      'the second of two instant clicks on Start battle is refused (one battle only)',
    );

    // ---- Seeded replay in the browser: same seed, same team -> same bench and same battle log. ----
    await page.goto(`${BASE}?seed=24`);
    await page.getByTestId('screen-preparation').waitFor();
    check(JSON.stringify(await page.locator('[data-testid^="bench-"]').allInnerTexts()) === JSON.stringify(benchText), 'reloading seed 24 shows the same bench');
    await placeTeam(page);
    await fightAndFinish(page);
    check((await text(page, 'battle-log')) === firstLog, 'reloading seed 24 replays an identical round 1 battle log (skipped vs played back)');

    // ---- Flow 2: seed 1 is defeated in round 3. ----
    await page.goto(`${BASE}?seed=1`);
    await placeTeam(page);
    for (const bundle of ['e1-gold', 'e2-gold']) {
      await fightAndFinish(page);
      await page.getByTestId('finish-battle').click();
      await page.getByTestId(`choose-${bundle}`).click();
      await page.getByTestId('continue').click();
    }
    outcome = await fightAndFinish(page);
    check(outcome === 'Defeat', `seed 1 round 3 shows Defeat (got ${outcome})`);
    await shot(page, '07-defeat');
    await page.getByTestId('finish-battle').click();
    await page.getByTestId('screen-ended').waitFor();
    check((await text(page, 'end-title')) === 'Expedition over: defeated', 'defeat ends the Expedition');
    check((await text(page, 'status-gold')) === '6', 'defeat grants no reward (Gold stays 6)');
    await shot(page, '08-defeated-end');

    // ---- Flow 3: seed 26 ends round 2 in a draw. ----
    await page.goto(`${BASE}?seed=26`);
    await placeTeam(page);
    await fightAndFinish(page);
    await page.getByTestId('finish-battle').click();
    await page.getByTestId('choose-e1-gold').click();
    await page.getByTestId('continue').click();
    outcome = await fightAndFinish(page);
    check(outcome === 'Draw', `seed 26 round 2 shows Draw (got ${outcome})`);
    await page.getByTestId('finish-battle').click();
    check((await text(page, 'end-title')) === 'Expedition over: draw', 'a draw ends the Expedition');

    // ---- Flow 4: retreat after round 1. ----
    await page.goto(`${BASE}?seed=24`);
    await placeTeam(page);
    await fightAndFinish(page);
    await page.getByTestId('finish-battle').click();
    await page.getByTestId('choose-e1-gold').click();
    await page.getByTestId('end-expedition').click();
    check((await text(page, 'end-title')) === 'Expedition ended', 'ending at the decision ends the Expedition');
    check((await text(page, 'status-gold')) === '3', 'retreat keeps the Gold earned');

    // ---- Narrow viewport renders without horizontal scrolling. ----
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${BASE}?seed=24`);
    await page.getByTestId('screen-preparation').waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 0, `no horizontal scroll at 375px (overflow ${overflow}px)`);
    await shot(page, '09-mobile');

    check(errors.length === 0, `no console errors or warnings${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(failures === 0 ? '\nSMOKE: PASS' : `\nSMOKE: FAIL (${failures} check(s))`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
