import { describe, expect, it } from 'vitest';
import { sha256Hex, utf8Bytes } from './support/sha256';

// NIST FIPS 180-4 example vectors (SHA-256).
describe('test-only SHA-256', () => {
  it('empty string', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('"abc"', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('448-bit two-block message', () => {
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('one million "a" characters', () => {
    expect(sha256Hex('a'.repeat(1_000_000))).toBe('cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
  });

  it('message lengths around the padding boundary (55, 56, 63, 64 bytes) all hash to 64 hex digits', () => {
    for (const length of [55, 56, 63, 64, 119, 120]) {
      expect(sha256Hex('x'.repeat(length))).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('encodes UTF-8, including multi-byte and surrogate-pair characters', () => {
    expect(Array.from(utf8Bytes('aé€😀'))).toEqual([0x61, 0xc3, 0xa9, 0xe2, 0x82, 0xac, 0xf0, 0x9f, 0x98, 0x80]);
  });
});
