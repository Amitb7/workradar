import { useMemo } from 'react';
import { ArrowLeft, ExternalLink, Sparkles, Ban, FileQuestion, Lightbulb } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { scoreItem, isSnoozed, activeItems } from '../lib/priority.js';
import { PEOPLE, SOURCES, TEAM, ME } from '../data/mockData.js';
import ItemActions from '../components/ItemActions.jsx';
import { SourceBadge, TierBadge, Avatar, personName, timeAgo, dueLabel, EmptyState } from '../components/ui.jsx';

const first = (id) => PEOPLE[id]?.name.split(' ')[0];

/** Rule-based "next best action" — explainable and deterministic. */
function suggestNext(item, items) {
  if (item.status === 'done') return 'This item is complete. Reopen it if more work is needed.';
  if (item.blocked) {
    const w = item.blocked.waitingOn;
    return w === ME
      ? `${first(item.blocked.person)} is waiting on you — unblock them first.`
      : `Nudge ${first(w)} — ${first(item.blocked.person)} has been blocked for ${Math.round((Date.now() - new Date(item.blocked.since)) / 3600e3)}h.`;
  }
  if (item.unblocks) return `Approve or reply now — ${first(item.unblocks)} is blocked until you do.`;
  if ((item.labels || []).includes('decision-needed')) return 'A decision is needed from you. Reply in the thread with go/no-go.';
  if (item.reviewRequestedFromMe) return 'Your review is requested. Review now or reassign to another reviewer.';
  if (!item.assignee) {
    const load = TEAM.map((id) => ({ id, n: activeItems(items).filter((i) => i.assignee === id).length })).sort((a, b) => a.n - b.n);
    return `Unassigned. Suggested owner: ${PEOPLE[load[0].id].name} (lowest current load, ${load[0].n} open items).`;
  }
  if (item.severity === 'low') return 'Low impact. Consider snoozing until you have a free slot.';
  return `Owned by ${personName(item.assignee)}. Check in if it is still open by the due time.`;
}

export default function Detail({ id }) {
  const { allItems, items, failedSources } = useStore();
  const raw = allItems.find((i) => i.id === id);
  const item = useMemo(() => (raw ? { ...raw, ...scoreItem(raw) } : null), [raw]);

  if (!item) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Item not found"
        body="It may have been deleted in the source tool, or the link is out of date."
        action={<a className="btn btn-primary" href="#/feed">Back to priority feed</a>}
      />
    );
  }

  const due = dueLabel(item.dueAt);
  const related = (item.related || []).map((r) => allItems.find((i) => i.id === r)).filter(Boolean).map((i) => ({ ...i, ...scoreItem(i) }));
  const sourceDown = failedSources.includes(item.source);
  const maxPts = Math.max(...item.reasons.map((r) => Math.abs(r.pts)), 1);

  return (
    <div className="page">
      <button className="btn btn-link back" onClick={() => history.length > 1 ? history.back() : (location.hash = '/feed')}>
        <ArrowLeft size={14} /> Back
      </button>

      {sourceDown && (
        <div className="banner banner-warn">{SOURCES[item.source].label} is not syncing — this item may be out of date.</div>
      )}

      <div className="detail">
        <div className="detail-main">
          <div className="item-meta">
            <SourceBadge source={item.source} kind={item.kind} />
            <span className="ref">{item.ref}</span>
            <TierBadge tier={item.tier} />
            {due && item.status !== 'done' && <span className={`chip chip-${due.tone}`}>{due.text}</span>}
            {item.blocked && item.status !== 'done' && <span className="chip chip-danger"><Ban size={11} /> Blocked</span>}
            {isSnoozed(item) && <span className="chip chip-muted">Snoozed until {new Date(item.snoozedUntil).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
            {item.status === 'done' && <span className="chip chip-success">Done</span>}
          </div>
          <h1 className="detail-title">{item.title}</h1>
          <div className="detail-actions">
            <ItemActions item={item} />
            <a className="btn btn-ghost" href="#" onClick={(e) => e.preventDefault()} title="Mock data — would deep-link to the source tool">
              <ExternalLink size={14} /> Open in {SOURCES[item.source].label}
            </a>
          </div>

          <section className="card pad ai-box">
            <h3 className="card-h"><Lightbulb size={15} /> Suggested next step</h3>
            <p>{suggestNext(item, items)}</p>
          </section>

          <section className="card pad">
            <h3 className="card-h">Description</h3>
            <p className="body">{item.body}</p>
          </section>

          <section className="card pad">
            <h3 className="card-h">Activity</h3>
            {item.thread?.length ? (
              <ol className="timeline">
                {item.thread.map((m, i) => (
                  <li key={i}>
                    <Avatar id={m.author} size={26} />
                    <div>
                      <div className="small"><strong>{personName(m.author, 'Unknown')}</strong> <span className="muted">· {timeAgo(m.at)}</span></div>
                      <p>{m.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted small">No comments yet in {SOURCES[item.source].label}.</p>
            )}
          </section>
        </div>

        <aside className="detail-side stack">
          <section className="card pad">
            <h3 className="card-h"><Sparkles size={15} /> Why this priority</h3>
            <div className="score-big"><span>{item.score}</span><small>/ 100</small><TierBadge tier={item.tier} /></div>
            <ul className="reasons">
              {item.reasons.map((r, i) => (
                <li key={i}>
                  <span className="r-text">{r.text}</span>
                  <span className="r-bar"><span className={r.pts < 0 ? 'neg' : ''} style={{ width: `${(Math.abs(r.pts) / maxPts) * 100}%` }} /></span>
                  <span className="r-pts">{r.pts > 0 ? '+' : ''}{r.pts}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card pad">
            <h3 className="card-h">Details</h3>
            <dl className="props">
              <dt>Assignee</dt>
              <dd className="with-avatar"><Avatar id={item.assignee} size={18} /> {item.assignee ? personName(item.assignee) : <em className="muted">Unassigned</em>}</dd>
              <dt>From</dt>
              <dd>{item.author ? personName(item.author) : item.authorName}</dd>
              <dt>Where</dt>
              <dd>{item.channel}</dd>
              {item.blocked && (<><dt>Blocked</dt><dd>{first(item.blocked.person)} waiting on {item.blocked.waitingOn === ME ? 'you' : first(item.blocked.waitingOn)}</dd></>)}
              <dt>Created</dt>
              <dd>{timeAgo(item.createdAt)}</dd>
              <dt>Updated</dt>
              <dd>{timeAgo(item.updatedAt)}</dd>
              {item.dueAt && (<><dt>Due</dt><dd>{new Date(item.dueAt).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</dd></>)}
              <dt>Labels</dt>
              <dd className="labels">{(item.labels || []).map((l) => <span key={l} className="label">{l}</span>)}</dd>
            </dl>
          </section>

          {related.length > 0 && (
            <section className="card pad">
              <h3 className="card-h">Related across tools</h3>
              <ul className="related">
                {related.map((r) => (
                  <li key={r.id}>
                    <a href={`#/item/${r.id}`}>
                      <TierBadge tier={r.tier} />
                      <span>
                        <span className="small muted">{SOURCES[r.source].label} · {r.ref}</span>
                        <br />
                        {r.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
