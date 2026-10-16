import { Compass } from 'lucide-react';
import { useRoute } from './lib/router.js';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Feed from './pages/Feed.jsx';
import Detail from './pages/Detail.jsx';
import Search from './pages/Search.jsx';
import Settings from './pages/Settings.jsx';
import { EmptyState } from './components/ui.jsx';

export default function App() {
  const route = useRoute();
  let page;
  switch (route.name) {
    case 'dashboard': page = <Dashboard />; break;
    case 'feed': page = <Feed key={route.params.tier || 'feed'} route={route} />; break;
    case 'item': page = <Detail id={route.id} />; break;
    case 'search': page = <Search route={route} />; break;
    case 'settings': page = <Settings />; break;
    default:
      page = <EmptyState icon={Compass} title="Page not found" body="That page does not exist." action={<a className="btn btn-primary" href="#/">Go to dashboard</a>} />;
  }
  return <Layout route={route}>{page}</Layout>;
}
