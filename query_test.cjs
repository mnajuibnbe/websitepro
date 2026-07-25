const { createClient } = require('@supabase/supabase-js');
const rawUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = rawUrl && !rawUrl.startsWith('http') ? `https://${rawUrl}.supabase.co` : rawUrl;
const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      user_id,
      course_id,
      status,
      created_at,
      users (
        id,
        full_name,
        email
      ),
      courses (
        id,
        title
      )
    `)
    .limit(1);
    
  console.log("Relational query result:", JSON.stringify({ data, error }, null, 2));
}

test();
