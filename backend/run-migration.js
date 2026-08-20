const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ctcjqdujuolxgtoodmfp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Y2pxZHVqdW9seGd0b29kbWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzE2NDI4OSwiZXhwIjoyMTAyNzQwMjg5fQ.NqUqweHRAUS9H0Hx7kNfSc3B1txSwK6s9pHXgQeWwqk';

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationSQL = fs.readFileSync(path.join(__dirname, 'supabase-migration.sql'), 'utf8');

async function runMigration() {
  console.log('Running migration...');
  
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      if (error) {
        // Try direct query as fallback
        const { error: err2 } = await supabase.from('_migration').select().limit(0);
        // If rpc doesn't exist, log the statement for manual execution
        console.log(`\n--- Run this in Supabase SQL Editor:\n${stmt};\n---`);
        failed++;
      } else {
        success++;
      }
    } catch (e) {
      console.log(`Statement needs manual execution: ${stmt.substring(0, 60)}...`);
      failed++;
    }
  }

  console.log(`\nMigration complete: ${success} auto-applied, ${failed} need manual execution`);
  console.log('Open Supabase SQL Editor: https://supabase.com/dashboard/project/ctcjqdujuolxgtoodmfp/sql/new');
  console.log('Paste the contents of supabase-migration.sql and run it.');
}

runMigration();
