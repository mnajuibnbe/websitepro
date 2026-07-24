const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const rawUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = rawUrl && !rawUrl.startsWith('http') 
  ? `https://${rawUrl}.supabase.co` 
  : (rawUrl || 'https://placeholder.supabase.co');
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: c, error: e1 } = await supabase.from('courses').select('*').limit(5);
  console.log('Courses:', JSON.stringify(c, null, 2), e1);
  const { data: en, error: e2 } = await supabase.from('enrollments').select('*').limit(5);
  console.log('Enrollments:', JSON.stringify(en, null, 2), e2);
  const { data: u, error: e3 } = await supabase.from('users').select('*').limit(1);
  console.log('Users:', JSON.stringify(u, null, 2), e3);
  const { data: l, error: e4 } = await supabase.from('lessons').select('*').limit(1);
  console.log('Lessons:', JSON.stringify(l, null, 2), e4);
}

main().catch(console.error);
