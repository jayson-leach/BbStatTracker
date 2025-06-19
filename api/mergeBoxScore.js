import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

/**
 * Merges box scores from a source table into a destination table,
 * combining rows by team, name, and number, and summing stat columns.
 * @param {string} sourceTable - The source table name.
 * @param {string} destTable - The destination table name.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { sourceTable, destTable } = req.body;

  try {
    // Fetch all rows from the source table
    const { data: sourceRows, error: sourceError } = await supabase.from(sourceTable).select('*');
    if (sourceError) throw sourceError;
    if (!sourceRows || sourceRows.length === 0) return true;

    // Combine source rows by team, name, number
    const idCols = ['team', 'name', 'number', 'id', 'game_id', 'created_at'];

    const combined = {};
    for (const row of sourceRows) {
      const key = `${row.team}||${row.name}||${row.number}`;
      if (!combined[key]) {
        combined[key] = { ...row };
      } else {
        // Sum all stat columns at once
        Object.keys(row).forEach(col => {
          if (!idCols.includes(col) && typeof row[col] === 'number') {
            combined[key][col] = (combined[key][col] || 0) + row[col];
          }
        });
      }
    }

    // Prepare combined rows, removing game_id and 'Player Name'
    const combinedRows = Object.values(combined).map(row => {
      const { game_id, ...rest } = row;
      return {
        ...rest,
        name: row.name,
      };
    });

    // Efficiently clear the destination table before inserting
    const { error: deleteError } = await supabase.from(destTable).delete().neq('id', 0);
    if (deleteError) throw deleteError;

    // Batch insert for large datasets (Supabase/PostgREST limit is 1000 rows per insert)
    const batchSize = 1000;
    for (let i = 0; i < combinedRows.length; i += batchSize) {
      const batch = combinedRows.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from(destTable).insert(batch);
      if (insertError) throw insertError;
    }
  } catch (err) {
    console.error('Unexpected error in mergeBoxScore API:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}