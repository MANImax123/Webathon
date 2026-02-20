import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Github, ArrowLeft, RefreshCw, Unplug, CheckCircle2,
  AlertCircle, Loader2, ExternalLink, KeyRound, GitBranch,
} from 'lucide-react';
import api from '../services/api';

export default function SettingsPage() {
  /* ── state ────────────────────────────────────────── */
  const [token, setToken]   = useState('');
  const [repoUrl, setRepoUrl] = useState('');      // owner/repo format
  const [status, setStatus] = useState(null);       // github status object
  const [loading, setLoading] = useState(true);
  const [action, setAction]   = useState(null);     // 'connecting' | 'syncing' | 'disconnecting'
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);

  /* ── fetch current status on mount ────────────────── */
  const fetchStatus = useCallback(async () => {
    try {
      const s = await api.getGithubStatus();
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const connected = status?.connected;

  /* ── connect ──────────────────────────────────────── */
  const handleConnect = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const parts = repoUrl.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').split('/');
    const owner = parts[0];
    const repo  = parts[1];

    if (!owner || !repo) {
      setError('Enter a valid owner/repo or GitHub URL');
      return;
    }

    setAction('connecting');
    try {
      const res = await api.connectGithub(token || undefined, owner, repo);
      setResult(res);
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to connect');
    } finally {
      setAction(null);
    }
  };

  /* ── sync ─────────────────────────────────────────── */
  const handleSync = async () => {
    setAction('syncing');
    setError(null);
    try {
      const res = await api.syncGithub();
      setResult(res);
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setAction(null);
    }
  };

  /* ── disconnect ───────────────────────────────────── */
  const handleDisconnect = async () => {
    setAction('disconnecting');
    setError(null);
    setResult(null);
    try {
      await api.disconnectGithub();
      setStatus(null);
      setToken('');
      setRepoUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAction(null);
    }
  };

  /* ── render ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto py-12 px-6">

        {/* Back link */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-10">Connect a GitHub repository to analyse real project data.</p>

        {/* ── GitHub Connection Card ─────────────────── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/30">
            <Github size={20} className="text-foreground" />
            <h2 className="text-lg font-semibold flex-1">GitHub Connection</h2>
            {connected && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={12} /> Connected
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">

            {/* ── Not connected: show form ───────────── */}
            {!connected && (
              <form onSubmit={handleConnect} className="space-y-5">

                {/* Token */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <KeyRound size={14} /> Personal Access Token
                    <span className="text-xs text-muted-foreground/60">(optional for public repos)</span>
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  />
                  <p className="text-xs text-muted-foreground/60">
                    Create at{' '}
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                      github.com/settings/tokens <ExternalLink size={10} />
                    </a>{' '}
                    with <code className="text-xs bg-secondary px-1 rounded">repo</code> scope.
                  </p>
                </div>

                {/* Repo */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <GitBranch size={14} /> Repository
                  </label>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    placeholder="owner/repo  or  https://github.com/owner/repo"
                    required
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!!action}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait text-white font-semibold rounded-xl px-4 py-3 transition-colors"
                >
                  {action === 'connecting' ? (
                    <><Loader2 size={16} className="animate-spin" /> Connecting &amp; Syncing…</>
                  ) : (
                    <><Github size={16} /> Connect Repository</>
                  )}
                </button>
              </form>
            )}

            {/* ── Connected: show status + actions ───── */}
            {connected && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Repository" value={`${status.owner}/${status.repo}`} />
                  <Stat label="Last Synced" value={status.syncedAt ? new Date(status.syncedAt).toLocaleString() : 'Never'} />
                  <Stat label="Rate Limit" value={status.rateLimit?.remaining != null ? `${status.rateLimit.remaining} / ${status.rateLimit.limit}` : '—'} />
                  <Stat label="Status" value={status.syncing ? 'Syncing…' : 'Ready'} />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSync}
                    disabled={!!action}
                    className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 border border-border disabled:opacity-50 text-foreground font-medium rounded-xl px-4 py-2.5 transition-colors"
                  >
                    {action === 'syncing' ? (
                      <><Loader2 size={16} className="animate-spin" /> Syncing…</>
                    ) : (
                      <><RefreshCw size={16} /> Sync Now</>
                    )}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={!!action}
                    className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium rounded-xl px-4 py-2.5 transition-colors"
                  >
                    {action === 'disconnecting' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <><Unplug size={16} /> Disconnect</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Error / Result ─────────────────────── */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && !error && (
              <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-400">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>
                  Synced <strong>{result.commits}</strong> commits, <strong>{result.members}</strong> members,{' '}
                  <strong>{result.prs}</strong> PRs, <strong>{result.branches}</strong> branches
                  {result.blockers != null && <>, <strong>{result.blockers}</strong> blockers detected</>}.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Help text ──────────────────────────────── */}
        <div className="mt-8 p-5 rounded-xl border border-border bg-secondary/30 space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">How it works</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>DevPulse fetches commits, branches, PRs and contributors from the GitHub API.</li>
            <li>The analytics engine computes health scores, bus factor, blockers, and more.</li>
            <li>Dashboard panels update automatically — no page refresh needed.</li>
            <li>Disconnect anytime to revert to demo data.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Small stat display ──────────────────────────────── */
function Stat({ label, value }) {
  return (
    <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}
