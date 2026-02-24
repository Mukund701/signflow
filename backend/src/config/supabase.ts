import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string;

// Safety check to ensure your .env variables are loaded properly
if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Missing Supabase URL or Anon Key. Check your .env file.');
}

// Create a single Supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase Client Initialized successfully');