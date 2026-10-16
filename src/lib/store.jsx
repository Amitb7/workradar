import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { buildMockItems, SOURCES } from '../data/mockData.js';

const StoreCtx = createContext(null);
const KEY = 'workradar.v1';

const safeGet = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};
const safeSet = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable — app still works in-memory */
  }
};

const DEFAULT_SETTINGS = {
  sources: Object.fromEntries(Object.keys(SOURCES).map((s) => [s, true])),
  failSource: 'none', // 'none' | 'github' | ... | 'all'  — simulates connector errors for demo
  apiKey: '',
  model: 'claude-sonnet-4-5',
  useLLM: false,
};

function applyPatches(items, patches) {
  return items.map((i) => (patches[i.id] ? { ...i, ...patches[i.id] } : i));
}

function reducer(state, action) {
  switch (action.type) {
    case 'PATCH': {
      const patches = { ...state.patches, [action.id]: { ...(state.patches[action.id] || {}), ...action.patch } };
      return { ...state, patches };
    }
    case 'RESTORE': {
      const patches = { ...state.patches };
      if (action.prev) patches[action.id] = action.prev;
      else delete patches[action.id];
      return { ...state, patches };
    }
    case 'SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'RESET':
      return { ...state, patches: {}, recent: [] };
    case 'RECENT': {
      const q = action.q.trim();
      if (!q) return state;
      return { ...state, recent: [q, ...state.recent.filter((r) => r !== q)].slice(0, 6) };
    }
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const base = useMemo(() => buildMockItems(), []);
  const saved = useMemo(safeGet, []);
  const [state, dispatch] = useReducer(reducer, {
    patches: saved.patches || {},
    settings: { ...DEFAULT_SETTINGS, ...(saved.settings || {}) },
    recent: saved.recent || [],
  });
  const [toasts, setToasts] = useState([]);
  const [sync, setSync] = useState({ status: 'loading', at: null });
  const toastId = useRef(0);

  useEffect(() => safeSet(state), [state]);

  const refresh = useCallback(() => {
    setSync((s) => ({ ...s, status: 'loading' }));
    setTimeout(() => setSync({ status: 'ok', at: new Date().toISOString() }), 650);
  }, []);
  useEffect(refresh, [refresh]);

  const allItems = useMemo(() => applyPatches(base, state.patches), [base, state.patches]);
  const { failSource, sources } = state.settings;
  const failedSources = failSource === 'all' ? Object.keys(SOURCES) : failSource === 'none' ? [] : [failSource];
  const items = useMemo(
    () => allItems.filter((i) => sources[i.source] && !failedSources.includes(i.source)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allItems, sources, failSource]
  );

  const toast = useCallback((text, undo) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, undo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const mutate = useCallback(
    (id, patch, message) => {
      const prev = state.patches[id];
      dispatch({ type: 'PATCH', id, patch });
      toast(message, () => dispatch({ type: 'RESTORE', id, prev }));
    },
    [state.patches, toast]
  );

  const actions = useMemo(
    () => ({
      assign: (item, personId, name) => mutate(item.id, { assignee: personId }, `Assigned ${item.ref} to ${name}`),
      markDone: (item) =>
        mutate(item.id, { status: 'done', doneAt: new Date().toISOString(), snoozedUntil: null }, `Marked ${item.ref} done`),
      reopen: (item) => mutate(item.id, { status: 'open', doneAt: null }, `Reopened ${item.ref}`),
      snooze: (item, untilIso, label) => mutate(item.id, { snoozedUntil: untilIso }, `Snoozed ${item.ref} until ${label}`),
      unsnooze: (item) => mutate(item.id, { snoozedUntil: null }, `Unsnoozed ${item.ref}`),
      settings: (patch) => dispatch({ type: 'SETTINGS', patch }),
      reset: () => {
        dispatch({ type: 'RESET' });
        toast('Demo data reset');
      },
      addRecent: (q) => dispatch({ type: 'RECENT', q }),
      refresh,
    }),
    [mutate, toast, refresh]
  );

  const value = { items, allItems, settings: state.settings, recent: state.recent, failedSources, sync, actions, toasts, dismissToast };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
