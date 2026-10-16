import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, SearchX, History, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { searchItems, highlight } from '../lib/search.js';
import { navigate } from '../lib/router.js';
import { SOURCES } from '../data/mockData.js';
import ItemCard from '../components/ItemCard.jsx';
import { EmptyState, SourceIcon } from '../components/ui.jsx';

const SUGGESTIONS = [
  { q: 'is:blocked', d: 'Who is blocked' },
  { q: 'p0', d: 'Act-now items' },
  { q: 'is:mine', d: 'Waiting on me' },
  { q: 'from:github review', d: 'PRs to review' },
  { q: '@priya', d: 'Everything involving Priya' },
  { q: 'refund', d: 'Keyword search' },
  { q: 'is:unassigned', d: 'Needs an owner' },
  { q: 'is:done', d: 'Completed' },
];

export default function Search({ route }) {
  const { items, recent, actions } = useStore();
  const [q, setQ] = useState(route.params.q || '');
  useEffect(() => setQ(route.params.q || ''), [route.params.q]);

  const results = useMemo(() => searchItems(items, q), [items, q]);
  const counts = Object.keys(SOURCES).map((s) => ({ s, n: results.filter((r) => r.source === s).length }));

  const run = (next) => {
    setQ(next);
    actions.addRecent(next);
    navigate(`/search?q=${encodeURIComponent(next)}`);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Search</h1>
          <p className="muted">One search across Slack, Jira, GitHub and Email. Results are ranked by relevance, then priority.</p>
        </div>
      </div>

      <form className="search-big" onSubmit={(e) => { e.preventDefault(); run(q); }} role="search">
        <SearchIcon size={18} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles, messages, people… e.g. “refund is:open”"
          aria-label="Search query"
        />
        {q && <button type="button" className="btn btn-link" onClick={() => run('')}>Clear</button>}
      </form>

      {!q.trim() ? (
        <div className="search-home">
          <section>
            <h3 className="card-h"><Sparkles size={14} /> Try asking</h3>
            <div className="sugg">
              {SUGGESTIONS.map((s) => (
                <button key={s.q} className="sugg-item" onClick={() => run(s.q)}>
                  <code>{s.q}</code>
                  <span className="muted small">{s.d}</span>
                </button>
              ))}
            </div>
          </section>
          {recent.length > 0 && (
            <section>
              <h3 className="card-h"><History size={14} /> Recent searches</h3>
              <div className="recent">
                {recent.map((r) => <button key={r} className="fchip" onClick={() => run(r)}>{r}</button>)}
              </div>
            </section>
          )}
          <section className="card pad small muted">
            <p><strong>Operators:</strong> <code>from:slack|jira|github|email</code> · <code>is:blocked|mine|unassigned|snoozed|done|open</code> ·{' '}
            <code>p0–p3</code> · <code>@name</code>. Combine freely, e.g. <code>from:jira is:unassigned</code>.</p>
          </section>
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`No results for “${q}”`}
          body="Check spelling, remove an operator, or search a broader term. Disconnected sources are not searched."
          action={<button className="btn btn-primary" onClick={() => run('')}>Clear search</button>}
        />
      ) : (
        <>
          <div className="result-meta">
            <strong>{results.length}</strong> result{results.length > 1 ? 's' : ''}
            {counts.filter((c) => c.n).map((c) => (
              <span key={c.s} className="chip chip-muted"><SourceIcon source={c.s} size={11} /> {SOURCES[c.s].label} {c.n}</span>
            ))}
          </div>
          <div className="stack">
            {results.map((r) => (
              <ItemCard
                key={r.id}
                item={r}
                renderTitle={(t) => highlight(t, q).map((p, i) => (p.m ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
