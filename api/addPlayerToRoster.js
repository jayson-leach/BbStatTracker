import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  console.log('Received request body:', req.body);
  const { team, gender, player } = req.body;
  if (!team || !gender || !player || !player['Player Name'] || !player.Number) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Prevent duplicate: check if player already exists for this team/gender/number
    const { data: existing, error: selectError } = await supabase
      .from('roster')
      .select('*')
      .eq('Team', team)
      .eq('Gender', gender)
      .eq('Player Name', player['Player Name'])
      .eq('Number', player.Number);

    if (selectError) {
      console.error('Supabase select error:', selectError);
      return res.status(500).json({ message: 'Database error (select)' });
    }

    if (existing && existing.length > 0) {
      return res.status(200).json({ message: 'Player already exists' });
    }

    const { error } = await supabase
      .from('roster')
      .insert([
        {
          Team: team,
          Gender: gender,
          'Player Name': player['Player Name'],
          Number: player.Number
        }
      ]);

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ message: 'Failed to add player', error });
    }

    return res.status(200).json({ message: 'Player added successfully' });
  } catch (err) {
    console.error('Unexpected error in addPlayerToRoster:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}