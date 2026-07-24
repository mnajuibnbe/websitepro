import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('courses').select('id, title');
  console.log("courses:", data);
  const { data: lData } = await supabase.from('lessons').select('id, course_id, title');
  console.log("lessons:", lData);
}
check();
