import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, ListOrdered, Search, Settings, RefreshCw, AlertTriangle, X, Undo2 } from 'lucide-react';
import { navigate } from '../lib/router.js';
import { useStore } from '../lib/store.jsx';
import { activeItems, rankItems } from '../lib/priority.js';
import { SOURCES, PEOPLE, ME } from '../data/mockData.js';
import { Avatar, SourceIcon, timeAgo } from './ui.jsx';

export default function Layout({ route, children }) {
  const { items, failedSources, sync, actions, toasts, dismissToast, settings } = useStore();
  const [q, setQ] = useState(route.name === 'search' ? route.params.q || '' : '');
  const inputRef = useRef(null);
  const p0 = rankItems(activeItems(items)).filter((i) => i.tier === 'P0').length;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (route.name === 'search') setQ(route.params.q || '');
  }, [route]);

  const nav = [
    { name: 'dashboard', to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { name: 'feed', to: '/feed', label: 'Priority Feed', icon: ListOrdered, count: p0 },
    { name: 'search', to: '/search', label: 'Search', icon: Search },
    { name: 'settings', to: '/settings', label: 'Sources & Settings', icon: Settings },
  ];

  const submit = (e) => {
    e.preventDefault();
    actions.addRecent(q);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#/">
          <img src={`${import.meta.env.BASE_URL}radar.svg`} alt="" width="28" height="28" />
          <span>WorkRadar</span>
        </a>
        <nav aria-label="Main">
          {nav.map((n) => (
            <a key={n.name} href={`#${n.to}`} className={`nav ${route.name === n.name ? 'is-active' : ''}`}>
              <n.icon size={16} />
              <span>{n.label}</span>
              {n.count > 0 && <span className="nav-count">{n.count}</span>}
            </a>
          ))}
        </nav>
        <div className="side-section">
          <div className="side-label">Connected sources</div>
          {Object.values(SOURCES).map((s) => {
            const failed = failedSources.includes(s.id);
            const off = !settings.sources[s.id];
            return (
              <div key={s.id} className="side-src">
                <SourceIcon source={s.id} />
                <span>{s.label}</span>
                <span className={`status-dot ${failed ? 'is-err' : off ? 'is-off' : 'is-ok'}`} title={failed ? 'Sync failed' : off ? 'Disconnected' : 'Synced'} />
              </div>
            );
          })}
        </div>
        <div className="side-user">
          <Avatar id={ME} size={30} />
          <div>
            <div className="strong">{PEOPLE[ME].name}</div>
            <div className="muted small">{PEOPLE[ME].role} · Payments</div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <form className="searchbar" onSubmit={submit} role="search">
            <Search size={16} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search across Slack, Jira, GitHub, Email…  (try “is:blocked” or “@priya”)"
              aria-label="Search all work"
            />
            <kbd>/</kbd>
          </form>
          <div className="sync">
            <span className="muted small">
              {sync.status === 'loading' ? 'Syncing…' : `Synced ${timeAgo(sync.at)}`}
            </span>
            <button className="btn btn-ghost" onClick={actions.refresh} aria-label="Refresh">
              <RefreshCw size={14} className={sync.status === 'loading' ? 'spin' : ''} />
            </button>
          </div>
        </header>

        {failedSources.length > 0 && failedSources.length < Object.keys(SOURCES).length && (
          <div className="banner banner-warn" role="alert">
            <AlertTriangle size={16} />
            <span>
              <strong>{failedSources.map((s) => SOURCES[s].label).join(', ')} failed to sync.</strong> Showing data from other
              sources — priorities may be incomplete.
            </span>
            <button className="btn btn-ghost" onClick={() => actions.settings({ failSource: 'none' })}>Retry</button>
          </div>
        )}

        <main className="content">{children}</main>
      </div>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.text}</span>
            {t.undo && (
              <button className="btn btn-link" onClick={() => { t.undo(); dismissToast(t.id); }}>
                <Undo2 size={13} /> Undo
              </button>
            )}
            <button className="icon-btn" onClick={() => dismissToast(t.id)} aria-label="Dismiss"><X size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
