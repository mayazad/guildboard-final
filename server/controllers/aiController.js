const axios = require('axios');

/**
 * POST /api/tasks/generate-subquests
 * Body: { title: string }
 * Returns: { subquests: string[] }
 *
 * Uses the fine-tuned Guild Dungeon Master LLaMA model.
 */
const generateSubquests = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    if (!process.env.OLLAMA_API_URL) {
      return res.status(503).json({
        error: 'AI service not configured. Please set OLLAMA_API_URL in your .env file.',
      });
    }

    // Using Axios with a 300,000ms (5 minutes) timeout to handle the HF Space cold start.
    const apiClient = axios.create({
      baseURL: process.env.OLLAMA_API_URL,
      timeout: 300000,
    });

    // We must strictly follow the fine-tuned formatting rules.
    const userPrompt = `Instruction: STRUCTURAL_OUTPUT\nInput: Break down this task into 3-5 actionable sub-tasks. Output a raw JSON array of strings only. Title: "${title.trim()}"`;

    const payload = {
      model: 'officialmayazad/sensei-mayaz-v1',
      stream: false,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    };

    const response = await apiClient.post('/api/chat', payload);

    const rawContent = response.data.message.content;
    let parsed;

    try {
      parsed = JSON.parse(rawContent);
      // Handle if the model wraps the array in an object key
      if (!Array.isArray(parsed)) {
        const firstArray = Object.values(parsed).find((v) => Array.isArray(v));
        if (!firstArray) throw new Error('No array found in response');
        parsed = firstArray;
      }
    } catch {
      // Fallback: try to extract a JSON array from the raw string
      const match = rawContent.match(/\[[\s\S]*\]/);
      if (!match) {
        return res.status(500).json({ error: 'Failed to parse AI response. Try again.' });
      }
      parsed = JSON.parse(match[0]);
    }

    res.json({ subquests: parsed });
  } catch (error) {
    console.error('Error generating subquests:', error?.message || error);
    res.status(500).json({ error: 'AI generation failed. The Dungeon Master might still be waking up. Try again.' });
  }
};

/**
 * POST /api/tasks/suggest-xp
 * Body: { title: string, description: string }
 * Returns: { xp: number }
 */
const suggestXP = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    if (!process.env.OLLAMA_API_URL) {
      return res.status(503).json({ error: 'AI service not configured.' });
    }

    const apiClient = axios.create({
      baseURL: process.env.OLLAMA_API_URL,
      timeout: 300000,
    });

    const userPrompt = `Instruction: QUEST_FORGE\nInput: Analyze this software task and suggest a fair Base XP reward between 50 and 500 based on its technical complexity. Output ONLY a valid JSON object with a single key "xp" mapping to the integer value. Title: "${title}". Description: "${description || 'None'}".`;

    const payload = {
      model: 'officialmayazad/sensei-mayaz-v1',
      stream: false,
      messages: [{ role: 'user', content: userPrompt }]
    };

    const response = await apiClient.post('/api/chat', payload);
    const rawContent = response.data.message.content;
    let parsed;

    try {
      parsed = JSON.parse(rawContent);
      if (typeof parsed.xp !== 'number') throw new Error('No xp value found');
    } catch {
      // Fallback regex
      const match = rawContent.match(/"xp"\s*:\s*(\d+)/);
      if (!match) return res.status(500).json({ error: 'Failed to parse AI response' });
      parsed = { xp: parseInt(match[1], 10) };
    }

    res.json({ xp: parsed.xp });
  } catch (error) {
    console.error('Error suggesting XP:', error?.message || error);
    res.status(500).json({ error: 'Failed to auto-balance XP.' });
  }
};

module.exports = { generateSubquests, suggestXP };
