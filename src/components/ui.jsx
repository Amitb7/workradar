import { Hash, Ticket, GitPullRequest, Mail, CircleDot, Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { PEOPLE, SOURCES } from '../data/mockData.js';

const SOURCE_ICON = { slack: Hash, jira: Ticket, github: GitPullRequest, email: Mail };

export function SourceIcon({ source, kind, size = 14 }) {
  const Icon = source === 'github' && kind === 'issue' ? CircleDot : SOURCE_ICON[source] || Inbox;
  return <Icon size={size} aria-hidden />;
}

export function SourceBadge({ source, kind }) {
  return (
    <span className={`src src-${source}`}>
      <SourceIcon source={source} kind={kind} size={12} />
      {SOURCES[source]?.label}
    </span>
  );
}

export function TierBadge({ tier }) {
  const label = { P0: 'P0 · Now', P1: 'P1 · Today', P2: 'P2 · This week', P3: 'P3 · Later' }[tier];
  return <span className={`tier tier-${tier}`} title={label}>{tier}</span>;
}

export function Avatar({ id, name, size = 24 }) {
  const p = PEOPLE[id];
  const initials = p?.initials || (name ? name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?');
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, background: p?.color || 'var(--muted-2)' }}
      title={p?.name || name || 'Unassigned'}
    >
      {initials}
    </span>
  );
}

export function personName(id, fallback = 'Unassigned') {
  return PEOPLE[id]?.name || fallback;
}

export function timeAgo(iso, now = Date.now()) {
  if (!iso) return '';
  const s = (now - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function dueLabel(iso, now = Date.now()) {
  if (!iso) return null;
  const h = (new Date(iso).getTime() - now) / 3600000;
  if (h < 0) return { text: 'Overdue', tone: 'danger' };
  if (h < 1) return { text: `Due in ${Math.max(1, Math.round(h * 60))}m`, tone: 'danger' };
  if (h < 12) return { text: `Due in ${Math.round(h)}h`, tone: 'danger' };
  if (h < 36) return { text: 'Due tomorrow', tone: 'warn' };
  return { text: `Due in ${Math.round(h / 24)}d`, tone: 'muted' };
}

export function EmptyState({ icon: Icon = Inbox, title, body, action }) {
  return (
    <div className="state" role="status">
      <div className="state-icon"><Icon size={28} /></div>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', body, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <div className="state-icon"><AlertTriangle size={28} /></div>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          <RefreshCw size={14} /> Retry sync
        </button>
      )}
    </div>
  );
}

export function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="sk-line" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}
