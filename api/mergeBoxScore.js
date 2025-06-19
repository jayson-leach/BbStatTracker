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
      // Fetch all rows from the source table (like exportBoxScore)
    const { data: rows, error } = await supabase.from(sourceTable).select('*');
    if (error) throw error;

    // Combine rows by team, name, number
    const combined = {};
    for (const row of rows) {
      const key = `${row.team}||${row.name}||${row.number}`;
      if (!combined[key]) {
        combined[key] = { ...row };
      } else {
        // Sum all integer/stat columns except team, name, number, id
        for (const [col, val] of Object.entries(row)) {
          if (
            !['team', 'name', 'number', 'id'].includes(col) &&
            typeof val === 'number'
          ) {
            combined[key][col] = (combined[key][col] || 0) + val;
          }
        }
      }
    }

    // Standardize to 'name' field
    const combinedRows = Object.values(combined).map(row => ({
      ...row,
      name: row.name,
    }));

    // Insert combined rows into the destination table
    const { error: insertError } = await supabase.from(destTable).insert(combinedRows);
    if (insertError) throw insertError;
} catch (err) {
    console.error('Unexpected error in mergeBoxScore API:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}