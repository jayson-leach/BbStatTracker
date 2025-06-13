import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1. Fetch from external API
  const externalRes = await fetch(CACHE_ROSTER_URL);
  const externalJson = await externalRes.json();
  const athletes = externalJson.data || [];

  // 2. Replace all entries in Supabase roster table
  //    (delete all, then insert new)
  //    Map external keys to your schema: Team, Gender, Player Name, Number
  //    Only insert if required fields are present
  const newRoster = athletes
    .filter(a => a.name && a.jerseyNumber && a.currentTeam && a.gender)
    .map(a => ({
      Team: a.currentTeam,
      Gender: a.gender,
      'Player Name': a.name,
      Number: String(a.jerseyNumber)
    }));

  // Delete all existing rows
  await supabase.from('roster').delete().neq('Team', '');

  // Insert new roster
  if (newRoster.length > 0) {
    await supabase.from('roster').insert(newRoster);
  }

  // 3. Fetch and return the updated roster as before
  const { data, error } = await supabase.from('roster').select('*');
  if (error) return res.status(500).json([]);
  res.status(200).json(data);
}