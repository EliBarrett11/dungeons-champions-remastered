import type { UnitStats } from '@dc/engine';
import {
  EXPEDITION_CONFIG,
  boardRows,
  buildBattleView,
  championOf,
  createExpedition,
  currentEncounter,
  eventCountAt,
  formationProblems,
  outcomeText,
  rowName,
  snapshotAfter,
  transition,
} from '../game/index';
import type {
  BattleView,
  BenchChampion,
  ChampionFixture,
  EndReason,
  ExpeditionAction,
  ExpeditionContent,
  ExpeditionState,
  RewardBundle,
} from '../game/index';
import { button, h } from './dom';

/** Playback speed: simulated milliseconds advanced per real tick. Presentation only. */
const TICK_MS = 50;
const SIM_MS_PER_TICK = 250;

interface Message {
  readonly text: string;
  readonly details: readonly string[];
}

interface Playback {
  readonly battleNumber: number;
  clockMs: number;
  timer: ReturnType<typeof setInterval> | null;
}

/**
 * Browser shell for the prototype Expedition. It holds the current ExpeditionState, sends every
 * player intent through `transition`, and renders the result. It never changes game state itself.
 */
export class ExpeditionApp {
  private state: ExpeditionState;
  private message: Message | null = null;
  private selected: string | null = null;
  private playback: Playback | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly content: ExpeditionContent,
    seed: number,
    private readonly newSeed: () => number,
  ) {
    this.state = createExpedition(seed);
  }

  start(): void {
    this.render();
  }

  private dispatch(action: ExpeditionAction): void {
    const result = transition(this.state, action, this.content);
    if (result.ok) {
      this.state = result.state;
      this.message = null;
      this.selected = null;
    } else {
      this.message = { text: result.error, details: result.details };
    }
    this.render();
  }

  private render(): void {
    // Any re-render discards the previous screen, so its playback timer must stop too.
    this.stopPlayback();
    if (this.state.phase !== 'battle') this.playback = null;
    this.root.replaceChildren(
      this.header(),
      this.messageBox(),
      h('main', { class: 'screen', 'data-testid': `screen-${this.state.phase}` }, this.screen()),
    );
  }

  private screen(): Node {
    switch (this.state.phase) {
      case 'preparation':
        return this.preparationScreen();
      case 'battle':
        return this.battleScreen();
      case 'reward':
        return this.rewardScreen();
      case 'decision':
        return this.decisionScreen();
      case 'ended':
        return this.endScreen();
    }
  }

  // ---- shared pieces -------------------------------------------------------------------------

  private header(): Node {
    const { state } = this;
    const total = EXPEDITION_CONFIG.encounterCount;
    const round = Math.min(state.encounterIndex + 1, total);
    return h(
      'header',
      { class: 'top' },
      h('h1', {}, 'Dungeons & Champions'),
      h('p', { class: 'subtitle' }, 'Prototype Expedition: fixture Champions and monsters, Basic Attacks only.'),
      h(
        'p',
        { class: 'status', 'data-testid': 'status' },
        this.stat('Monster Round', `${round} / ${total}`, 'status-round'),
        this.stat('Gold', state.gold, 'status-gold'),
        this.stat('Champions', state.bench.length, 'status-bench'),
        this.stat('Seed', state.seed, 'status-seed'),
      ),
    );
  }

  private stat(label: string, value: string | number, testId: string): Node {
    return h('span', { class: 'stat' }, `${label}: `, h('strong', { 'data-testid': testId }, value));
  }

  private messageBox(): Node {
    if (!this.message) return h('div', { 'aria-live': 'polite' });
    return h(
      'div',
      { class: 'message error', role: 'alert', 'data-testid': 'message' },
      h('strong', {}, this.message.text),
      this.message.details.length > 0 ? h('ul', {}, this.message.details.map((d) => h('li', {}, d))) : null,
    );
  }

  private statLine(stats: UnitStats): Node {
    const perSecond = (stats.attackSpeedMilli / 1000).toFixed(2);
    return h(
      'p',
      { class: 'stats' },
      `Health ${stats.health} · Attack ${stats.attack} · Armor ${stats.armor} · Accuracy +${stats.accuracy} · `,
      `Evasion +${stats.evasion} · ${perSecond} attacks/s`,
    );
  }

  private championName(instance: BenchChampion): string {
    return championOf(instance, this.content)?.name ?? instance.instanceId;
  }

  // ---- preparation ---------------------------------------------------------------------------

  private preparationScreen(): Node {
    const { state, content } = this;
    const encounter = currentEncounter(state, content);
    const problems = formationProblems(state.formation, state.bench.map((entry) => entry.instanceId));
    const placedSlot = new Map(state.formation.map((p) => [p.instanceId, p.slot]));

    const bench = h(
      'section',
      { class: 'panel' },
      h('h2', {}, 'Your Champions'),
      h('p', { class: 'hint' }, `Select a Champion, then click an empty slot on your board. Field ${EXPEDITION_CONFIG.minTeamSize}–${EXPEDITION_CONFIG.maxTeamSize}.`),
      h(
        'ul',
        { class: 'cards' },
        state.bench.map((instance) => {
          const champion = championOf(instance, content);
          const slot = placedSlot.get(instance.instanceId);
          const isSelected = this.selected === instance.instanceId;
          return h(
            'li',
            { class: `card${isSelected ? ' selected' : ''}`, 'data-testid': `bench-${instance.instanceId}` },
            h('h3', {}, champion?.name ?? instance.instanceId),
            champion ? this.championDetails(champion) : h('p', { class: 'warning' }, 'Champion data missing.'),
            slot === undefined
              ? button(isSelected ? 'Selected' : 'Select', () => this.select(instance.instanceId), {
                  'aria-pressed': String(isSelected),
                  'data-testid': `select-${instance.instanceId}`,
                })
              : h(
                  'p',
                  { class: 'placed' },
                  `On board: ${rowName(slot)} row, slot ${slot} `,
                  button('Remove', () => this.dispatch({ type: 'remove', instanceId: instance.instanceId }), {
                    'data-testid': `remove-${instance.instanceId}`,
                  }),
                ),
          );
        }),
      ),
    );

    const board = h(
      'section',
      { class: 'panel' },
      h('h2', {}, 'Your formation'),
      h('p', { class: 'hint' }, 'Enemies attack your frontmost occupied row first (lowest slot number first).'),
      this.boardGrid((slot) => {
        const placement = state.formation.find((p) => p.slot === slot);
        if (placement) {
          const instance = state.bench.find((b) => b.instanceId === placement.instanceId);
          return h('div', { class: 'slot filled', 'data-testid': `slot-${slot}` }, h('span', { class: 'slot-no' }, slot), instance ? this.championName(instance) : placement.instanceId);
        }
        return button(String(slot), () => this.placeSelected(slot), {
          class: 'slot empty',
          disabled: this.selected === null,
          'aria-label': `Place in slot ${slot}`,
          'data-testid': `slot-${slot}`,
        });
      }),
      problems.length > 0
        ? h('ul', { class: 'problems', 'data-testid': 'formation-problems' }, problems.map((p) => h('li', {}, p)))
        : h('p', { class: 'ok' }, `Team ready: ${state.formation.length} Champion${state.formation.length === 1 ? '' : 's'}.`),
      button('Start battle', () => this.dispatch({ type: 'startBattle' }), {
        class: 'primary',
        disabled: problems.length > 0,
        'data-testid': 'start-battle',
      }),
    );

    const enemy = h(
      'section',
      { class: 'panel' },
      h('h2', {}, encounter ? `Next: ${encounter.name}` : 'Next encounter'),
      encounter
        ? h(
            'ul',
            { class: 'cards' },
            encounter.monsters.map((m) =>
              h('li', { class: 'card enemy' }, h('h3', {}, m.name), h('p', {}, `${rowName(m.slot)} row, slot ${m.slot}`), this.statLine(m.stats)),
            ),
          )
        : h('p', { class: 'warning' }, 'Encounter data is missing.'),
    );

    return h('div', { class: 'prep' }, enemy, board, bench);
  }

  private championDetails(champion: ChampionFixture): Node {
    return h(
      'div',
      {},
      h('p', { class: 'role' }, `Fixture Champion (${champion.name} Role stats)`),
      this.statLine(champion.stats),
      h('p', { class: 'stats' }, `Basic Attack: ${champion.basicAttack.dice} + Attack, physical. No other abilities in this prototype.`),
    );
  }

  private boardGrid(cell: (slot: number) => Node): Node {
    return h(
      'div',
      { class: 'board' },
      boardRows().map(({ row, slots }) =>
        h('div', { class: 'row' }, h('span', { class: 'row-label' }, `${row[0]!.toUpperCase()}${row.slice(1)}`), slots.map(cell)),
      ),
    );
  }

  private select(instanceId: string): void {
    this.selected = this.selected === instanceId ? null : instanceId;
    this.message = null;
    this.render();
  }

  private placeSelected(slot: number): void {
    if (this.selected === null) return;
    this.dispatch({ type: 'place', instanceId: this.selected, slot });
  }

  // ---- battle --------------------------------------------------------------------------------

  private battleScreen(): Node {
    const record = this.state.battle!;
    const view = buildBattleView(record, this.state.bench, this.content);
    if (!this.playback || this.playback.battleNumber !== record.number) {
      this.playback = { battleNumber: record.number, clockMs: 0, timer: null };
    }
    const playback = this.playback;

    const clock = h('p', { class: 'clock', 'data-testid': 'battle-clock' });
    const teams = h('div', { class: 'teams' });
    const log = h('ol', { class: 'log', 'data-testid': 'battle-log' });
    const resultArea = h('div', { class: 'result-area' });
    const skip = button('Skip to result', () => {
      playback.clockMs = view.endTimeMs;
      update();
    }, { 'data-testid': 'skip-battle' });

    let shownLines = 0;
    let finished = false;
    const update = () => {
      const count = eventCountAt(view, playback.clockMs);
      const snapshot = snapshotAfter(view, count);
      clock.textContent = `Battle time ${(Math.min(playback.clockMs, view.endTimeMs) / 1000).toFixed(2)} s`;
      teams.replaceChildren(this.teamPanel(view, snapshot, 'player'), this.teamPanel(view, snapshot, 'monsters'));
      const visible = view.lines.filter((line) => line.eventIndex < count);
      for (const line of visible.slice(shownLines)) {
        log.append(h('li', { class: `tone-${line.tone}` }, h('span', { class: 't' }, `${(line.t / 1000).toFixed(2)}s`), ' ', line.text));
      }
      if (visible.length > shownLines) log.scrollTop = log.scrollHeight;
      shownLines = visible.length;
      if (!finished && count >= view.events.length) {
        finished = true;
        this.stopPlayback();
        skip.remove();
        resultArea.replaceChildren(this.battleResult(view));
      }
    };

    update();
    if (!finished && playback.timer === null) {
      playback.timer = setInterval(() => {
        playback.clockMs += SIM_MS_PER_TICK;
        update();
      }, TICK_MS);
    }

    const encounter = this.content.encounters[record.encounterIndex];
    return h(
      'div',
      { class: 'battle' },
      h('h2', {}, `${encounter?.name ?? 'Battle'} (battle seed ${record.input.seed})`),
      clock,
      finished ? null : skip,
      teams,
      resultArea,
      h('section', { class: 'panel' }, h('h3', {}, 'Combat log'), log),
    );
  }

  private teamPanel(view: BattleView, snapshot: ReturnType<typeof snapshotAfter>, team: 'player' | 'monsters'): Node {
    return h(
      'section',
      { class: `panel team ${team}`, 'data-testid': `team-${team}` },
      h('h3', {}, team === 'player' ? 'Your team' : 'Monsters'),
      view.units
        .filter((unit) => unit.team === team)
        .map((unit) => {
          const state = snapshot.get(unit.id)!;
          const percent = Math.round((state.health / unit.maxHealth) * 100);
          return h(
            'div',
            { class: `unit${state.defeated ? ' defeated' : ''}`, 'data-testid': `unit-${unit.id}` },
            h('span', { class: 'name' }, `${unit.name} (${rowName(unit.slot)} ${unit.slot})`),
            h('div', { class: 'bar', role: 'presentation' }, h('div', { class: 'fill', style: `width:${percent}%` })),
            h('span', { class: 'hp', 'data-testid': `hp-${unit.id}` }, state.defeated ? 'Defeated' : `${state.health} / ${unit.maxHealth}`),
          );
        }),
    );
  }

  private battleResult(view: BattleView): Node {
    const record = this.state.battle!;
    const draw = record.result.outcome.kind === 'draw' ? record.result.outcome.reason : null;
    const label = view.outcome === 'victory' ? 'Claim your reward' : 'See Expedition summary';
    return h(
      'div',
      { class: `result ${view.outcome}`, role: 'status', 'data-testid': 'battle-result' },
      h('h2', { 'data-testid': 'battle-outcome' }, view.outcome === 'victory' ? 'Victory' : view.outcome === 'defeat' ? 'Defeat' : 'Draw'),
      h('p', {}, outcomeText(view.outcome, draw)),
      view.outcome === 'victory' ? null : h('p', {}, 'A defeat or a draw ends this prototype Expedition (no reward).'),
      button(label, () => this.dispatch({ type: 'finishBattle' }), { class: 'primary', 'data-testid': 'finish-battle' }),
    );
  }

  private stopPlayback(): void {
    if (this.playback?.timer) {
      clearInterval(this.playback.timer);
      this.playback.timer = null;
    }
  }

  // ---- reward and decision -------------------------------------------------------------------

  private rewardScreen(): Node {
    const encounter = currentEncounter(this.state, this.content);
    return h(
      'section',
      { class: 'panel' },
      h('h2', {}, 'Choose one reward'),
      h('p', { class: 'hint' }, 'Gold is tracked but cannot be spent yet in this prototype. New Champions join your bench.'),
      h('ul', { class: 'cards' }, (encounter?.rewards ?? []).map((bundle) => this.bundleCard(bundle))),
    );
  }

  private bundleCard(bundle: RewardBundle): Node {
    const champions = bundle.champions.map((id) => this.content.champions.find((c) => c.id === id));
    return h(
      'li',
      { class: 'card reward', 'data-testid': `reward-${bundle.id}` },
      h('h3', {}, `+${bundle.gold} Gold`),
      champions.length === 0 ? h('p', {}, 'No Champion.') : null,
      champions.map((champion, index) =>
        champion
          ? h('div', {}, h('p', {}, `Champion: ${champion.name}`), this.championDetails(champion))
          : h('p', { class: 'warning' }, `Unknown Champion ${bundle.champions[index]}`),
      ),
      button('Choose this reward', () => this.dispatch({ type: 'chooseReward', bundleId: bundle.id }), {
        class: 'primary',
        'data-testid': `choose-${bundle.id}`,
      }),
    );
  }

  private decisionScreen(): Node {
    const last = this.state.history[this.state.history.length - 1];
    const next = this.content.encounters[this.state.encounterIndex + 1];
    return h(
      'section',
      { class: 'panel' },
      h('h2', {}, 'What next?'),
      last ? h('p', { 'data-testid': 'last-reward' }, `Reward taken: ${this.describeBundle(last.encounterIndex, last.rewardId)}.`) : null,
      h('p', {}, `${next?.name ?? 'The next Monster Round'} has ${next?.monsters.length ?? '?'} monster(s). Your Champions return at full Health.`),
      h(
        'div',
        { class: 'actions' },
        button(`Continue to ${next?.name ?? 'the next Monster Round'}`, () => this.dispatch({ type: 'continue' }), {
          class: 'primary',
          'data-testid': 'continue',
        }),
        button('End Expedition here', () => this.dispatch({ type: 'endExpedition' }), { 'data-testid': 'end-expedition' }),
      ),
    );
  }

  private describeBundle(encounterIndex: number, bundleId: string | null): string {
    const bundle = this.content.encounters[encounterIndex]?.rewards.find((b) => b.id === bundleId);
    if (!bundle) return 'none';
    const names = bundle.champions.map((id) => this.content.champions.find((c) => c.id === id)?.name ?? id);
    return [`+${bundle.gold} Gold`, ...names.map((n) => `Champion: ${n}`)].join(', ');
  }

  // ---- end -----------------------------------------------------------------------------------

  private endScreen(): Node {
    const { state } = this;
    const titles: Record<EndReason, string> = {
      cleared: 'Expedition cleared!',
      retreated: 'Expedition ended',
      defeated: 'Expedition over: defeated',
      draw: 'Expedition over: draw',
    };
    const wins = state.history.filter((entry) => entry.outcome === 'victory').length;
    return h(
      'section',
      { class: 'panel end' },
      h('h2', { 'data-testid': 'end-title' }, titles[state.endReason ?? 'retreated']),
      h('p', { 'data-testid': 'end-summary' }, `Monster Rounds won: ${wins} of ${EXPEDITION_CONFIG.encounterCount}. Gold: ${state.gold}. Champions: ${state.bench.length}.`),
      h(
        'ol',
        { class: 'history' },
        state.history.map((entry) =>
          h('li', {}, `${this.content.encounters[entry.encounterIndex]?.name ?? 'Round'}: ${entry.outcome}`, entry.rewardId ? ` — ${this.describeBundle(entry.encounterIndex, entry.rewardId)}` : ''),
        ),
      ),
      h('p', {}, 'Your bench: ', state.bench.map((b) => this.championName(b)).join(', ')),
      button('Start a new Expedition', () => this.dispatch({ type: 'newExpedition', seed: this.newSeed() }), {
        class: 'primary',
        'data-testid': 'new-expedition',
      }),
    );
  }
}
