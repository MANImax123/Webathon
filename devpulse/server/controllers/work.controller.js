import { ACTIVE_WORK, COMMITS } from '../data/store.js';

export const getActiveWork = (_req, res) => {
  res.json(ACTIVE_WORK);
};

export const getCommitsByAuthor = (req, res) => {
  const authorId = req.params.authorId;
  const authorCommits = COMMITS.filter((c) => c.author === authorId);
  res.json(authorCommits);
};

/** Combined payload for Active Work Map panel */
export const getWorkMap = (_req, res) => {
  res.json({
    activeWork: ACTIVE_WORK,
    recentCommits: COMMITS.slice(-10),
  });
};
