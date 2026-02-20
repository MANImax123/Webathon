import { useState } from 'react';
import { GitCommit, AlertTriangle, CheckCircle, Search, ChevronDown, ChevronRight, ArrowLeft, Shield } from 'lucide-react';
import { COMMITS, COMMIT_HONESTY, TEAM } from '../data/demoData';
import useApi from '../hooks/useApi';
import api from '../services/api';
import Sidebar from '../components/shared/Sidebar';
import Navbar from '../components/shared/Navbar';

const getMember = (id) => TEAM.members.find((m) => m.id === id);
const getHonesty = (commitId) => COMMIT_HONESTY.find((h) => h.commitId === commitId);

function MatchBar({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold min-w-[36px] text-right" style={{ color }}>{score}%</span>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  if (verdict === 'honest') {
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold">
        <CheckCircle size={10} />
        Honest
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
      <AlertTriangle size={10} />
      Misleading
    </span>
  );
}

export default function CommitHonestyPage() {
  const { data: pageData } = useApi(api.getCommitHonestyPage, { commits: COMMITS, honesty: COMMIT_HONESTY });
  const { data: teamData } = useApi(api.getTeam, TEAM);
  const commits = pageData.commits || COMMITS;
  const honestyData = pageData.honesty || COMMIT_HONESTY;

  const getMemberLocal = (id) => teamData.members.find((m) => m.id === id);
  const getHonestyLocal = (commitId) => honestyData.find((h) => h.commitId === commitId);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedCommit, setExpandedCommit] = useState(null);

  const commitsWithHonesty = commits.map((c) => ({
    ...c,
    honesty: getHonestyLocal(c.id),
  }));

  const filtered = commitsWithHonesty.filter((c) => {
    if (filter === 'misleading') return c.honesty?.verdict === 'misleading';
    if (filter === 'honest') return c.honesty?.verdict === 'honest';
    if (filter === 'analyzed') return !!c.honesty;
    return true;
  }).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.message.toLowerCase().includes(q) || getMemberLocal(c.author)?.name.toLowerCase().includes(q);
  });

  const misleadingCount = honestyData.filter((h) => h.verdict === 'misleading').length;
  const honestCount = honestyData.filter((h) => h.verdict === 'honest').length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 grid-background pointer-events-none" />
      <Sidebar activeSection="commits" onSectionChange={() => {}} />
      <Navbar activeSection="commits" />

      <div className="ml-64 pt-16 p-8 relative z-10">
        {/* Back link */}
        <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Dashboard
        </a>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Commit Honesty Checker</h1>
            <p className="text-sm text-muted-foreground">AI-powered analysis of commit messages vs. actual code changes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-sm font-bold text-red-400">{misleadingCount} Misleading</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-sm font-bold text-green-400">{honestCount} Honest</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commits..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500/30 transition-colors"
            />
          </div>
          {['all', 'analyzed', 'misleading', 'honest'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-card text-muted-foreground border border-border hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Commit List */}
        <div className="space-y-3">
          {filtered.map((commit) => {
            const member = getMemberLocal(commit.author);
            const isExpanded = expandedCommit === commit.id;
            const hasAnalysis = !!commit.honesty;

            return (
              <div key={commit.id} className="rounded-2xl bg-card border border-border overflow-hidden transition-all">
                {/* Commit Row */}
                <div
                  className={`flex items-center gap-4 p-5 cursor-pointer hover:bg-secondary/40 transition-colors ${hasAnalysis ? '' : 'opacity-60'}`}
                  onClick={() => hasAnalysis && setExpandedCommit(isExpanded ? null : commit.id)}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {commit.honesty?.verdict === 'misleading' ? (
                      <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle size={16} className="text-red-400" />
                      </div>
                    ) : commit.honesty?.verdict === 'honest' ? (
                      <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <CheckCircle size={16} className="text-green-400" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                        <GitCommit size={16} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Message + Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground truncate">{commit.message}</span>
                      {hasAnalysis && <VerdictBadge verdict={commit.honesty.verdict} />}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: member?.color + '20', color: member?.color }}>
                          {member?.avatar}
                        </div>
                        {member?.name}
                      </span>
                      <span>{new Date(commit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="text-green-400">+{commit.additions}</span>
                      <span className="text-red-400">-{commit.deletions}</span>
                      <span className="text-muted-foreground/60">{commit.files.length} file{commit.files.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Match score */}
                  {hasAnalysis && (
                    <div className="flex-shrink-0 w-28">
                      <MatchBar score={commit.honesty.matchScore} />
                    </div>
                  )}

                  {/* Expand chevron */}
                  {hasAnalysis && (
                    <div className="flex-shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  )}
                </div>

                {/* Expanded Analysis */}
                {isExpanded && commit.honesty && (
                  <div className="border-t border-border bg-secondary/30 p-6 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* What the commit says */}
                      <div className="rounded-xl bg-card border border-border p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <GitCommit size={13} className="text-blue-400" />
                          <span className="text-sm font-bold text-blue-400">Commit Message Says</span>
                        </div>
                        <p className="text-sm text-foreground font-mono bg-secondary/50 rounded-lg p-3">&quot;{commit.message}&quot;</p>
                      </div>

                      {/* What actually changed */}
                      <div className="rounded-xl bg-card border border-border p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield size={13} className="text-amber-400" />
                          <span className="text-sm font-bold text-amber-400">Actual Changes</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{commit.honesty.actualChanges}</p>
                      </div>
                    </div>

                    {/* Match Score */}
                    <div className="mt-4 rounded-xl bg-card border border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-foreground">Honesty Match Score</span>
                        <span className="text-sm font-bold" style={{ color: commit.honesty.matchScore >= 80 ? '#10b981' : commit.honesty.matchScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                          {commit.honesty.matchScore}%
                        </span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${commit.honesty.matchScore}%`,
                            backgroundColor: commit.honesty.matchScore >= 80 ? '#10b981' : commit.honesty.matchScore >= 40 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>

                    {/* Suggestion */}
                    {commit.honesty.suggestion && (
                      <div className="mt-4 rounded-xl bg-blue-500/5 border border-blue-500/15 p-4">
                        <p className="text-sm text-blue-400 font-medium mb-1">Suggested commit message:</p>
                        <p className="text-sm text-foreground font-mono">&quot;{commit.honesty.suggestion}&quot;</p>
                      </div>
                    )}

                    {/* Files changed */}
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground font-medium mb-2">Files changed:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {commit.files.map((f) => (
                          <span key={f} className="text-sm px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground font-mono">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-2xl bg-card border border-border border-dashed p-12 text-center">
              <GitCommit size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No commits match your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
