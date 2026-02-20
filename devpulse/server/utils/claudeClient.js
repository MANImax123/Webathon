// ────────────────────────────────────────────────────────
// DevPulse AI Client — wraps Gemini for agent features
// Named claudeClient per spec; uses Gemini backend (already configured)
// ────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai';

let model = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('🤖 Agent AI client initialized');
}

/**
 * Send a prompt with a system instruction to the AI model.
 * @param {string} systemPrompt - The system-level instruction
 * @param {string} userPrompt - The user message / context
 * @returns {Promise<string>} - The AI response text
 */
export async function askAI(systemPrompt, userPrompt) {
    if (!model) {
        throw new Error('AI model not configured — set GEMINI_API_KEY in .env');
    }

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
}

/**
 * Classify an inactivity alert response.
 * Returns { classification, explanation }
 */
export async function classifyAlertResponse(context, userMessage) {
    const systemPrompt = `You are DevPulse AI Agent — an intelligent project health monitor.

TASK: Classify the user's response to an inactivity alert into EXACTLY one of these categories:
- RESOLVED — The user confirms the issue is handled or gives a valid reason
- ESCALATE — The situation is critical and needs team lead intervention
- NEEDS_SUPPORT — The inactive member needs help or has blockers
- CONTINUE_MONITORING — Not enough info, keep watching

RULES:
- Only use the provided context (do NOT invent data)
- Return a JSON object with exactly two fields: "classification" and "explanation"
- The explanation should be 1-2 sentences max
- Be decisive — pick ONE classification

RESPONSE FORMAT (strict JSON only, no markdown):
{"classification": "RESOLVED|ESCALATE|NEEDS_SUPPORT|CONTINUE_MONITORING", "explanation": "brief reason"}`;

    const userPrompt = `ALERT CONTEXT:
${JSON.stringify(context, null, 2)}

USER MESSAGE: ${userMessage}`;

    const response = await askAI(systemPrompt, userPrompt);

    // Parse the JSON response
    try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch {
        // Fallback: try to extract classification from text
        const classifications = ['RESOLVED', 'ESCALATE', 'NEEDS_SUPPORT', 'CONTINUE_MONITORING'];
        const found = classifications.find(c => response.toUpperCase().includes(c));
        return {
            classification: found || 'CONTINUE_MONITORING',
            explanation: response.slice(0, 200),
        };
    }
}

/**
 * Answer a work visibility query using structured repo data.
 * @param {object} repoData - Structured repository data
 * @param {string} userQuery - Natural language question
 * @returns {Promise<string>} - AI response
 */
export async function answerWorkQuery(repoData, userQuery) {
    const systemPrompt = `You are DevPulse AI — an intelligent work visibility assistant for software teams.

RULES:
- Use ONLY the provided JSON data to answer
- Do NOT invent or hallucinate any data
- Answer strictly from context
- Be concise but thorough (max ~300 words)
- Use markdown formatting: **bold**, bullet points with - or •
- Use emojis sparingly for visual cues (🔴 🟡 🟢 ⚠️ ✅)
- If the query doesn't match any data, say so honestly
- Reference specific branch names, PR titles, and file paths from the data`;

    const userPrompt = `REPOSITORY DATA:
${JSON.stringify(repoData, null, 2)}

USER QUESTION: ${userQuery}`;

    return askAI(systemPrompt, userPrompt);
}

export default { askAI, classifyAlertResponse, answerWorkQuery };
