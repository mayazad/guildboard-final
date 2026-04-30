const pool = require('../db');

/**
 * POST /api/ai/logs/feedback
 * Body: { instruction_type, prompt_input, ai_output, user_corrected_output }
 */
const logAiFeedback = async (req, res) => {
  try {
    const { instruction_type, prompt_input, ai_output, user_corrected_output } = req.body;

    if (!instruction_type || !prompt_input || !ai_output) {
      return res.status(400).json({ error: 'Missing required training log fields' });
    }

    const query = `
      INSERT INTO ai_training_logs (instruction_type, prompt_input, ai_output, user_corrected_output)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const values = [instruction_type, prompt_input, ai_output, user_corrected_output || null];

    const result = await pool.query(query, values);

    res.status(201).json({ success: true, log_id: result.rows[0].id });
  } catch (error) {
    console.error('Error saving AI training log:', error);
    // Don't crash the user experience if logging fails, just return 500 silently
    res.status(500).json({ error: 'Failed to save feedback' });
  }
};

module.exports = { logAiFeedback };
