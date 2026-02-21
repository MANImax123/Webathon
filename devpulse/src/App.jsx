import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CommitHonestyPage from './pages/CommitHonestyPage';
import SettingsPage from './pages/SettingsPage';
import api from './services/api';
import './index.css';

/**
 * On app boot, block rendering until we've checked localStorage for saved
 * GitHub credentials and re-connected if found.  This ensures dashboard
 * components mount AFTER the server already has synced data, preventing
 * the "blank page" where useApi fetches once and gets empty results.
 */
function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // If server already has an active connection, no work needed
        const s = await api.getGithubStatus();
        if (s?.connected) { setReady(true); return; }
      } catch { /* server not reachable — continue */ }

      // Try to restore from localStorage
      const saved = localStorage.getItem('devpulse_github');
      if (saved) {
        try {
          const { token, owner, repo } = JSON.parse(saved);
          if (owner && repo) {
            await api.connectGithub(token || undefined, owner, repo);
            console.log(`🔄 Auto-reconnected to ${owner}/${repo}`);
          }
        } catch (err) {
          // Only clear localStorage on auth errors — keep it for transient failures
          const msg = err.message || '';
          if (msg.includes('401') || msg.includes('403') ||
              msg.includes('authenticate') || msg.includes('Invalid') ||
              msg.includes('not found')) {
            localStorage.removeItem('devpulse_github');
            console.warn('Auto-reconnect failed, cleared saved credentials:', msg);
          } else {
            console.warn('Auto-reconnect failed (transient, keeping credentials):', msg);
          }
        }
      }

      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/commits" element={<CommitHonestyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
