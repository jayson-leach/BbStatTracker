// /api/exportBoxScore.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

    const { rows, eventKey } = req.body;
    const table = eventKey || 'box_scores';

  try {
    if (!Array.isArray(rows)) {
      console.error('Invalid data format:', rows);
      return res.status(400).json({ message: 'Box score must be an array' });
    }

    const { error } = await supabase
      .from(table)
      .insert(rows);

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ message: 'Failed to insert into database' });
    }

    return res.status(200).json({ message: 'Box score exported successfully. Safe to close.' });
  } catch (err) {
    console.error('Unexpected error in exportBoxScore API:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
