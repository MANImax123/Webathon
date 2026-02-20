import { AI_ADVISOR_RESPONSES } from '../data/store.js';

export const askAdvisor = (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  const q = question.toLowerCase().trim();

  // Match against known keys
  let matched = AI_ADVISOR_RESPONSES['default'];
  for (const [key, value] of Object.entries(AI_ADVISOR_RESPONSES)) {
    if (key !== 'default' && q.includes(key)) {
      matched = value;
      break;
    }
  }

  // Simulate slight processing delay for realism
  setTimeout(() => {
    res.json({
      question,
      response: matched.response,
      confidence: matched.confidence,
      timestamp: new Date().toISOString(),
    });
  }, 300);
};

export const getSuggestions = (_req, res) => {
  const suggestions = Object.keys(AI_ADVISOR_RESPONSES).filter((k) => k !== 'default');
  res.json(suggestions);
};
