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

    // Fetch all rows from the destination table
    const { data: destRows, error: destError } = await supabase.from(destTable).select('*');
    if (destError) throw destError;

    // Combine source rows by team, name, number
    const combined = {};
    for (const row of sourceRows) {
      const key = `${row.team}||${row.name}||${row.number}`;
      if (!combined[key]) {
        combined[key] = { ...row };
      } else {
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

    // For each combined entry, check if it exists in destTable and update or insert
    for (const row of Object.values(combined)) {
      const name = row.name;
      const { data: existing, error: fetchError } = await supabase
        .from(destTable)
        .select('*')
        .eq('team', row.team)
        .eq('name', name)
        .eq('number', row.number);

      // Prepare the upsert row
      const upsertRow = {
        ...row,
        name,
      };

      if (fetchError) throw fetchError;

      if (existing && existing.length > 0) {
        // Update: sum all stat columns
        const existingRow = existing[0];
        const updatedRow = { ...existingRow };
        for (const [col, val] of Object.entries(upsertRow)) {
          if (
            !['team', 'name', 'number', 'id'].includes(col) &&
            typeof val === 'number'
          ) {
            updatedRow[col] = (existingRow[col] || 0) + val;
          }
        }
        // Update the row in destTable
        const { error: updateError } = await supabase
          .from(destTable)
          .update(updatedRow)
          .eq('id', existingRow.id);
        if (updateError) throw updateError;
      } else {
        // Insert new row
        const { error: insertError } = await supabase.from(destTable).insert([upsertRow]);
        if (insertError) throw insertError;
      }
    }
} catch (err) {
    console.error('Unexpected error in mergeBoxScore API:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}