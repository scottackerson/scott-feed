import { describe, expect, it } from 'vitest';
import { clockUtc, relativeAge } from '../src/lib/time';

const now = Date.parse('2026-11-04T14:41:30Z');

describe('relativeAge', () => {
  it('formats compact ages', () => {
    expect(relativeAge(now - 20_000, now)).toBe('now');
    expect(relativeAge(now - 12 * 60_000, now)).toBe('12m');
    expect(relativeAge(now - 3 * 3_600_000, now)).toBe('3h');
    expect(relativeAge(now - 50 * 3_600_000, now)).toBe('2d');
    expect(relativeAge('not a date', now)).toBe('');
  });
});

describe('clockUtc', () => {
  it('formats a zero-padded UTC clock time', () => {
    expect(clockUtc(now)).toBe('14:41 UTC');
    expect(clockUtc(Date.parse('2026-11-04T03:05:00Z'))).toBe('03:05 UTC');
  });
});
