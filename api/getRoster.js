export default async function handler(req, res) {
  // 1. Fetch from external API
  const externalRes = await fetch(process.env.CACHE_ROSTER_URL);
  const externalJson = await externalRes.json();
  const athletes = externalJson.data || [];

  // 2. Map external data to your expected roster format
  const roster = athletes
    .filter(a => a.name && a.jerseyNumber && a.currentTeam && a.gender)
    .map(a => ({
      Team: a.currentTeam,
      Gender: a.gender === 'Male' ? 'Boys' : a.gender === 'Female' ? 'Girls' : a.gender,
      'Player Name': a.name,
      Number: a.jerseyNumber
    }));

  // 3. Return the roster data
  res.status(200).json(roster);
}