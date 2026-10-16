# WorkRadar — Demo Video Plan (target 6:00, hard limit 5–7 min)

**Setup before recording**
- `npm run dev` (or open the deployed link) in a clean browser window at 1440×900, zoom 100%.
- Settings → *Reset demo data*, *No failures*. Close other tabs and notifications.
- Have open in other tabs: the PRD PDF, the Design canvas, the AI Workflow PDF, the GitHub repo.
- Record with Loom / OBS, webcam bubble bottom-left, mic check first.

| # | Time | Section | What to show | What to say (key lines) |
|---|------|---------|--------------|--------------------------|
| 1 | 0:00–0:40 | **Hook + problem** | Your face, then quickly flash Slack/Jira/GitHub/Gmail logos or tabs | "Managers start every day in four tools. None of them tells you what matters most or who's blocked. I built WorkRadar to answer four questions in under three minutes: top work, what happened, what needs attention, and who's blocked." |
| 2 | 0:40–1:30 | **Problem understanding (PRD)** | PRD page 1: persona Neha, journey table, pain points | "My primary user is an engineering manager like Neha… the biggest pains are fragmentation, noise, invisible blockers and AI summaries nobody trusts." Point at the North-star metric: *time-to-clarity < 3 min*. |
| 3 | 1:30–2:15 | **Product decisions** | PRD page 2 (scope, must vs nice) + Design canvas overview | Three decisions: (1) **explainable ranking** — every score shows its reasons; (2) **LLM only summarises an already-ranked list** and is validated, so it can't invent priorities; (3) **graceful degradation** when a source fails. Mention what's out of scope (real OAuth, write-back). |
| 4 | 2:15–4:30 | **Live application** | Walk the app | See flow below. |
| 5 | 4:30–5:25 | **AI workflow** | AI Workflow PDF + code (`src/lib/priority.js`, `summary.js`) | Tools used, the key prompts, what AI generated, and **what I changed** — e.g. brief sections duplicated → redefined; "unblocks Priya" was under-ranked → added signal + test. Trade-off table. |
| 6 | 5:25–6:00 | **Future improvements + close** | Slide or PRD nice-to-haves | Real connectors with write-back, feedback loop to tune weights, Slack DM morning digest, natural-language Q&A ("what's at risk for today's release?"), director roll-up. End: "WorkRadar turns 40 scattered signals into 3 clear actions." |

## Live-app flow (2:15 → 4:30)
1. **Dashboard (30s)** — read the AI daily brief headline; point to the four columns. KPI tiles: 3 need attention, 3 teammates blocked.
2. **Detail (30s)** — click *Checkout p95 latency…* → "Why this priority" breakdown (78 = critical + due in 60 min + mentioned + incident), suggested next step, related Jira ticket. Click the related item to show cross-tool linking.
3. **Actions (30s)** — back to Priority Feed: **Assign** PAY-490 to Rahul (note the suggested owner on its detail page), **Snooze** the cost email until tomorrow, **Mark done** the incident decision → toast → **Undo** once to show it's safe. Point out the tab counts changing.
4. **Search (20s)** — press `/`, type `is:blocked`, then `@priya`, then `refund` (highlighted matches).
5. **Error & empty states (20s)** — Settings → *GitHub fails to sync* → dashboard banner + red dot; switch to *All sources fail* → full error with Retry; click Retry. Show a search with no results.
6. **(Optional 10s)** — resize to phone width or show dark mode.

## Recording tips
- Script the first and last 20 seconds word-for-word; bullet the rest.
- Keep the cursor slow; zoom (Cmd +) on the score breakdown.
- One take per section, then stitch — easier than one perfect 6-minute take.
- Export 1080p MP4, or share a Loom / Google Drive link set to "Anyone with the link can view".
