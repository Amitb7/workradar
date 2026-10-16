import { useEffect, useRef, useState } from 'react';
import { Check, Clock, UserPlus, RotateCcw, BellRing } from 'lucide-react';
import { PEOPLE, TEAM, ME } from '../data/mockData.js';
import { useStore } from '../lib/store.jsx';
import { isSnoozed } from '../lib/priority.js';
import { Avatar } from './ui.jsx';

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return { open, setOpen, ref };
}

function snoozeOptions() {
  const now = new Date();
  const inHours = (h) => new Date(now.getTime() + h * 3600e3);
  const tomorrow9 = new Date(now);
  tomorrow9.setDate(now.getDate() + 1);
  tomorrow9.setHours(9, 0, 0, 0);
  const nextMon = new Date(now);
  nextMon.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  nextMon.setHours(9, 0, 0, 0);
  return [
    { label: '1 hour', at: inHours(1) },
    { label: '3 hours', at: inHours(3) },
    { label: 'Tomorrow 9:00', at: tomorrow9 },
    { label: 'Next Monday 9:00', at: nextMon },
  ];
}

export default function ItemActions({ item, compact = false }) {
  const { actions } = useStore();
  const assign = usePopover();
  const snooze = usePopover();
  const stop = (e) => e.stopPropagation();
  const done = item.status === 'done';
  const snoozed = isSnoozed(item);

  return (
    <div className={`actions ${compact ? 'actions-compact' : ''}`} onClick={stop}>
      <div className="pop-wrap" ref={assign.ref}>
        <button
          className="btn btn-ghost"
          aria-haspopup="menu"
          aria-expanded={assign.open}
          onClick={() => assign.setOpen((o) => !o)}
          disabled={done}
          title="Assign"
        >
          <UserPlus size={14} /> {!compact && 'Assign'}
        </button>
        {assign.open && (
          <div className="popover" role="menu">
            <div className="pop-title">Assign to</div>
            {[ME, ...TEAM].map((id) => (
              <button
                key={id}
                role="menuitem"
                className={`pop-item ${item.assignee === id ? 'is-current' : ''}`}
                onClick={() => {
                  actions.assign(item, id, id === ME ? 'you' : PEOPLE[id].name.split(' ')[0]);
                  assign.setOpen(false);
                }}
              >
                <Avatar id={id} size={20} />
                <span>{id === ME ? 'Me' : PEOPLE[id].name}</span>
                <small>{PEOPLE[id].role}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pop-wrap" ref={snooze.ref}>
        {snoozed ? (
          <button className="btn btn-ghost" onClick={() => actions.unsnooze(item)} title="Unsnooze">
            <BellRing size={14} /> {!compact && 'Unsnooze'}
          </button>
        ) : (
          <button
            className="btn btn-ghost"
            aria-haspopup="menu"
            aria-expanded={snooze.open}
            onClick={() => snooze.setOpen((o) => !o)}
            disabled={done}
            title="Snooze"
          >
            <Clock size={14} /> {!compact && 'Snooze'}
          </button>
        )}
        {snooze.open && (
          <div className="popover" role="menu">
            <div className="pop-title">Snooze until</div>
            {snoozeOptions().map((o) => (
              <button
                key={o.label}
                role="menuitem"
                className="pop-item"
                onClick={() => {
                  actions.snooze(item, o.at.toISOString(), o.label);
                  snooze.setOpen(false);
                }}
              >
                <Clock size={14} />
                <span>{o.label}</span>
                <small>{o.at.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      {done ? (
        <button className="btn btn-ghost" onClick={() => actions.reopen(item)} title="Reopen">
          <RotateCcw size={14} /> {!compact && 'Reopen'}
        </button>
      ) : (
        <button className="btn btn-success" onClick={() => actions.markDone(item)} title="Mark done">
          <Check size={14} /> {!compact && 'Done'}
        </button>
      )}
    </div>
  );
}
