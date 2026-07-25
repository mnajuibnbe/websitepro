const { createClient } = require('@supabase/supabase-js');
const rawUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = rawUrl && !rawUrl.startsWith('http') ? `https://${rawUrl}.supabase.co` : rawUrl;
const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('enrollments').select('*, users(id, full_name, email), courses(id, title)').limit(1);
  console.log("Relational data:", JSON.stringify({data}, null, 2));
}

test();
