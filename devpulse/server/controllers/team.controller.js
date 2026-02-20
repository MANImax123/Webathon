import { TEAM } from '../data/store.js';

export const getTeam = (_req, res) => {
  res.json(TEAM);
};

export const getMember = (req, res) => {
  const member = TEAM.members.find((m) => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
};
