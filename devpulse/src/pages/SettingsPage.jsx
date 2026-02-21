import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Github, ArrowLeft, RefreshCw, Unplug, CheckCircle2,
  AlertCircle, Loader2, ExternalLink, KeyRound, GitBranch,
  MessageSquare, Mail, Send, Bell, BellRing, Zap, ShieldCheck, User, CalendarDays,
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

  // Notification state
  const [notifStatus, setNotifStatus] = useState(null);
  const [discordUrl, setDiscordUrl]   = useState('');
  const [gmailUser, setGmailUser]     = useState('');
  const [gmailPass, setGmailPass]     = useState('');
  const [gmailTo, setGmailTo]         = useState('');
  const [gcalSaEmail, setGcalSaEmail]   = useState('');
  const [gcalSaKey, setGcalSaKey]         = useState('');
  const [notifAction, setNotifAction] = useState(null);
  const [notifMsg, setNotifMsg]       = useState(null);
  const [notifErr, setNotifErr]       = useState(null);

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

  const fetchNotifStatus = useCallback(async () => {
    try {
      const s = await api.getNotificationStatus();
      setNotifStatus(s);
    } catch { /* ignore */ }
  }, []);

  /* ── Auto-reconnect from localStorage on mount ───── */
  useEffect(() => {
    const init = async () => {
      // App.jsx already handles auto-reconnect before this mounts,
      // so we just need to fetch the current status.
      await fetchStatus();
      fetchNotifStatus();

      // Pre-fill form fields from localStorage when not yet connected
      const saved = localStorage.getItem('devpulse_github');
      if (saved) {
        try {
          const { token: savedToken, repoUrl: savedUrl, owner, repo } = JSON.parse(saved);
          if (savedUrl || (owner && repo)) {
            setRepoUrl(savedUrl || `${owner}/${repo}`);
          }
          if (savedToken) setToken(savedToken);
        } catch { /* ignore corrupt data */ }
      }
    };
    init();
  }, [fetchStatus, fetchNotifStatus]);

  const connected = status?.connected;
  const discordConnected = notifStatus?.discord?.configured;
  const gmailConnected   = notifStatus?.gmail?.configured;
  const gcalConnected    = notifStatus?.googleCalendar?.configured;

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

      // Persist to localStorage so user stays connected across refreshes
      localStorage.setItem('devpulse_github', JSON.stringify({
        token: token || null,
        owner,
        repo,
        repoUrl: repoUrl.trim(),
      }));

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
      // Clear persisted credentials on explicit sign-out
      localStorage.removeItem('devpulse_github');
      setStatus(null);
      setToken('');
      setRepoUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAction(null);
    }
  };

  /* ── Discord handlers ────────────────────────────── */
  const clearNotifMsg = () => { setNotifMsg(null); setNotifErr(null); };

  const handleDiscordConnect = async (e) => {
    e.preventDefault();
    clearNotifMsg();
    if (!discordUrl.trim()) { setNotifErr('Enter a Discord webhook URL'); return; }
    setNotifAction('discord-connect');
    try {
      await api.configureDiscord(discordUrl.trim());
      setNotifMsg('Discord webhook connected!');
      await fetchNotifStatus();
    } catch (err) { setNotifErr(err.message || 'Failed'); }
    finally { setNotifAction(null); }
  };

  const handleDiscordDisconnect = async () => {
    clearNotifMsg(); setNotifAction('discord-disconnect');
    try { await api.disconnectDiscord(); setDiscordUrl(''); await fetchNotifStatus(); setNotifMsg('Discord disconnected.'); }
    catch (err) { setNotifErr(err.message); }
    finally { setNotifAction(null); }
  };

  const handleDiscordTest = async () => {
    clearNotifMsg(); setNotifAction('discord-test');
    try { await api.testDiscord(); setNotifMsg('Test message sent to Discord!'); }
    catch (err) { setNotifErr(err.message); }
    finally { setNotifAction(null); }
  };

  /* ── Gmail handlers ──────────────────────────────── */
  const handleGmailConnect = async (e) => {
    e.preventDefault();
    clearNotifMsg();
    if (!gmailUser.trim() || !gmailPass.trim() || !gmailTo.trim()) { setNotifErr('Fill all Gmail fields'); return; }
    setNotifAction('gmail-connect');
    try {
      await api.configureGmail(gmailUser.trim(), gmailPass.trim(), gmailTo.trim());
      setNotifMsg('Gmail configured!');
      await fetchNotifStatus();
    } catch (err) { setNotifErr(err.message || 'Failed'); }
    finally { setNotifAction(null); }
  };

  const handleGmailDisconnect = async () => {
    clearNotifMsg(); setNotifAction('gmail-disconnect');
    try { await api.disconnectGmail(); setGmailUser(''); setGmailPass(''); setGmailTo(''); await fetchNotifStatus(); setNotifMsg('Gmail disconnected.'); }
    catch (err) { setNotifErr(err.message); }
    finally { setNotifAction(null); }
  };

  const handleGmailTest = async () => {
    clearNotifMsg(); setNotifAction('gmail-test');
    try { await api.testGmail(); setNotifMsg('Test email sent!'); }
    catch (err) { setNotifErr(err.message); }
    finally { setNotifAction(null); }
  };

  /* ── Google Calendar handlers ───────────────────── */
  const handleGcalConnect = async (e) => {
    e.preventDefault();
    clearNotifMsg();
    if (!gcalSaEmail.trim() || !gcalSaKey.trim()) {
      setNotifErr('Fill both Service Account fields'); return;
    }
    setNotifAction('gcal-connect');
    try {
      await api.configureGoogleCalendar({ serviceAccountEmail: gcalSaEmail.trim(), serviceAccountKey: gcalSaKey.trim() });
      setNotifMsg('Google Calendar configured! Checkpoint events will now be added to Google Calendar.');
      await fetchNotifStatus();
    } catch (err) { setNotifErr(err.message || 'Failed'); }
    finally { setNotifAction(null); }
  };

  const handleGcalDisconnect = async () => {
    clearNotifMsg(); setNotifAction('gcal-disconnect');
    try {
      await api.disconnectGoogleCalendar();
      setGcalSaEmail(''); setGcalSaKey('');
      await fetchNotifStatus();
      setNotifMsg('Google Calendar disconnected.');
    } catch (err) { setNotifErr(err.message); }
    finally { setNotifAction(null); }
  };

  const handleGcalTest = async () => {
    clearNotifMsg(); setNotifAction('gcal-test');
    try { await api.testGoogleCalendar(); setNotifMsg('Test event created in Google Calendar!'); }
    catch (err) { setNotifErr(err.message); }
    finally { setNotifAction(null); }
  };

  /* ── Send alert handlers ─────────────────────────── */
  const handleSendGhosting = async () => {
    clearNotifMsg(); setNotifAction('send-ghosting');
    try { const r = await api.sendGhostingAlerts(); setNotifMsg(`Ghosting alerts sent (${r.sent || 0} alerts).`); }
    catch (err) { setNotifErr(err.message); }
    finally { setNotifAction(null); }
  };
  const handleSendBlockers = async () => {
    clearNotifMsg(); setNotifAction('send-blockers');
    try { const r = await api.sendBlockerAlerts('all'); setNotifMsg(`Blocker alerts sent (${r.sent || 0} alerts).`); }
    catch (err) { setNotifErr(err.message); }
    finally { setNotifAction(null); }
  };
  const handleSendHealth = async () => {
    clearNotifMsg(); setNotifAction('send-health');
    try { await api.sendHealthSummary(); setNotifMsg('Health summary sent!'); }
    catch (err) { setNotifErr(err.message); }
    finally { setNotifAction(null); }
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
                {/* Authenticated User Card */}
                {status.user && (
                  <div className="flex items-center gap-4 bg-secondary/50 border border-border rounded-xl px-4 py-3">
                    {status.user.avatar_url ? (
                      <img src={status.user.avatar_url} alt={status.user.login} className="w-10 h-10 rounded-full border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {status.user.login}
                        {status.user.name && <span className="ml-1.5 text-muted-foreground font-normal">({status.user.name})</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          status.isLead
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                        }`}>
                          <ShieldCheck size={10} />
                          {status.isLead ? 'Lead (Admin)' : `Contributor (${status.permission || 'read'})`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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
                  {result.user && <>Authenticated as <strong>{result.user}</strong> ({result.permission || 'contributor'}). </>}
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

        {/* ── Notification Status Banner ─────────────── */}
        {(notifMsg || notifErr) && (
          <div className={`mt-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${notifErr ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            {notifErr ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
            <span>{notifErr || notifMsg}</span>
          </div>
        )}

        {/* ── Discord Connection Card ────────────────── */}
        <div className="mt-8 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/30">
            <MessageSquare size={20} className="text-indigo-400" />
            <h2 className="text-lg font-semibold flex-1">Discord Webhook</h2>
            {discordConnected && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                <CheckCircle2 size={12} /> Connected
              </span>
            )}
          </div>
          <div className="p-6 space-y-5">
            {!discordConnected ? (
              <form onSubmit={handleDiscordConnect} className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Zap size={14} /> Webhook URL
                  </label>
                  <input
                    type="url"
                    value={discordUrl}
                    onChange={e => setDiscordUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    required
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
                  />
                  <p className="text-xs text-muted-foreground/60">
                    Create in Discord → Server Settings → Integrations → Webhooks → New Webhook → Copy URL
                  </p>
                </div>
                <button type="submit" disabled={!!notifAction} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-wait text-white font-semibold rounded-xl px-4 py-3 transition-colors">
                  {notifAction === 'discord-connect' ? <><Loader2 size={16} className="animate-spin" /> Connecting…</> : <><MessageSquare size={16} /> Connect Discord</>}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">Webhook</p>
                  <p className="text-sm font-medium text-foreground truncate">{notifStatus?.discord?.webhookUrl ? '••••' + notifStatus.discord.webhookUrl.slice(-20) : 'Configured'}</p>
                </div>
                {notifStatus?.discord?.sent > 0 && (
                  <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1">Messages Sent</p>
                    <p className="text-sm font-medium text-foreground">{notifStatus.discord.sent}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={handleDiscordTest} disabled={!!notifAction} className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 border border-border disabled:opacity-50 text-foreground font-medium rounded-xl px-4 py-2.5 transition-colors">
                    {notifAction === 'discord-test' ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Test</>}
                  </button>
                  <button onClick={handleDiscordDisconnect} disabled={!!notifAction} className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium rounded-xl px-4 py-2.5 transition-colors">
                    {notifAction === 'discord-disconnect' ? <Loader2 size={16} className="animate-spin" /> : <><Unplug size={16} /> Disconnect</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Gmail Configuration Card ───────────────── */}
        <div className="mt-6 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/30">
            <Mail size={20} className="text-amber-400" />
            <h2 className="text-lg font-semibold flex-1">Gmail Notifications</h2>
            {gmailConnected && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                <CheckCircle2 size={12} /> Configured
              </span>
            )}
          </div>
          <div className="p-6 space-y-5">
            {!gmailConnected ? (
              <form onSubmit={handleGmailConnect} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Gmail Address</label>
                  <input type="email" value={gmailUser} onChange={e => setGmailUser(e.target.value)} placeholder="you@gmail.com" required className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">App Password</label>
                  <input type="password" value={gmailPass} onChange={e => setGmailPass(e.target.value)} placeholder="16-char app password" required className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all" />
                  <p className="text-xs text-muted-foreground/60">
                    Generate at{' '}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline inline-flex items-center gap-1">myaccount.google.com/apppasswords <ExternalLink size={10} /></a>
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Recipients</label>
                  <input type="text" value={gmailTo} onChange={e => setGmailTo(e.target.value)} placeholder="team@example.com, lead@example.com" required className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all" />
                </div>
                <button type="submit" disabled={!!notifAction} className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-wait text-white font-semibold rounded-xl px-4 py-3 transition-colors">
                  {notifAction === 'gmail-connect' ? <><Loader2 size={16} className="animate-spin" /> Configuring…</> : <><Mail size={16} /> Configure Gmail</>}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1">From</p>
                    <p className="text-sm font-medium text-foreground truncate">{notifStatus?.gmail?.email || '—'}</p>
                  </div>
                  <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1">To</p>
                    <p className="text-sm font-medium text-foreground truncate">{notifStatus?.gmail?.to || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleGmailTest} disabled={!!notifAction} className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 border border-border disabled:opacity-50 text-foreground font-medium rounded-xl px-4 py-2.5 transition-colors">
                    {notifAction === 'gmail-test' ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Test Email</>}
                  </button>
                  <button onClick={handleGmailDisconnect} disabled={!!notifAction} className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium rounded-xl px-4 py-2.5 transition-colors">
                    {notifAction === 'gmail-disconnect' ? <Loader2 size={16} className="animate-spin" /> : <><Unplug size={16} /> Disconnect</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Google Calendar Configuration Card ─────── */}
        <div className="mt-6 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/30">
            <CalendarDays size={20} className="text-green-400" />
            <h2 className="text-lg font-semibold flex-1">Google Calendar</h2>
            {gcalConnected && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                <CheckCircle2 size={12} /> Configured
              </span>
            )}
          </div>
          <div className="p-6 space-y-5">
            <p className="text-sm text-muted-foreground">
              When enabled, checkpoints created by the lead will automatically create a <strong className="text-foreground">Google Calendar event</strong> and invite all collaborators (emails fetched via GitHub API).
            </p>
            {!gcalConnected ? (
              <form onSubmit={handleGcalConnect} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Service Account Email</label>
                  <input type="email" value={gcalSaEmail} onChange={e => setGcalSaEmail(e.target.value)} placeholder="my-service@my-project.iam.gserviceaccount.com" required className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/40 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Service Account Private Key</label>
                  <textarea value={gcalSaKey} onChange={e => setGcalSaKey(e.target.value)} placeholder="-----BEGIN PRIVATE KEY-----\n..." required rows={4} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/40 transition-all font-mono text-xs" />
                  <p className="text-xs text-muted-foreground/60">
                    Create a Service Account at{' '}
                    <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noreferrer" className="text-green-400 hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink size={10} /></a>
                    {' '}&rarr; Create Key (JSON) &rarr; copy <code className="text-green-400">client_email</code> and <code className="text-green-400">private_key</code> from the JSON file.
                    Then share your Google Calendar with the service account email (give &quot;Make changes to events&quot; permission).
                  </p>
                </div>
                <button type="submit" disabled={!!notifAction} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-wait text-white font-semibold rounded-xl px-4 py-3 transition-colors">
                  {notifAction === 'gcal-connect' ? <><Loader2 size={16} className="animate-spin" /> Configuring…</> : <><CalendarDays size={16} /> Configure Google Calendar</>}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">Events Created</p>
                  <p className="text-sm font-medium text-foreground">{notifStatus?.googleCalendar?.eventsCreated || 0}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleGcalTest} disabled={!!notifAction} className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 border border-border disabled:opacity-50 text-foreground font-medium rounded-xl px-4 py-2.5 transition-colors">
                    {notifAction === 'gcal-test' ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Test Event</>}
                  </button>
                  <button onClick={handleGcalDisconnect} disabled={!!notifAction} className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium rounded-xl px-4 py-2.5 transition-colors">
                    {notifAction === 'gcal-disconnect' ? <Loader2 size={16} className="animate-spin" /> : <><Unplug size={16} /> Disconnect</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Send Alerts Card ───────────────────────── */}
        {(discordConnected || gmailConnected) && (
          <div className="mt-6 bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/30">
              <BellRing size={20} className="text-rose-400" />
              <h2 className="text-lg font-semibold flex-1">Send Alerts Now</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-5">
                Manually push alerts to all connected channels ({[discordConnected && 'Discord', gmailConnected && 'Gmail', gcalConnected && 'Google Calendar'].filter(Boolean).join(' + ')}).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={handleSendGhosting} disabled={!!notifAction} className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-50">
                  {notifAction === 'send-ghosting' ? <Loader2 size={16} className="animate-spin" /> : <><Bell size={16} /> Ghosting Alerts</>}
                </button>
                <button onClick={handleSendBlockers} disabled={!!notifAction} className="flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-50">
                  {notifAction === 'send-blockers' ? <Loader2 size={16} className="animate-spin" /> : <><AlertCircle size={16} /> Blocker Alerts</>}
                </button>
                <button onClick={handleSendHealth} disabled={!!notifAction} className="flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-50">
                  {notifAction === 'send-health' ? <Loader2 size={16} className="animate-spin" /> : <><Zap size={16} /> Health Summary</>}
                </button>
              </div>
            </div>
          </div>
        )}

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
