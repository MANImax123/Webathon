import { COMMITS, COMMIT_HONESTY } from '../data/store.js';

export const getCommits = (req, res) => {
  const { author, module: mod } = req.query;
  let result = [...COMMITS];
  if (author) result = result.filter((c) => c.author === author);
  if (mod) result = result.filter((c) => c.module === mod);
  res.json(result);
};

export const getCommitById = (req, res) => {
  const commit = COMMITS.find((c) => c.id === req.params.id);
  if (!commit) return res.status(404).json({ error: 'Commit not found' });
  res.json(commit);
};

export const getHonestyAnalysis = (_req, res) => {
  res.json(COMMIT_HONESTY);
};

/** Combined payload for Commit Honesty page */
export const getCommitHonestyPage = (_req, res) => {
  res.json({
    commits: COMMITS,
    honesty: COMMIT_HONESTY,
  });
};
