// Search with lightweight operators so managers can ask natural questions:
//   from:jira  is:blocked  is:done  is:snoozed  is:mine  is:unassigned  p0  @priya  "free text"
import { PEOPLE, SOURCES } from '../data/mockData.js';
import { isMine, isSnoozed, scoreItem } from './priority.js';

export function parseQuery(q) {
  const filters = { sources: [], is: [], tiers: [], people: [] };
  const terms = [];
  for (const tok of q.trim().split(/\s+/).filter(Boolean)) {
    const t = tok.toLowerCase();
    if (t.startsWith('from:') && SOURCES[t.slice(5)]) filters.sources.push(t.slice(5));
    else if (t.startsWith('is:')) filters.is.push(t.slice(3));
    else if (/^p[0-3]$/.test(t)) filters.tiers.push(t.toUpperCase());
    else if (t.startsWith('@')) {
      const p = Object.values(PEOPLE).find((x) => x.id === t.slice(1) || x.name.toLowerCase().startsWith(t.slice(1)));
      if (p) filters.people.push(p.id);
      else terms.push(t.slice(1));
    } else terms.push(t);
  }
  return { filters, terms };
}

export function searchItems(items, q, now = Date.now()) {
  const { filters, terms } = parseQuery(q);
  if (!q.trim()) return [];
  const out = [];
  for (const it of items) {
    const s = scoreItem(it, now);
    if (filters.sources.length && !filters.sources.includes(it.source)) continue;
    if (filters.tiers.length && !filters.tiers.includes(s.tier)) continue;
    if (filters.people.length) {
      const involved = [it.author, it.assignee, it.blocked?.person, it.blocked?.waitingOn, ...(it.thread || []).map((m) => m.author)];
      if (!filters.people.some((p) => involved.includes(p))) continue;
    }
    let ok = true;
    for (const f of filters.is) {
      if (f === 'blocked' && !it.blocked) ok = false;
      if (f === 'done' && it.status !== 'done') ok = false;
      if (f === 'open' && it.status === 'done') ok = false;
      if (f === 'snoozed' && !isSnoozed(it, now)) ok = false;
      if (f === 'mine' && !isMine(it)) ok = false;
      if (f === 'unassigned' && it.assignee) ok = false;
    }
    if (!ok) continue;

    const hay = [
      it.title, it.body, it.ref, it.channel, (it.labels || []).join(' '),
      PEOPLE[it.assignee]?.name, PEOPLE[it.author]?.name, it.authorName,
      ...(it.thread || []).map((m) => m.text),
    ].join(' ').toLowerCase();
    let rel = 0;
    for (const t of terms) {
      if (!hay.includes(t)) { ok = false; break; }
      rel += it.title.toLowerCase().includes(t) ? 3 : 1;
    }
    if (!ok) continue;
    out.push({ ...it, ...s, relevance: rel });
  }
  return out.sort((a, b) => b.relevance - a.relevance || b.score - a.score);
}

export function highlight(text, q) {
  const { terms } = parseQuery(q);
  if (!terms.length || !text) return [{ t: text, m: false }];
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  return text.split(re).filter(Boolean).map((t) => ({ t, m: terms.includes(t.toLowerCase()) }));
}
