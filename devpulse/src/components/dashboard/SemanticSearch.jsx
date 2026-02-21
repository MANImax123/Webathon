import { useState, useEffect, useRef } from 'react';
import {
    Search, X, SlidersHorizontal, Clock, Sparkles,
    GitBranch, GitCommit, GitPullRequest, Bug, Users,
    Target, ExternalLink, ChevronDown, Zap, AlertCircle
} from 'lucide-react';
import api from '../../services/api';

/* ── Icon + Label helpers ─────────────────────────────── */

const typeConfig = {
    answer: { icon: Sparkles, label: 'AI Answer', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    github_repo: { icon: GitBranch, label: 'Repository', bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
    github_issue: { icon: Bug, label: 'Issue', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    github_pr: { icon: GitPullRequest, label: 'Pull Request', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    pull_request: { icon: GitPullRequest, label: 'Pull Request', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    commit: { icon: GitCommit, label: 'Commit', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
    member: { icon: Users, label: 'Team Member', bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400' },
    file: { icon: Search, label: 'Source File', bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400' },
    blocker: { icon: AlertCircle, label: 'Blocker', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
    ghosting_alert: { icon: AlertCircle, label: 'Ghosting Alert', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
    active_work: { icon: Zap, label: 'Active Work', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
    integration_risk: { icon: AlertCircle, label: 'Integration Risk', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
    checkpoint: { icon: Target, label: 'Checkpoint', bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-400' },
    branch: { icon: GitBranch, label: 'Branch', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    default: { icon: Search, label: 'Result', bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400' },
};

function getConfig(type) {
    return typeConfig[type] || typeConfig.default;
}

function highlightMatch(text, query) {
    if (!query || !text) return text;
    try {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(${escaped})`, 'gi');
        return text.replace(re, '<mark class="bg-blue-500/30 text-blue-200 px-0.5 rounded">$1</mark>');
    } catch { return text; }
}

/* ── Main component ───────────────────────────────────── */

export default function SemanticSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ type: 'all', limit: 15 });
    const [sources, setSources] = useState(null);
    const [searchTime, setSearchTime] = useState(null);
    const inputRef = useRef(null);

    // Load suggestions & history on mount
    useEffect(() => {
        api.getSearchSuggestions()
            .then(d => setSuggestions(d.suggestions || []))
            .catch(() => { });

        try {
            const h = localStorage.getItem('devpulse_search_history');
            if (h) setSearchHistory(JSON.parse(h));
        } catch { }
    }, []);

    const saveHistory = (q) => {
        if (!q.trim()) return;
        const h = [q, ...searchHistory.filter(x => x !== q)].slice(0, 10);
        setSearchHistory(h);
        localStorage.setItem('devpulse_search_history', JSON.stringify(h));
    };

    const performSearch = async (searchQuery = query, overrideFilters) => {
        if (!searchQuery.trim()) { setResults([]); return; }
        setLoading(true);
        setError('');
        const activeFilters = overrideFilters || filters;
        const t0 = performance.now();
        try {
            const data = await api.semanticSearch(searchQuery, activeFilters);
            console.log('[SemanticSearch] API response:', { total: data.total, resultsCount: data.results?.length, query: searchQuery, filters: activeFilters });
            setResults(data.results || []);
            setSources(data.sources || null);
            setSearchTime(((performance.now() - t0) / 1000).toFixed(2));
            saveHistory(searchQuery);
        } catch (err) {
            setError(err.message || 'Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => { e.preventDefault(); performSearch(); };

    const handleFilterChange = (key, val) => {
        const nf = { ...filters, [key]: val };
        setFilters(nf);
        if (query.trim()) performSearch(query, nf);
    };

    const handleClear = () => { setQuery(''); setResults([]); setError(''); setSources(null); setSearchTime(null); inputRef.current?.focus(); };

    const formatScore = (s) => Math.round(Math.min(s, 1) * 100);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* ── Header ────────────────────────────────────── */}
            <div className="text-center mb-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                    <Sparkles size={14} className="text-blue-400" />
                    <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">AI-Powered</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground mb-2 flex items-center justify-center gap-2">
                    <Search size={24} className="text-blue-400" />
                    Semantic Search
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                    Search across your entire workspace — GitHub issues, commits, PRs, team members, checkpoints, and more. Ask natural language questions for instant answers.
                </p>
            </div>

            {/* ── Search Form ───────────────────────────────── */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {loading
                                ? <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                : <Search size={20} className="text-muted-foreground" />}
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask anything… e.g. &quot;how many open issues?&quot; or &quot;latest commits&quot;"
                            className="w-full pl-12 pr-12 py-3.5 bg-card/60 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all text-base"
                            disabled={loading}
                        />
                        {query && (
                            <button type="button" onClick={handleClear} className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all ${showFilters ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'text-muted-foreground hover:text-foreground bg-card/40 hover:bg-card/60 border border-white/5'}`}
                        >
                            <SlidersHorizontal size={14} />
                            Filters
                            <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Searching…</>
                            ) : (
                                <><Zap size={14} /> Search</>
                            )}
                        </button>
                    </div>
                </form>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 animate-slide-up">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Content Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                className="w-full bg-card/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 [&>option]:bg-gray-900 [&>option]:text-white"
                            >
                                <option value="all" className="bg-gray-900 text-white">All Content</option>
                                <option value="files" className="bg-gray-900 text-white">Source Files</option>
                                <option value="commits" className="bg-gray-900 text-white">Commits</option>
                                <option value="prs" className="bg-gray-900 text-white">Pull Requests</option>
                                <option value="members" className="bg-gray-900 text-white">Team Members</option>
                                <option value="blockers" className="bg-gray-900 text-white">Blockers & Alerts</option>
                                <option value="risks" className="bg-gray-900 text-white">Integration Risks</option>
                                <option value="work" className="bg-gray-900 text-white">Active Work</option>
                                <option value="checkpoints" className="bg-gray-900 text-white">Checkpoints</option>
                                <option value="branches" className="bg-gray-900 text-white">Branches</option>
                                <option value="github" className="bg-gray-900 text-white">GitHub (Issues, PRs, Repo)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Results Limit</label>
                            <select
                                value={filters.limit}
                                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                                className="w-full bg-card/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 [&>option]:bg-gray-900 [&>option]:text-white"
                            >
                                <option value={5} className="bg-gray-900 text-white">5 results</option>
                                <option value={10} className="bg-gray-900 text-white">10 results</option>
                                <option value={15} className="bg-gray-900 text-white">15 results</option>
                                <option value={25} className="bg-gray-900 text-white">25 results</option>
                                <option value={50} className="bg-gray-900 text-white">50 results</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Suggestions & History ─────────────────────── */}
            {!query && !results.length && (
                <div className="space-y-4">
                    {searchHistory.length > 0 && (
                        <div className="glass-card rounded-2xl p-5 border border-white/5">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                <Clock size={14} /> Recent Searches
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {searchHistory.map((h, i) => (
                                    <button key={i} onClick={() => { setQuery(h); performSearch(h); }}
                                        className="text-sm bg-card/60 hover:bg-card border border-white/5 hover:border-blue-500/20 text-foreground/70 hover:text-foreground px-3 py-1.5 rounded-lg transition-all"
                                    >{h}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="glass-card rounded-2xl p-5 border border-white/5">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <Sparkles size={14} className="text-blue-400" /> Try asking…
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => { setQuery(s); performSearch(s); }}
                                    className="text-left text-sm bg-card/40 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/20 text-foreground/60 hover:text-blue-300 px-3 py-2 rounded-lg transition-all group"
                                >
                                    <span className="text-blue-400/50 group-hover:text-blue-400 transition-colors mr-1">→</span> {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Error ─────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                    <span className="text-sm text-red-300">{error}</span>
                </div>
            )}

            {/* ── Results Header ────────────────────────────── */}
            {results.length > 0 && (
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">
                        Search Results <span className="text-muted-foreground font-normal text-sm">({results.length})</span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {searchTime && <span>Found in {searchTime}s</span>}
                        {sources && (
                            <div className="flex items-center gap-2">
                                {sources.github > 0 && <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300">GitHub: {sources.github}</span>}
                                {sources.commits > 0 && <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">Commits: {sources.commits}</span>}
                                {sources.members > 0 && <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-300">Members: {sources.members}</span>}
                                {sources.checkpoints > 0 && <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">Checkpoints: {sources.checkpoints}</span>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Result Cards ──────────────────────────────── */}
            <div className="space-y-3">
                {results.map((result, idx) => {
                    const cfg = getConfig(result.type);
                    const Icon = cfg.icon;
                    const isAnswer = result.type === 'answer';

                    return (
                        <div
                            key={idx}
                            className={`glass-card rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg group ${isAnswer
                                ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 hover:shadow-blue-500/10'
                                : 'border-white/5 hover:border-white/10 hover:shadow-white/5'
                                }`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    {/* Icon badge */}
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                                        <Icon size={18} className={cfg.text} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        {/* Title */}
                                        <h4 className={`font-semibold text-base mb-1 ${isAnswer ? 'text-blue-300' : 'text-foreground'}`}>
                                            <span dangerouslySetInnerHTML={{ __html: highlightMatch(result.title, query) }} />
                                        </h4>

                                        {/* Type badge + score */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                                {cfg.label}
                                            </span>
                                            {result.relevanceScore && result.type !== 'answer' && (
                                                <>
                                                    <span className="text-muted-foreground text-xs">•</span>
                                                    <span className="text-xs font-medium text-emerald-400">
                                                        {formatScore(result.relevanceScore)}% match
                                                    </span>
                                                </>
                                            )}
                                            {result.metadata?.state && (
                                                <>
                                                    <span className="text-muted-foreground text-xs">•</span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${result.metadata.state === 'open' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                                        {result.metadata.state}
                                                    </span>
                                                </>
                                            )}
                                            {result.metadata?.isOverdue && (
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
                                                    Overdue
                                                </span>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {result.description && (
                                            <p className={`text-sm leading-relaxed line-clamp-3 ${isAnswer ? 'text-blue-200/80' : 'text-muted-foreground'}`}>
                                                <span dangerouslySetInnerHTML={{ __html: highlightMatch(result.description, query) }} />
                                            </p>
                                        )}

                                        {/* Related items for answers */}
                                        {isAnswer && result.metadata?.relatedResults && result.metadata.relatedResults.length > 0 && (
                                            <div className="mt-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                                                <h5 className="text-xs font-semibold text-blue-300/70 mb-2 uppercase tracking-wider">Related Items</h5>
                                                <div className="space-y-1">
                                                    {result.metadata.relatedResults.slice(0, 3).map((item, i) => {
                                                        const ic = getConfig(item.type);
                                                        return (
                                                            <div key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                                <span className={ic.text}>{ic.label}:</span> {item.title}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Metadata tags */}
                                        {result.metadata && result.type !== 'answer' && (
                                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                {result.metadata.author && (
                                                    <span className="text-xs bg-card/60 border border-white/5 px-2 py-0.5 rounded-md text-muted-foreground">
                                                        By: {result.metadata.author}
                                                    </span>
                                                )}
                                                {result.metadata.module && (
                                                    <span className="text-xs bg-card/60 border border-white/5 px-2 py-0.5 rounded-md text-muted-foreground">
                                                        {result.metadata.module}
                                                    </span>
                                                )}
                                                {result.metadata.priority && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-md border ${result.metadata.priority === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-300' : result.metadata.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-gray-500/10 border-gray-500/20 text-gray-300'}`}>
                                                        {result.metadata.priority}
                                                    </span>
                                                )}
                                                {result.metadata.labels?.slice(0, 3).map((label, i) => (
                                                    <span key={i} className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md">{label}</span>
                                                ))}
                                                {result.metadata.sha && (
                                                    <span className="text-xs font-mono bg-card/60 border border-white/5 px-2 py-0.5 rounded-md text-muted-foreground">{result.metadata.sha}</span>
                                                )}
                                                {result.metadata.role && (
                                                    <span className="text-xs bg-pink-500/10 border border-pink-500/20 text-pink-300 px-2 py-0.5 rounded-md">{result.metadata.role}</span>
                                                )}
                                                {(result.metadata.date || result.metadata.createdAt) && (
                                                    <span className="text-xs bg-card/60 border border-white/5 px-2 py-0.5 rounded-md text-muted-foreground">
                                                        {new Date(result.metadata.date || result.metadata.createdAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* External link */}
                                {result.url && (
                                    <a href={result.url} target="_blank" rel="noopener noreferrer"
                                        className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/15 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all opacity-60 group-hover:opacity-100"
                                    >
                                        Open <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── No results ────────────────────────────────── */}
            {!loading && query && results.length === 0 && !error && (
                <div className="glass-card rounded-2xl p-10 border border-white/5 text-center">
                    <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                    <p className="text-sm text-muted-foreground mb-4">Try adjusting your search terms or filters.</p>
                    <ul className="text-xs text-muted-foreground/70 space-y-1 max-w-sm mx-auto text-left">
                        <li>• Use different keywords or synonyms</li>
                        <li>• Try broader search terms</li>
                        <li>• Use natural language — e.g. "how many open issues?"</li>
                        <li>• Check the content type filter</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
