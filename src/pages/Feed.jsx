import { useMemo, useState } from 'react';
import { CheckCircle2, Filter, SearchX } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { rankItems, isSnoozed, isMine } from '../lib/priority.js';
import { SOURCES } from '../data/mockData.js';
import ItemCard from '../components/ItemCard.jsx';
import { EmptyState, ErrorState, SourceIcon, Skeleton } from '../components/ui.jsx';

const VIEWS = [
  { id: 'all', label: 'All open' },
  { id: 'mine', label: 'Needs me' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'snoozed', label: 'Snoozed' },
  { id: 'done', label: 'Done' },
];
const TIERS = ['P0', 'P1', 'P2', 'P3'];
const TIER_LABEL = { P0: 'Act now', P1: 'Today', P2: 'This week', P3: 'Later' };

export default function Feed({ route }) {
  const { items, failedSources, actions, sync } = useStore();
  const [view, setView] = useState('all');
  const [srcs, setSrcs] = useState([]);
  const [tier, setTier] = useState(route.params.tier || 'any');

  const ranked = useMemo(() => rankItems(items), [items]);
  const counts = useMemo(() => {
    const c = {};
    for (const v of VIEWS) c[v.id] = ranked.filter((i) => matchView(i, v.id)).length;
    return c;
  }, [ranked]);

  const list = ranked.filter(
    (i) => matchView(i, view) && (srcs.length === 0 || srcs.includes(i.source)) && (tier === 'any' || i.tier === tier)
  );
  const groups = TIERS.map((t) => ({ t, items: list.filter((i) => i.tier === t) })).filter((g) => g.items.length);
  const filtered = srcs.length > 0 || tier !== 'any';

  if (failedSources.length === Object.keys(SOURCES).length) {
    return <ErrorState title="Priority feed unavailable" body="None of your sources synced. Try again in a moment." onRetry={() => actions.settings({ failSource: 'none' })} />;
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Priority feed</h1>
          <p className="muted">Everything across your tools, ranked by urgency, impact and who is waiting.</p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {VIEWS.map((v) => (
          <button key={v.id} role="tab" aria-selected={view === v.id} className={`tab ${view === v.id ? 'is-active' : ''}`} onClick={() => setView(v.id)}>
            {v.label} <span className="tab-count">{counts[v.id]}</span>
          </button>
        ))}
      </div>

      <div className="filters">
        <Filter size={14} className="muted" />
        {Object.values(SOURCES).map((s) => {
          const on = srcs.includes(s.id);
          return (
            <button
              key={s.id}
              className={`fchip ${on ? 'is-on' : ''}`}
              aria-pressed={on}
              disabled={failedSources.includes(s.id)}
              onClick={() => setSrcs((x) => (on ? x.filter((y) => y !== s.id) : [...x, s.id]))}
            >
              <SourceIcon source={s.id} /> {s.label}
            </button>
          );
        })}
        <select value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Priority tier" className="select">
          <option value="any">Any priority</option>
          {TIERS.map((t) => <option key={t} value={t}>{t} · {TIER_LABEL[t]}</option>)}
        </select>
        {filtered && (
          <button className="btn btn-link" onClick={() => { setSrcs([]); setTier('any'); }}>Clear filters</button>
        )}
      </div>

      {sync.status === 'loading' && !sync.at ? (
        <Skeleton lines={8} />
      ) : list.length === 0 ? (
        filtered ? (
          <EmptyState icon={SearchX} title="No items match these filters" body="Try removing a source or priority filter." action={<button className="btn btn-primary" onClick={() => { setSrcs([]); setTier('any'); }}>Clear filters</button>} />
        ) : (
          <EmptyState
            icon={CheckCircle2}
            title={view === 'done' ? 'Nothing completed yet today' : view === 'snoozed' ? 'No snoozed items' : 'Inbox zero — you are all caught up'}
            body={view === 'all' || view === 'mine' ? 'New work from Slack, Jira, GitHub and Email will show up here as it arrives.' : null}
          />
        )
      ) : (
        groups.map((g) => (
          <section key={g.t} className="tier-group">
            <h2 className="tier-h"><span className={`tier tier-${g.t}`}>{g.t}</span> {TIER_LABEL[g.t]} <span className="muted">· {g.items.length}</span></h2>
            <div className="stack">{g.items.map((i) => <ItemCard key={i.id} item={i} />)}</div>
          </section>
        ))
      )}
    </div>
  );
}

function matchView(i, view) {
  const snoozed = isSnoozed(i);
  if (view === 'done') return i.status === 'done';
  if (i.status === 'done') return false;
  if (view === 'snoozed') return snoozed;
  if (snoozed) return false;
  if (view === 'mine') return isMine(i);
  if (view === 'blocked') return !!i.blocked;
  if (view === 'unassigned') return !i.assignee;
  return true;
}
