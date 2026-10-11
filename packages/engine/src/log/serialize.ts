import type { BattleEvent } from '../battle/events';

/**
 * Canonical JSON for event logs (M1 plan section 7). The same value always serialises to the same
 * string: object keys are sorted (UTF-16 code-unit order) at every level, arrays keep their order,
 * there is no whitespace, and only plain JSON data is accepted. Numbers must be safe integers, so
 * no floating-point text can enter a log. Anything else throws, rather than being silently dropped
 * or rounded. Pure: no Node or browser APIs.
 */
export function canonicalJson(value: unknown): string {
  return write(value, '$');
}

/** Canonical serialisation of a battle's event log, the input to replay hashing. */
export function serializeEvents(events: readonly BattleEvent[]): string {
  return canonicalJson(events);
}

function write(value: unknown, path: string): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'string':
      return JSON.stringify(value);
    case 'number':
      if (!Number.isSafeInteger(value)) {
        throw new TypeError(`canonical JSON accepts only safe integers; ${path} is ${String(value)}`);
      }
      return Object.is(value, -0) ? '0' : String(value);
    case 'object': {
      if (Array.isArray(value)) {
        return `[${value.map((item, index) => write(item, `${path}[${index}]`)).join(',')}]`;
      }
      const prototype: unknown = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError(`canonical JSON accepts only plain objects; ${path} is not one`);
      }
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record).sort();
      return `{${keys.map((key) => `${JSON.stringify(key)}:${write(record[key], `${path}.${key}`)}`).join(',')}}`;
    }
    default:
      throw new TypeError(`canonical JSON cannot represent ${typeof value} at ${path}`);
  }
}
