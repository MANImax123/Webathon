// ────────────────────────────────────────────────────────
// GitHub REST API Client for DevPulse
// Uses Node 18+ built-in fetch — zero extra dependencies
// ────────────────────────────────────────────────────────

const API = 'https://api.github.com';

class GitHubService {
  constructor() {
    this.token = process.env.GITHUB_TOKEN || null;
    this.owner = process.env.GITHUB_OWNER || null;
    this.repo  = process.env.GITHUB_REPO  || null;
    this.syncedAt = null;
    this.syncing  = false;
    this.rateLimit = { remaining: null, limit: null, reset: null };
  }

  /* ── State helpers ─────────────────────────────────── */
  get isConfigured() { return Boolean(this.owner && this.repo); }

  get status() {
    return {
      connected: this.isConfigured,
      owner:     this.owner,
      repo:      this.repo,
      synced:    !!this.syncedAt,
      syncedAt:  this.syncedAt,
      syncing:   this.syncing,
      rateLimit: this.rateLimit,
    };
  }

  configure({ token, owner, repo }) {
    if (token) this.token = token;
    if (owner) this.owner = owner;
    if (repo)  this.repo  = repo;
  }

  disconnect() {
    this.token    = null;
    this.owner    = null;
    this.repo     = null;
    this.syncedAt = null;
    this.syncing  = false;
  }

  /* ── Internal request helper ───────────────────────── */
  async _req(endpoint, params = {}) {
    if (!this.isConfigured) {
      throw Object.assign(new Error('GitHub not configured — connect a repo first'), { status: 400 });
    }

    const url = new URL(`${API}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v));
    });

    const headers = {
      Accept:                 'application/vnd.github+json',
      'User-Agent':           'DevPulse/1.0',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(url.toString(), { headers });

    // Track rate-limit
    this.rateLimit = {
      remaining: Number(res.headers.get('x-ratelimit-remaining')),
      limit:     Number(res.headers.get('x-ratelimit-limit')),
      reset:     Number(res.headers.get('x-ratelimit-reset')),
    };

    if (res.status === 202) return null;          // stats still computing
    if (res.status === 204) return [];             // no content (empty)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(
        new Error(body.message || `GitHub API ${res.status}`),
        { status: res.status },
      );
    }
    return res.json();
  }

  /* ── Public API methods ────────────────────────────── */
  getRepo()             { return this._req(`/repos/${this.owner}/${this.repo}`); }
  getCommits(page = 1)  { return this._req(`/repos/${this.owner}/${this.repo}/commits`, { page, per_page: 100 }); }
  getCommitDetail(sha)  { return this._req(`/repos/${this.owner}/${this.repo}/commits/${sha}`); }
  getBranches()         { return this._req(`/repos/${this.owner}/${this.repo}/branches`, { per_page: 100 }); }
  getPulls(state='all') { return this._req(`/repos/${this.owner}/${this.repo}/pulls`, { state, per_page: 100 }); }
  getContributors()     { return this._req(`/repos/${this.owner}/${this.repo}/contributors`, { per_page: 100 }); }

  /** Stats endpoint may return 202 while GitHub computes; retries up to 4× */
  async getContributorStats() {
    for (let i = 0; i < 4; i++) {
      const data = await this._req(`/repos/${this.owner}/${this.repo}/stats/contributors`);
      if (data) return data;
      await new Promise(r => setTimeout(r, 2000));
    }
    return [];
  }

  /** Compare two branches — returns null on error (e.g. branch deleted) */
  async compareBranches(base, head) {
    try {
      return await this._req(
        `/repos/${this.owner}/${this.repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
      );
    } catch { return null; }
  }

  /* ── Paginated helpers ─────────────────────────────── */
  async getAllCommits(maxPages = 3) {
    const all = [];
    for (let p = 1; p <= maxPages; p++) {
      const page = await this.getCommits(p);
      if (!page || page.length === 0) break;
      all.push(...page);
      if (page.length < 100) break;
    }
    return all;
  }

  /** Fetch commit details with concurrency limiter */
  async getCommitDetails(shas, concurrency = 5) {
    const results = [];
    for (let i = 0; i < shas.length; i += concurrency) {
      const batch = shas.slice(i, i + concurrency);
      const details = await Promise.all(
        batch.map(sha => this.getCommitDetail(sha).catch(() => null)),
      );
      results.push(...details.filter(Boolean));
    }
    return results;
  }
}

export const github = new GitHubService();
export default github;
