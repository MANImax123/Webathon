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

    // Authenticated user info
    this.user       = null;   // { login, name, avatar_url, ... }
    this.permission = null;   // 'admin' | 'write' | 'read' | 'none'
    this.isLead     = false;  // true if admin (repo owner/org admin)
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
      user:      this.user ? { login: this.user.login, name: this.user.name, avatar: this.user.avatar_url } : null,
      permission: this.permission,
      isLead:    this.isLead,
    };
  }

  configure({ token, owner, repo }) {
    if (token) this.token = token;
    if (owner) this.owner = owner;
    if (repo)  this.repo  = repo;
  }

  disconnect() {
    this.token      = null;
    this.owner      = null;
    this.repo       = null;
    this.syncedAt   = null;
    this.syncing    = false;
    this.user       = null;
    this.permission = null;
    this.isLead     = false;
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

  /* ── Raw fetch without isConfigured check (for /user) ─ */
  async _rawReq(endpoint) {
    const url = `${API}${endpoint}`;
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'DevPulse/1.0',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error(body.message || `GitHub API ${res.status}`), { status: res.status });
    }
    return res.json();
  }

  /* ── Auth & Permission helpers ─────────────────────── */

  /** Get the authenticated user from the token */
  async getAuthenticatedUser() {
    if (!this.token) return null;
    try {
      const user = await this._rawReq('/user');
      this.user = user;
      return user;
    } catch (err) {
      console.error('Failed to get authenticated user:', err.message);
      return null;
    }
  }

  /**
   * Check what permission level the token user has on the repo.
   *
   * GitHub's collaborator/permission endpoint returns "read" for ANY
   * authenticated user on a public repo – that does NOT mean they are
   * an actual collaborator.  So we must:
   *   1. Check the collaborator permission endpoint – trust only
   *      "admin" or "write" (those mean they were explicitly added).
   *   2. If that gives "read" (public default) or errors, check if the
   *      user is the repo owner → admin.
   *   3. Otherwise check the contributors list (people who pushed
   *      commits) — that's real "contributor" status.
   *   4. If none of the above match → "none".
   */
  async getPermissionLevel() {
    if (!this.user?.login || !this.isConfigured) return 'none';

    const login = this.user.login.toLowerCase();

    // ── 1. Collaborator permission endpoint ─────────────
    try {
      const data = await this._req(
        `/repos/${this.owner}/${this.repo}/collaborators/${this.user.login}/permission`
      );
      const perm = data.permission; // 'admin' | 'write' | 'read' | 'none'

      // "admin" or "write" → they are explicitly a collaborator
      if (perm === 'admin' || perm === 'write') {
        this.permission = perm;
        this.isLead     = perm === 'admin';
        return perm;
      }
      // "read" on a public repo means NOTHING — fall through
    } catch {
      // 403/404  → user is not a collaborator, fall through
    }

    // ── 2. Repo owner check ─────────────────────────────
    if (login === this.owner.toLowerCase()) {
      this.permission = 'admin';
      this.isLead     = true;
      return 'admin';
    }

    // ── 3. Contributors list (users who have pushed commits) ──
    try {
      const contributors = await this._req(
        `/repos/${this.owner}/${this.repo}/contributors`, { per_page: 100 }
      );
      const isContrib = (contributors || []).find(
        c => c.login.toLowerCase() === login && c.contributions > 0
      );
      if (isContrib) {
        this.permission = 'contributor';
        this.isLead     = false;
        return 'contributor';
      }
    } catch {
      // ignore – contributors endpoint may fail for empty repos
    }

    // ── 4. Not a collaborator or contributor ────────────
    this.permission = 'none';
    this.isLead     = false;
    return 'none';
  }

  /**
   * Validate that the token holder has real contributor-level access.
   * Blocks users who are merely "read" (public default) or "none".
   */
  async validateContributorAccess() {
    if (!this.token) {
      // No token → reject; a token is required to prove identity
      throw Object.assign(
        new Error('A personal access token is required to connect. Create one at github.com/settings/tokens with "repo" scope.'),
        { status: 401 }
      );
    }

    // 1. Get user identity
    const user = await this.getAuthenticatedUser();
    if (!user) {
      throw Object.assign(new Error('Invalid access token — could not authenticate'), { status: 401 });
    }

    // 2. Check real permission level
    const perm = await this.getPermissionLevel();

    // Only allow admin, write, or verified contributor
    if (perm === 'none') {
      throw Object.assign(
        new Error(
          `User "${user.login}" is not a collaborator or contributor of ${this.owner}/${this.repo}. ` +
          `You must be added as a collaborator (write access) or have at least one commit in the repo.`
        ),
        { status: 403 }
      );
    }

    return {
      allowed: true,
      permission: perm,
      user: { login: user.login, name: user.name, avatar: user.avatar_url },
      isLead: this.isLead,
    };
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
