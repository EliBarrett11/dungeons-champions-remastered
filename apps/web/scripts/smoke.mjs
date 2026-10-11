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
    check((await text(page, 'status-gold')) === '3', 'a new Expedition starts with 3 Gold (P-025)');
    const benchText = await page.locator('[data-testid^="bench-"]').allInnerTexts();
    check(benchText.length === 4, `bench shows 4 roster Champions (got ${benchText.length})`);
    check(benchText.every((t) => /DC-\d{3}/.test(t) && /Proposed Role:/.test(t)), 'bench cards show roster IDs and PROPOSED Roles');
    // Scoped to the bench: the M4 Tavern cards show the same Class · Race · Origin line.
    const traits = await page.locator('[data-testid^="bench-"] [data-testid^="traits-DC-"]').allInnerTexts();
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
    check((await text(page, 'status-gold')) === '4', 'reward Gold applied once (3 starting + 1 = 4)');
    check((await text(page, 'status-bench')) === '5', 'reward Champion joined the bench (5)');
    await shot(page, '05-decision');
    await page.getByTestId('continue').click();
    await page.getByTestId('screen-preparation').waitFor();
    check((await text(page, 'status-round')) === '2 / 3', 'continue moves to Monster Round 2');

    outcome = await fightAndFinish(page);
    check(outcome === 'Victory', `round 2 shows Victory (got ${outcome})`);
    await page.getByTestId('finish-battle').click();
    await page.getByTestId('choose-e2-gold').click();
    check((await text(page, 'status-gold')) === '7', 'Gold carries between rounds: 7 after round 2');
    await page.getByTestId('continue').click();
    outcome = await fightAndFinish(page);
    check(outcome === 'Victory', `round 3 shows Victory (got ${outcome})`);
    await page.getByTestId('finish-battle').click();
    await page.getByTestId('choose-e3-champion-a').click();
    await page.getByTestId('screen-ended').waitFor();
    check((await text(page, 'end-title')) === 'Expedition cleared!', 'end screen shows the clear');
    check((await text(page, 'end-summary')).includes('Monster Rounds won: 3 of 3. Gold: 8. Champions: 6.'), 'end summary totals');
    await shot(page, '06-cleared');

    await page.getByTestId('new-expedition').click();
    await page.getByTestId('screen-preparation').waitFor();
    check((await text(page, 'status-gold')) === '3', 'new Expedition resets Gold to 3');
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
    check((await text(page, 'status-gold')) === '9', 'defeat grants no reward (Gold stays 9)');
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
    check((await text(page, 'status-gold')) === '6', 'retreat keeps the Gold earned (6)');

    // ---- Flow 5 (M4): the Tavern. Seed 24's shop 0 is DC-022 (1), DC-007 (4), DC-109 (1),
    // DC-108 (4), DC-122 (4), DC-115 (4); pinned against an independent reference in shop.test.ts. ----
    const shopTexts = async () => page.locator('[data-testid^="shop-slot-"]').allInnerTexts();
    await page.goto(`${BASE}?seed=24`);
    await page.getByTestId('tavern').waitFor();
    check((await page.locator('[data-testid^="shop-slot-"]').count()) === 6, 'the Tavern shows six offers on Round 1 preparation');
    const prices = await page.locator('[data-testid^="price-"]').allInnerTexts();
    check(
      JSON.stringify(prices) === JSON.stringify([1, 4, 1, 4, 4, 4].map((n) => `Price: ${n} Gold · provisional`)),
      `prices match the proposed cost ranks and are marked provisional (${prices.join(' | ')})`,
    );
    const firstShop = await shopTexts();
    check(firstShop[0].includes('DC-022') && firstShop[1].includes('DC-007'), 'offers show roster Champions (DC-022, DC-007, …)');
    check((await text(page, 'tavern-summary')).includes('You have 3 Gold and own 4 of 12 Champions'), 'the Tavern shows 3 Gold and 4 of 12 owned');
    check(await page.getByTestId('buy-1').isDisabled() && (await text(page, 'buy-1')) === 'Need 4 Gold (you have 3)', 'an unaffordable offer is disabled and says how much Gold is needed');
    check((await page.getByTestId('buy-0').getAttribute('aria-label')).startsWith('Buy ') , 'buy buttons have accessible labels');
    await page.getByTestId('buy-0').click();
    check((await text(page, 'status-gold')) === '2', 'buying deducts the exact price at once (3 - 1 = 2)');
    check((await text(page, 'status-bench')) === '5', 'the bought Champion joins the collection at once (5)');
    check((await text(page, 'buy-0')) === 'Sold' && (await page.getByTestId('buy-0').isDisabled()), 'the bought slot shows "Sold" and is disabled');
    check((await text(page, 'bench-c5')).includes('DC-022'), 'the bought Champion appears in Your Champions');
    await page.getByTestId('buy-0').evaluate((el) => el.click()); // a forced click on a sold slot
    check((await text(page, 'status-gold')) === '2' && (await text(page, 'status-bench')) === '5', 'clicking a sold slot again changes nothing');
    await page.getByTestId('reroll').click();
    check((await text(page, 'status-gold')) === '0', 'a reroll deducts exactly 2 Gold (2 - 2 = 0)');
    const rerolled = await shopTexts();
    check(rerolled.length === 6 && JSON.stringify(rerolled) !== JSON.stringify(firstShop) && !rerolled.some((t) => t.includes('(sold)')), 'a reroll replaces all six slots with unsold offers');
    check(!rerolled.some((t) => t.includes('DC-022')), 'the bought Champion is not offered again');
    check(await page.getByTestId('reroll').isDisabled() && (await text(page, 'reroll')) === 'Reroll: need 2 Gold (you have 0)', 'an unaffordable reroll is disabled and says the Gold required');
    await shot(page, '10-tavern');

    // Seeded replay: the same seed and the same actions give the same offers.
    await page.goto(`${BASE}?seed=24`);
    await page.getByTestId('tavern').waitFor();
    check(JSON.stringify(await shopTexts()) === JSON.stringify(firstShop), 'reloading seed 24 shows the same first shop');
    await page.getByTestId('buy-0').click();
    await page.getByTestId('reroll').click();
    check(JSON.stringify(await shopTexts()) === JSON.stringify(rerolled), 'the same purchase and reroll give the same rerolled shop');

    // The shop exists only during preparation.
    await placeTeam(page);
    await page.getByTestId('start-battle').click();
    await page.getByTestId('screen-battle').waitFor();
    const noShop = async () => (await page.getByTestId('tavern').count()) === 0 && (await page.locator('[data-testid^="buy-"], [data-testid="reroll"]').count()) === 0;
    check(await noShop(), 'no Tavern controls during a battle');
    await page.getByTestId('skip-battle').click();
    await page.getByTestId('finish-battle').click();
    await page.getByTestId('screen-reward').waitFor();
    check(await noShop(), 'no Tavern controls on the reward screen');
    check((await text(page, 'reward-hint')).includes('can be spent in the Tavern during preparation'), 'the reward screen no longer says Gold cannot be spent');
    check(await page.getByTestId('choose-e1-gold').isEnabled() && await page.getByTestId('choose-e1-champion-a').isEnabled(), 'all three reward bundles are available below the cap');
    await page.getByTestId('choose-e1-gold').click();
    await page.getByTestId('screen-decision').waitFor();
    check(await noShop(), 'no Tavern controls at the next-step choice');
    check((await text(page, 'status-gold')) === '3', 'Gold shown after the reward (0 + 3 = 3)');
    await page.getByTestId('continue').click();
    await page.getByTestId('tavern').waitFor();
    const round2 = await shopTexts();
    check(round2.length === 6 && JSON.stringify(round2) !== JSON.stringify(rerolled), 'continuing to Round 2 refreshes the Tavern with six new offers');
    check((await text(page, 'tavern-summary')).includes('You have 3 Gold'), 'Gold carries into Round 2 preparation');
    await page.getByTestId('remove-c1').click();
    await page.getByTestId('remove-c2').click();
    await page.getByTestId('remove-c3').click();
    await page.getByTestId('select-c5').click();
    await page.getByTestId('slot-1').click();
    check((await text(page, 'bench-c5')).includes('On board: front row, slot 1'), 'a bought Champion can be placed on the board');
    await page.getByTestId('start-battle').click();
    await page.getByTestId('screen-battle').waitFor();
    await page.getByTestId('skip-battle').click();
    await page.getByTestId('finish-battle').click();
    if ((await page.getByTestId('screen-reward').count()) > 0) {
      await page.getByTestId('choose-e2-gold').click();
      await page.getByTestId('end-expedition').click();
    }
    await page.getByTestId('screen-ended').waitFor();
    check(await noShop(), 'no Tavern controls on the end screen');
    await page.getByTestId('new-expedition').click();
    await page.getByTestId('tavern').waitFor();
    check((await text(page, 'status-gold')) === '3' && (await page.locator('[data-testid^="shop-slot-"]').count()) === 6, 'restart resets Gold to 3 with a fresh six-slot Tavern');

    // ---- Narrow viewport renders without horizontal scrolling. ----
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${BASE}?seed=24`);
    await page.getByTestId('screen-preparation').waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 0, `no horizontal scroll at 375px (overflow ${overflow}px)`);
    const buyBoxes = await page.locator('[data-testid^="buy-"]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().right));
    check(buyBoxes.length === 6 && buyBoxes.every((right) => right <= 375), 'all six Tavern buy buttons fit the 375px screen');
    await page.getByTestId('tavern').scrollIntoViewIfNeeded();
    await shot(page, '11-tavern-mobile');
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
