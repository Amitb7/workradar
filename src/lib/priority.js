// Explainable priority scoring.
// Every point added to a score is paired with a human-readable reason, so the UI
// can always answer "why is this at the top?" — a core trust requirement in the PRD.

import { ME, PEOPLE } from '../data/mockData.js';

const HOUR = 3600 * 1000;

const SEVERITY_POINTS = { critical: 40, high: 28, medium: 15, low: 5 };

export function isSnoozed(item, now = Date.now()) {
  return !!item.snoozedUntil && new Date(item.snoozedUntil).getTime() > now;
}

export function isToday(iso, now = Date.now()) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date(now);
  return d.toDateString() === n.toDateString() || now - d.getTime() < 12 * HOUR;
}

export function scoreItem(item, now = Date.now()) {
  const reasons = [];
  let score = 0;
  const add = (pts, text) => {
    score += pts;
    reasons.push({ pts, text });
  };

  add(SEVERITY_POINTS[item.severity] ?? 10, `${cap(item.severity)} severity`);

  if (item.dueAt) {
    const hrs = (new Date(item.dueAt).getTime() - now) / HOUR;
    if (hrs < 0) add(25, 'Overdue');
    else if (hrs <= 12) add(20, `Due in ${fmtHours(hrs)}`);
    else if (hrs <= 36) add(10, 'Due within 36h');
    else if (hrs <= 72) add(5, 'Due within 3 days');
  }

  if (item.mentionsMe) add(10, 'You were mentioned / asked directly');
  if (item.reviewRequestedFromMe) add(10, 'Your review is requested');

  if (item.blocked) {
    const p = PEOPLE[item.blocked.person]?.name.split(' ')[0] ?? 'Someone';
    add(15, `${p} is blocked`);
    const blockedH = (now - new Date(item.blocked.since).getTime()) / HOUR;
    if (blockedH >= 24) add(8, `Blocked for ${blockedH >= 48 ? Math.round(blockedH / 24) + ' days' : Math.round(blockedH) + 'h'}`);
  }
  if (item.unblocks) {
    const u = PEOPLE[item.unblocks]?.name.split(' ')[0] ?? 'a teammate';
    add(15, `Acting on this unblocks ${u}`);
  }

  if (!item.assignee && ['critical', 'high'].includes(item.severity)) add(10, 'High priority but unassigned');

  const labels = item.labels || [];
  if (labels.includes('customer-impact') || labels.includes('escalation')) add(10, 'Customer impact');
  if (labels.includes('incident')) add(8, 'Active incident');
  if (labels.includes('security')) add(6, 'Security related');
  if (labels.includes('fyi')) add(-8, 'FYI only');

  const ageH = (now - new Date(item.createdAt).getTime()) / HOUR;
  if (item.reviewRequestedFromMe && ageH > 48) add(8, `Waiting on you for ${Math.round(ageH / 24)} days`);

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, tier: tierFor(score), reasons: reasons.filter((r) => r.pts !== 0) };
}

export function tierFor(score) {
  if (score >= 70) return 'P0';
  if (score >= 50) return 'P1';
  if (score >= 30) return 'P2';
  return 'P3';
}

export function rankItems(items, now = Date.now()) {
  return items
    .map((it) => ({ ...it, ...scoreItem(it, now) }))
    .sort((a, b) => b.score - a.score || new Date(b.updatedAt) - new Date(a.updatedAt));
}

/** Active = not done and not currently snoozed. */
export function activeItems(items, now = Date.now()) {
  return items.filter((i) => i.status !== 'done' && !isSnoozed(i, now));
}

/** People who are blocked, grouped, with what they wait on. */
export function blockedPeople(items, now = Date.now()) {
  const map = new Map();
  for (const it of activeItems(items, now)) {
    if (!it.blocked) continue;
    const key = it.blocked.person;
    const prev = map.get(key);
    const since = it.blocked.since;
    if (!prev) map.set(key, { person: key, waitingOn: it.blocked.waitingOn, since, items: [it] });
    else {
      prev.items.push(it);
      if (new Date(since) < new Date(prev.since)) prev.since = since;
    }
  }
  return [...map.values()].sort((a, b) => new Date(a.since) - new Date(b.since));
}

export function isMine(item) {
  return item.assignee === ME || item.mentionsMe || item.reviewRequestedFromMe;
}

function cap(s = '') {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtHours(h) {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  return `${Math.round(h)}h`;
}
