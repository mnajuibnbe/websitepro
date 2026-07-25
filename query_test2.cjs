const { createClient } = require('@supabase/supabase-js');
const rawUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = rawUrl && !rawUrl.startsWith('http') ? `https://${rawUrl}.supabase.co` : rawUrl;
const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .limit(1);
    
  console.log("Enrollments:", JSON.stringify({ data, error }, null, 2));
}

test();
