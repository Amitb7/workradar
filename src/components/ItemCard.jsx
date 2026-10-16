import { Ban, Clock } from 'lucide-react';
import { navigate } from '../lib/router.js';
import { isSnoozed } from '../lib/priority.js';
import { SourceBadge, TierBadge, Avatar, personName, timeAgo, dueLabel } from './ui.jsx';
import ItemActions from './ItemActions.jsx';

export default function ItemCard({ item, renderTitle, showReason = true, compact = false }) {
  const due = dueLabel(item.dueAt);
  const open = () => navigate(`/item/${item.id}`);
  const snoozed = isSnoozed(item);
  return (
    <article
      className={`card item ${item.status === 'done' ? 'is-done' : ''} ${snoozed ? 'is-snoozed' : ''}`}
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && open()}
      aria-label={`${item.tier} ${item.title}`}
    >
      <div className="item-rail">
        <TierBadge tier={item.tier} />
        <span className="score" title="Priority score (0–100)">{item.score}</span>
      </div>
      <div className="item-main">
        <div className="item-meta">
          <SourceBadge source={item.source} kind={item.kind} />
          <span className="ref">{item.ref}</span>
          <span className="dot">·</span>
          <span className="muted">{timeAgo(item.updatedAt)}</span>
          {due && item.status !== 'done' && <span className={`chip chip-${due.tone}`}>{due.text}</span>}
          {item.blocked && item.status !== 'done' && (
            <span className="chip chip-danger"><Ban size={11} /> Blocked</span>
          )}
          {snoozed && (
            <span className="chip chip-muted"><Clock size={11} /> Snoozed</span>
          )}
          {item.status === 'done' && <span className="chip chip-success">Done</span>}
        </div>
        <h4 className="item-title">{renderTitle ? renderTitle(item.title) : item.title}</h4>
        {showReason && !compact && item.reasons?.length > 0 && (
          <p className="why">
            <span className="why-label">Why:</span> {item.reasons.slice(0, 3).map((r) => r.text).join(' · ')}
          </p>
        )}
        <div className="item-foot">
          <span className="assignee">
            <Avatar id={item.assignee} size={20} />
            {item.assignee ? personName(item.assignee) : <em className="muted">Unassigned</em>}
          </span>
          <ItemActions item={item} compact />
        </div>
      </div>
    </article>
  );
}
