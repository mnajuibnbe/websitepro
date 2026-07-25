const { createClient } = require('@supabase/supabase-js');
const rawUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = rawUrl && !rawUrl.startsWith('http') ? `https://${rawUrl}.supabase.co` : rawUrl;
const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.rpc('get_schema');
  console.log("Schema rpc:", error);
  // Just insert one and see columns
  const res = await supabase.from('enrollments').insert({}).select();
  console.log("Insert result:", JSON.stringify(res, null, 2));
}

test();
