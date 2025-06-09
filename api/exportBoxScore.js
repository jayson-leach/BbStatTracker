// /api/exportBoxScore.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  const boxScoreData = req.body;

  try {
    const { error } = await supabase
      .from('box_scores')
      .insert(boxScoreData); // expects array of row objects

    if (error) throw error;

    return res.status(200).json({ message: 'Box score exported successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to export box score' });
  }
}
