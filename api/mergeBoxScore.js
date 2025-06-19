import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Export and combine stats from one table to another.
 * Combines rows by player, team, and number, summing all other integer columns.
 * @param {string} sourceTable - The source table name.
 * @param {string} destTable - The destination table name.
 */
export async function mergeBoxScore(sourceTable, destTable) {
  // 1. Fetch all rows from the source table
  const { data: rows, error } = await supabase.from(sourceTable).select('*');
  if (error) throw error;

  // 2. Combine rows by player, team, number
  const combined = {};
  for (const row of rows) {
    const key = `${row.team}||${row.name}||${row.number}`;
    if (!combined[key]) {
      combined[key] = { ...row };
    } else {
      // Sum all integer columns except team, player, number, id
      for (const [col, val] of Object.entries(row)) {
        if (
          !['id', 'team', 'name', 'number'].includes(col) &&
          typeof val === 'number'
        ) {
          combined[key][col] = (combined[key][col] || 0) + val;
        }
      }
    }
  }

  // 3. Insert combined rows into the destination table
  const combinedRows = Object.values(combined);
  const { error: insertError } = await supabase.from(destTable).insert(combinedRows);
  if (insertError) throw insertError;

  return combinedRows;
}