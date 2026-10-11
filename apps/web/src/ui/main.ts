import { PROTOTYPE_CONTENT, contentProblems, parseSeed } from '../game/index';
import { ExpeditionApp } from './app';

/** A fresh Expedition seed. Browser randomness is used only here, never inside game logic. */
function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app element');
}

const problems = contentProblems(PROTOTYPE_CONTENT);
if (problems.length > 0) {
  // Missing or inconsistent data: explain instead of starting a broken Expedition (AC-08).
  root.replaceChildren(
    Object.assign(document.createElement('p'), { textContent: `The game data is incomplete: ${problems.join(' ')}` }),
  );
} else {
  // ?seed=123 reproduces an Expedition exactly (same battles for the same choices).
  const seed = parseSeed(new URLSearchParams(location.search).get('seed')) ?? randomSeed();
  new ExpeditionApp(root, PROTOTYPE_CONTENT, seed, randomSeed).start();
}
