import { describe, it, expect } from 'vitest';
import { buildMockItems } from '../data/mockData.js';
import { scoreItem, rankItems, activeItems, blockedPeople, tierFor } from '../lib/priority.js';
import { generateRuleSummary } from '../lib/summary.js';
import { searchItems } from '../lib/search.js';

const items = buildMockItems();

describe('priority engine', () => {
  it('every score is explained by reasons that sum to it (before clamping)', () => {
    for (const it of items) {
      const s = scoreItem(it);
      const sum = s.reasons.reduce((a, r) => a + r.pts, 0);
      expect(s.score).toBe(Math.max(0, Math.min(100, sum)));
    }
  });
  it('ranks the live incident decision above FYI messages', () => {
    const r = rankItems(activeItems(items));
    const top = r.slice(0, 3).map((i) => i.id);
    expect(top).toContain('slack-oncall');
    expect(r.findIndex((i) => i.id === 'slack-rc2')).toBeGreaterThan(5);
  });
  it('tiers', () => {
    expect(tierFor(80)).toBe('P0');
    expect(tierFor(55)).toBe('P1');
    expect(tierFor(35)).toBe('P2');
    expect(tierFor(5)).toBe('P3');
  });
  it('excludes done and snoozed from active', () => {
    const a = activeItems(items);
    expect(a.find((i) => i.status === 'done')).toBeUndefined();
    expect(a.find((i) => i.id === 'slack-offsite')).toBeUndefined();
  });
  it('groups blocked people', () => {
    const b = blockedPeople(items).map((x) => x.person).sort();
    expect(b).toEqual(['priya', 'rahul', 'vikram']);
  });
});

describe('summary', () => {
  it('produces all four brief sections with valid ids', () => {
    const s = generateRuleSummary(items);
    const ids = new Set(items.map((i) => i.id));
    expect(s.topWork).toHaveLength(3);
    const attn = new Set(s.attention.map((a) => a.id));
    expect(s.topWork.some((t) => attn.has(t.id))).toBe(false);
    expect(s.attention.length).toBeGreaterThan(0);
    expect(s.blocked.length).toBe(3);
    expect(s.happened.length).toBeGreaterThan(0);
    [...s.topWork, ...s.attention, ...s.blocked].forEach((x) => expect(ids.has(x.id)).toBe(true));
  });
});

describe('search', () => {
  it('supports operators', () => {
    expect(searchItems(items, 'from:github').every((i) => i.source === 'github')).toBe(true);
    expect(searchItems(items, 'is:blocked').every((i) => i.blocked)).toBe(true);
    expect(searchItems(items, '@priya').length).toBeGreaterThan(0);
    expect(searchItems(items, 'refund').length).toBeGreaterThan(0);
    expect(searchItems(items, 'zzzz-nothing')).toHaveLength(0);
  });
});
