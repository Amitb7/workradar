# WorkRadar — Final Deliverables Checklist

| # | Deliverable | Format | Status | Where |
|---|-------------|--------|--------|-------|
| 1 | Product Requirements Document (≤ 2 pages) | PDF | ✅ Ready | `docs/WorkRadar_PRD.pdf` |
| 2 | UX Design file — Dashboard, Priority Feed, Item Details, Search, Empty/Error (+ mobile, dark, settings) | Claude Design canvas link | ✅ Ready — **share it** (Share menu → anyone with link) | Claude artifact "WorkRadar UX Designs"; PNGs in `docs/design/` |
| 3 | Working MVP source code | GitHub repo or ZIP | ✅ Code ready — push to GitHub | this repo / `WorkRadar_source.zip` |
| 4 | AI Workflow document | PDF | ⚠️ Add your own manual edits in section 4 box, then re-export | `docs/WorkRadar_AI_Workflow.pdf` (source: `docs/ai-workflow.html`) |
| 5 | Demo video (5–7 min) | MP4 or Loom / Drive link | ⏳ Record using `docs/DEMO_SCRIPT.md` | — |
| 6 | (Recommended) Live demo URL | Vercel / Netlify | ⏳ Optional | — |

## Before you submit
- [ ] Push repo to GitHub (public, or add reviewers) — `git init && git add . && git commit -m "WorkRadar MVP" && gh repo create workradar --public --source . --push`
- [ ] Optional deploy: `npx vercel` (framework: Vite, output: `dist`) or drag `dist/` onto Netlify Drop
- [ ] Share the Design canvas (Share menu) and open the link in an incognito window
- [ ] Fill "Manual changes by Amit" in the AI Workflow doc and re-export the PDF
- [ ] Record the demo; set Loom/Drive sharing to "Anyone with the link"
- [ ] Open every link in an incognito window to confirm access
- [ ] Put all links in the submission form / email in this order: PRD, AI Workflow, Design, Code, Video
