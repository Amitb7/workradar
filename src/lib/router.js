import { useEffect, useState } from 'react';

// Tiny hash router: #/  #/feed  #/item/:id  #/search?q=  #/settings
export function parseHash(hash = window.location.hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs));
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'dashboard', params };
  if (parts[0] === 'feed') return { name: 'feed', params };
  if (parts[0] === 'search') return { name: 'search', params };
  if (parts[0] === 'settings') return { name: 'settings', params };
  if (parts[0] === 'item' && parts[1]) return { name: 'item', id: decodeURIComponent(parts[1]), params };
  return { name: 'notfound', params };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash());
  useEffect(() => {
    const on = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const navigate = (to) => {
  window.location.hash = to;
};
