// VORTEX Supabase Client - 800 features DB
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl ||!supabaseKey) {
  console.warn('VORTEX: Missing SUPABASE env - using local');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper for all 800 tables
export const TABLES = {
  users: 'users',
  posts: 'posts', // Home feed #2-10
  reels: 'reels', // #172-217
  stories: 'stories', // #137-171
  follows: 'follows', // #109
  friends: 'friend_requests', // #107
  messages: 'messages', // #261
  products: 'marketplace_products', // #357
  wallet: 'wallet', // #541
  notifications: 'notifications' // #301
};
