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

/**
 * Helper: Generate a Smart Review Summary when a task is verified.
 * This is an internal function, not an Express route.
 */
const generateCouncilSummary = async (taskTitle, assigneeRole, reviewComments) => {
  if (!process.env.OLLAMA_API_URL) return null;

  try {
    const apiClient = axios.create({
      baseURL: process.env.OLLAMA_API_URL,
      timeout: 300000,
    });

    const userPrompt = `Instruction: COUNCIL_REVIEW\nInput: Generate a cohesive, RPG-flavored Performance Report summarizing the council's feedback for this completed quest. Keep it under 3 sentences. Assignee Role: "${assigneeRole}". Quest: "${taskTitle}". Feedback: "${reviewComments}".`;

    const payload = {
      model: 'officialmayazad/sensei-mayaz-v1',
      stream: false,
      messages: [{ role: 'user', content: userPrompt }]
    };

    const response = await apiClient.post('/api/chat', payload);
    return response.data.message.content.trim();
  } catch (error) {
    console.error('Error generating council summary:', error?.message || error);
    return null;
  }
};

/**
 * POST /api/tasks/stream-chat
 * Body: { message: string }
 * Stream: SSE
 */
const streamChat = async (req, res) => {
  try {
    const { guild_id } = req.user;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); 

    if (!process.env.OLLAMA_API_URL) {
      res.write(`data: ${JSON.stringify({ content: 'AI Service is asleep.' })}\n\n`);
      return res.end();
    }

    const db = require('../db');
    const pastMessagesRes = await db.query(
      `SELECT m.content, u.name 
       FROM messages m JOIN users u ON m.user_id = u.id 
       WHERE m.guild_id = $1 ORDER BY m.created_at DESC LIMIT 10`,
      [guild_id]
    );
    const pastMessages = pastMessagesRes.rows.reverse().map(m => `${m.name}: ${m.content}`).join('\n');

    const tasksRes = await db.query(
      `SELECT title, status FROM tasks WHERE guild_id = $1 AND status IN ('assigned', 'in_progress', 'in_review', 'pending_council') LIMIT 10`,
      [guild_id]
    );
    const activeTasks = tasksRes.rows.length > 0 
      ? tasksRes.rows.map(t => `- ${t.title} (${t.status})`).join('\n')
      : 'NONE';

    const promptContext = `Instruction: INTERACTIVE_PROMPT\nInput: You are the Guild Dungeon Master. Answer the guild's questions in an RPG persona. \nOutput PLAIN TEXT ONLY. Do NOT use markdown. Keep it conversational and brief.\n\nActive Quests: ${activeTasks}\n\nRecent Chat Log:\n${pastMessages}\n\nIf the guild asks about quests and Active Quests is NONE, tell them the board is empty. Otherwise, answer their question normally.\nProvide the next response.`;

    const payload = {
      model: 'officialmayazad/sensei-mayaz-v1',
      stream: true,
      messages: [{ role: 'user', content: promptContext }]
    };

    const response = await axios({
      method: 'post',
      url: `${process.env.OLLAMA_API_URL}/api/chat`,
      data: payload,
      responseType: 'stream',
      timeout: 300000
    });

    let fullResponse = '';
    let buffer = '';

    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep the incomplete line in the buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            fullResponse += parsed.message.content;
            res.write(`data: ${JSON.stringify({ content: parsed.message.content })}\n\n`);
          }
        } catch (e) {
          // Ignore partial parse errors
        }
      }
    });

    response.data.on('end', async () => {
      // Process any remaining data in the buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.message?.content) {
            fullResponse += parsed.message.content;
            res.write(`data: ${JSON.stringify({ content: parsed.message.content })}\n\n`);
          }
        } catch (e) { /* ignore */ }
      }

      // If the fine-tuned model collapsed and returned nothing, inject a fallback response
      if (!fullResponse.trim()) {
        fullResponse = "The Dungeon Master stares at you in silence. (I only know about quests and tasks right now!)";
        res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
      }

      // Save DM's final message to the database synchronously BEFORE ending the stream
      try {
        let dmId;
        const dmRes = await db.query("SELECT id FROM users WHERE username = 'dungeon_master'");
        if (dmRes.rows.length > 0) {
          dmId = dmRes.rows[0].id;
        } else {
          const insertRes = await db.query(
            "INSERT INTO users (username, password_hash, name, role) VALUES ('dungeon_master', 'system_account', 'Dungeon Master', 'leader') RETURNING id"
          );
          dmId = insertRes.rows[0].id;
        }

        if (dmId) {
          await db.query(
            'INSERT INTO messages (guild_id, user_id, content) VALUES ($1, $2, $3)',
            [guild_id, dmId, fullResponse.substring(0, 1000)]
          );
        }
      } catch (err) {
        console.error('Failed to save DM message:', err);
      }

      res.write('data: [DONE]\n\n');
      res.end(); // Finally close the stream and let Vercel freeze the container
    });

    response.data.on('error', (err) => {
      console.error('Stream stream error:', err);
      res.end();
    });

  } catch (error) {
    console.error('Streaming connection error:', error?.message);
    res.write(`data: ${JSON.stringify({ content: '\n[The Dungeon Master is currently unreachable]' })}\n\n`);
    res.end();
  }
};

module.exports = { generateSubquests, suggestXP, generateCouncilSummary, streamChat };
