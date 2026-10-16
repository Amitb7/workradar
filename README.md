# WorkRadar

**AI-powered work prioritisation dashboard for managers.** WorkRadar pulls work signals from Slack, Jira, GitHub and Email into one explainable, ranked view so a manager can answer four questions in under three minutes:

1. What is my **top work** today?
2. **What happened** today?
3. What **needs immediate attention**?
4. **Who is blocked** — and on whom?

> MVP built on realistic mock data (26 cross-tool items for a 6-person payments team on release day). No backend or credentials required.

## Features

| Area | What it does |
|------|--------------|
| **Dashboard** | AI daily brief (4 sections), KPI tiles, top 5 priorities, blocked teammates, activity by source |
| **AI summary** | Deterministic rules-based brief by default; optional LLM regeneration (Anthropic API key in Settings) with JSON validation and automatic fallback |
| **Priority feed** | Items scored 0–100 and grouped P0–P3; views *All · Needs me · Blocked · Unassigned · Snoozed · Done*; source and tier filters; a "Why" line on every card |
| **Item details** | Score breakdown, suggested next step, activity thread, related items across tools, suggested owner |
| **Search** | Cross-source search with operators: `from:jira`, `is:blocked`, `is:mine`, `is:unassigned`, `is:snoozed`, `is:done`, `p0`–`p3`, `@priya`; highlighted matches; recent searches; `/` shortcut |
| **Actions** | Assign, Mark Done / Reopen, Snooze / Unsnooze — toast with Undo, persisted in the browser |
| **States** | Loading skeletons, empty results, empty filters, partial source failure banner, all-sources failure with retry, item not found |
| **Polish** | Responsive to phone width, automatic dark mode, accessible buttons and labels |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 7 unit tests (priority engine, brief, search)
npm run build      # production build in dist/
```

Deploy: any static host (Vercel: framework "Vite", output `dist`; or drag `dist/` onto Netlify Drop). Routing is hash-based, so deep links work without server config.

**Demo controls** (Sources & Settings): toggle sources, simulate a GitHub or total sync failure, add an optional LLM key, reset demo data.

## How prioritisation works

`src/lib/priority.js` — every point added to a score is paired with a reason, and the reasons always sum to the score (unit-tested):

| Signal | Points |
|--------|--------|
| Severity critical / high / medium / low | 40 / 28 / 15 / 5 |
| Overdue · due ≤ 12 h · ≤ 36 h · ≤ 3 days | 25 · 20 · 10 · 5 |
| Manager mentioned / asked directly · review requested | 10 · 10 |
| Someone is blocked · blocked ≥ 24 h | 15 · 8 |
| Acting on it unblocks a teammate | 15 |
| High priority but unassigned | 10 |
| Customer impact · active incident · security | 10 · 8 · 6 |
| Review waiting on you > 2 days | 8 |
| FYI only | −8 |

Tiers: **P0 ≥ 70** (act now) · **P1 ≥ 50** (today) · **P2 ≥ 30** (this week) · **P3** (later).

The LLM never ranks — it only summarises the already-ranked list, and any item ID it returns that is not in the data is dropped.

## Project structure

```
src/
  data/mockData.js        # People, sources, 26 mock WorkItems (timestamps relative to now)
  lib/priority.js         # Explainable scoring, tiers, blocked-people grouping
  lib/summary.js          # Rules-based brief + optional LLM brief
  lib/search.js           # Query parser with operators + highlighting
  lib/store.jsx           # State, undoable actions, persistence, simulated sync
  lib/router.js           # Tiny hash router
  components/             # Layout, ItemCard, ItemActions (assign/snooze/done), UI states
  pages/                  # Dashboard, Feed, Detail, Search, Settings
  __tests__/core.test.js  # Vitest unit tests
docs/
  WorkRadar_PRD.pdf, WorkRadar_AI_Workflow.pdf, DEMO_SCRIPT.md, SUBMISSION_CHECKLIST.md
  design/                 # High-fidelity screen captures
```

## AI usage

Built with Claude (Cowork) for PRD, code, mock data, tests and docs; Playwright for automated screenshots and visual QA. See `docs/WorkRadar_AI_Workflow.pdf` for prompts, what AI generated, what was changed after review, and trade-offs.

## Roadmap

Real OAuth connectors with write-back · ranking feedback loop to tune weights · Slack DM / email morning digest · natural-language Q&A over the unified data · director multi-team roll-up.
