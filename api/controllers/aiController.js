const OpenAI = require('openai');

/**
 * POST /api/tasks/generate-subquests
 * Body: { title: string }
 * Returns: { subquests: string[] }
 *
 * IMPORTANT: Set OPENAI_API_KEY in your .env file before using this endpoint.
 * Swap `openai` for `@anthropic-ai/sdk` if you prefer Claude.
 */
const generateSubquests = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'AI service not configured. Please set OPENAI_API_KEY in your .env file.',
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an expert technical project manager for a 3-person software development team.
Your job is to break down a parent task title into 3-5 specific, actionable sub-tasks.

You MUST follow these domain-specific rules absolutely without exception:
- If the task involves computer vision or object detection, strictly focus on YOLO model fine-tuning workflows. Absolutely ignore and exclude any mention of Convolutional Block Attention Modules (CBAM) or any attention mechanisms.
- If the task involves evaluation metrics or model evaluation, explicitly skip mAP 50-95 entirely. ONLY generate tasks related to calculating Precision, Recall, and F1 scores.

Output format: Respond ONLY with a valid JSON array of strings, where each string is one concise, actionable sub-task. No explanation, no markdown, no extra text — just the raw JSON array.

Example output:
["Prepare and annotate the training dataset", "Configure YOLO hyperparameters for fine-tuning", "Run training and monitor loss curves", "Calculate Precision, Recall, and F1 scores on the validation set"]`;

    const userPrompt = `Break down this task into 3-5 actionable sub-tasks:\n\n"${title.trim()}"`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0].message.content;
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
    res.status(500).json({ error: 'AI generation failed. Check your API key and try again.' });
  }
};

module.exports = { generateSubquests };
