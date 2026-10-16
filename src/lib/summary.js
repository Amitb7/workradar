// AI daily brief.
// 1) generateRuleSummary: deterministic, offline, always available (default for demo + fallback).
// 2) generateLLMSummary: optional — sends a compact, already-ranked snapshot to an LLM and asks
//    for the same JSON shape. Any failure falls back to the rule-based brief.

import { PEOPLE, SOURCES, ME } from '../data/mockData.js';
import { rankItems, activeItems, blockedPeople, isToday, isMine } from './priority.js';

const first = (id) => PEOPLE[id]?.name.split(' ')[0] ?? 'Unassigned';
const HOUR = 3600 * 1000;

export function generateRuleSummary(items, now = Date.now()) {
  const ranked = rankItems(activeItems(items, now), now);
  // "Needs immediate attention" = P0 (act within hours).
  // "Top work for today" = the most important things *you* own beyond the fires, so the two lists never duplicate.
  const attention = ranked.filter((i) => i.tier === 'P0').slice(0, 4);
  const attnIds = new Set(attention.map((i) => i.id));
  const top = ranked.filter((i) => !attnIds.has(i.id) && isMine(i)).slice(0, 3);
  const blocked = blockedPeople(items, now);

  const doneToday = items.filter((i) => i.status === 'done' && isToday(i.doneAt, now));
  const newToday = items.filter((i) => isToday(i.createdAt, now));
  const bySource = Object.keys(SOURCES)
    .map((s) => ({ s, n: newToday.filter((i) => i.source === s).length }))
    .filter((x) => x.n > 0);

  const happened = [];
  if (bySource.length)
    happened.push(
      `${newToday.length} new items today — ` + bySource.map((x) => `${x.n} from ${SOURCES[x.s].label}`).join(', ') + '.'
    );
  for (const d of doneToday.slice(0, 3)) {
    const verb = d.kind === 'pr' ? 'merged' : 'closed';
    happened.push(`${first(d.assignee)} ${verb} ${d.ref}: ${d.title}.`);
  }
  const incident = ranked.find((i) => (i.labels || []).includes('incident'));
  if (incident) happened.push(`Active incident: ${incident.title} (${incident.ref}).`);

  const p0 = attention.length;
  const headline =
    p0 > 0
      ? `${p0} item${p0 > 1 ? 's' : ''} need${p0 > 1 ? '' : 's'} you now, and ${blocked.length} teammate${blocked.length === 1 ? ' is' : 's are'} blocked. Start with “${attention[0].title}”.`
      : `No fires today. ${ranked.length} open items; focus on “${top[0]?.title ?? 'your backlog'}”.`;

  return {
    generatedBy: 'rules',
    generatedAt: new Date(now).toISOString(),
    headline,
    topWork: top.map((i) => ({ id: i.id, text: `${i.title}`, why: i.reasons[0]?.text })),
    happened,
    attention: attention.map((i) => ({ id: i.id, text: i.title, why: i.reasons.slice(0, 2).map((r) => r.text).join(' · ') })),
    blocked: blocked.map((b) => {
      const main = b.items.find((i) => i.kind === 'ticket' || i.kind === 'issue') || b.items[0];
      return {
        person: b.person,
        id: main.id,
        text: `${first(b.person)} is waiting on ${b.waitingOn === ME ? 'you' : first(b.waitingOn)} for ${fmtSince(b.since, now)} (${main.ref}).`,
      };
    }),
  };
}

export async function generateLLMSummary(items, { apiKey, model }, now = Date.now()) {
  const ranked = rankItems(activeItems(items, now), now).slice(0, 15);
  const snapshot = ranked.map((i) => ({
    id: i.id, source: i.source, ref: i.ref, title: i.title, tier: i.tier, score: i.score,
    assignee: i.assignee ? first(i.assignee) : null, due: i.dueAt,
    blocked: i.blocked ? `${first(i.blocked.person)} waiting on ${first(i.blocked.waitingOn)}` : null,
    why: i.reasons.map((r) => r.text),
  }));
  const done = items.filter((i) => i.status === 'done' && isToday(i.doneAt, now)).map((i) => `${i.ref}: ${i.title}`);

  const prompt = `You are WorkRadar, an assistant for an engineering manager named Neha.
Write her daily brief from the JSON below. Be concrete, cite refs, no fluff, no invented facts.
Return ONLY valid JSON with keys:
headline (1 sentence), topWork [{id,text,why}] (max 3, items Neha owns that are NOT in attention), happened [string] (max 4),
attention [{id,text,why}] (max 4, only truly urgent), blocked [{person,id,text}].
Use only ids that appear in the input.

Now: ${new Date(now).toISOString()}
Ranked open items: ${JSON.stringify(snapshot)}
Completed today: ${JSON.stringify(done)}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 900, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`LLM request failed (${res.status})`);
  const data = await res.json();
  const text = data.content?.map((c) => c.text || '').join('') ?? '';
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  const valid = new Set(items.map((i) => i.id));
  const keep = (arr = []) => arr.filter((x) => !x.id || valid.has(x.id));
  return {
    generatedBy: 'llm',
    generatedAt: new Date(now).toISOString(),
    headline: String(json.headline || ''),
    topWork: keep(json.topWork).slice(0, 3),
    happened: (json.happened || []).slice(0, 4).map(String),
    attention: keep(json.attention).slice(0, 4),
    blocked: keep(json.blocked),
  };
}

function fmtSince(iso, now) {
  const h = (now - new Date(iso).getTime()) / HOUR;
  if (h < 24) return `${Math.max(1, Math.round(h))}h`;
  return `${Math.round(h / 24)} day${Math.round(h / 24) > 1 ? 's' : ''}`;
}
