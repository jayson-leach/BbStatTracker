import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

/**
 * Merges box scores from a source table into a destination table,
 * combining rows by team, name, and number, and summing stat columns.
 * Adds a 'games' column to the merged data, counting the number of rows merged.
 * @param {string} sourceTable - The source table name.
 * @param {string} destTable - The destination table name.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { sourceTable, destTable } = req.body;

  try {
    // 1. Fetch only new rows (e.g., where merged=false or not in destTable)
    const { data: sourceRows, error: sourceTablerror } = await supabase
      .from(sourceTable)
      .select('*')
      .eq('merged', false)
    if (sourceTablerror) throw sourceTablerror;
    if (!sourceRows || sourceRows.length === 0) return res.status(200).json({ message: 'No new rows to merge.' });

    // Combine source rows by team, name, number, and count games
    const idCols = ['team', 'name', 'number', 'id', 'game_id', 'created_at'];
    const combined = {};
    for (const row of sourceRows) {
      const key = `${row.team}||${row.name}||${row.number}`;
      if (!combined[key]) {
        combined[key] = { ...row, games: 1 };
      } else {
        // Sum all stat columns at once
        Object.keys(row).forEach(col => {
          if (!idCols.includes(col) && typeof row[col] === 'number') {
            combined[key][col] = (combined[key][col] || 0) + row[col];
          }
        });
        combined[key].games += 1;
      }
    }

    // 2. For each combined row, upsert into destTable
    for (const row of Object.values(combined)) {
      const name = row.name;
      // Try to find existing entry
      const { data: existing, error: fetchError } = await supabase
        .from(destTable)
        .select('*')
        .eq('team', row.team)
        .eq('name', name)
        .eq('number', row.number);

      const upsertRow = { ...row, name };
      delete upsertRow['game_id'];
      delete upsertRow['merged'];

      if (fetchError) throw fetchError;

      if (existing && existing.length > 0) {
        // Sum stats and games
        const existingRow = existing[0];
        Object.keys(upsertRow).forEach(col => {
          if (
            !['team', 'name', 'number', 'id'].includes(col) &&
            typeof upsertRow[col] === 'number'
          ) {
            upsertRow[col] = (existingRow[col] || 0) + upsertRow[col];
          }
        });
        // Update existing row
        await supabase.from(destTable).update(upsertRow).eq('id', existingRow.id);
      } else {
        // Insert new row
        await supabase.from(destTable).insert([upsertRow]);
      }
    }

    // 3. Mark all merged sourceRows as merged
    const mergedIds = sourceRows.map(r => r.id);
    if (mergedIds.length > 0) {
      await supabase.from(sourceTable).update({ merged: true }).in('id', mergedIds);
    }

    return res.status(200).json({ message: 'Merge complete. Safe to close.' });
  } catch (err) {
    console.error('Unexpected error in mergeBoxScore API:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}