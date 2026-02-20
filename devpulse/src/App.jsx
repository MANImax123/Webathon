import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CommitHonestyPage from './pages/CommitHonestyPage';
import SettingsPage from './pages/SettingsPage';
import api from './services/api';
import './index.css';

/**
 * On app boot, if the server has no active GitHub connection but we have
 * saved credentials in localStorage, silently re-connect so the user
 * doesn't have to log in again.  Runs once per page load.
 */
function useAutoReconnectGitHub() {
  useEffect(() => {
    (async () => {
      try {
        const s = await api.getGithubStatus();
        if (s?.connected) return; // already connected
      } catch { /* server might not be up yet — continue */ }

      const saved = localStorage.getItem('devpulse_github');
      if (!saved) return;

      try {
        const { token, owner, repo } = JSON.parse(saved);
        if (!owner || !repo) return;
        await api.connectGithub(token || undefined, owner, repo);
        console.log(`🔄 Auto-reconnected to ${owner}/${repo}`);
      } catch (err) {
        // credentials expired or repo deleted — remove stored data
        localStorage.removeItem('devpulse_github');
        console.warn('Auto-reconnect failed, cleared saved credentials:', err.message);
      }
    })();
  }, []);
}

function App() {
  useAutoReconnectGitHub();

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
