const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const rawUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = rawUrl && !rawUrl.startsWith('http') 
  ? `https://${rawUrl}.supabase.co` 
  : (rawUrl || 'https://placeholder.supabase.co');
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'aya.elbrashy.customer@gmail.com';
  // Admin logic to get user ID: we don't have service_role, so let's just query users table if we can, or auth.users if we have privileges.
  // Wait, we don't have service_role key.
  // How can we log in as Aya? We can just query `enrollments` table using her known UUID if we have it.
  
  // Let's get the user ID for Aya by querying enrollments or from a previous script.
  const { data: users } = await supabase.from('users').select('*').eq('email', email);
  console.log('users from public.users for Aya:', users);
  
  if (users && users.length > 0) {
    const userId = users[0].id;
    console.log('UserId:', userId);
    
    // Now run the exact same query as MyCourses:
    const { data: enrollments, error: err1 } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
        
    console.log('Enrollments for Aya (anon key):', enrollments, err1);
    
    // Let's also do it with her auth token!
    // Oh we can't easily sign in as her without password. 
  } else {
      console.log('Could not find Aya in public.users');
  }
}

main().catch(console.error);
