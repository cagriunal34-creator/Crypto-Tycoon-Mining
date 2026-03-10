import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://odzicthzwlbnwlepxzda.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kemljdGh6d2xibndsZXB4emRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjk1NDIsImV4cCI6MjA4ODY0NTU0Mn0.FzwJqtqvp_lTTIARKbEESKdTyPmmKg9VPZkGu0vwfEk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
    }
});

export const TABLES = {
    PROFILES: 'profiles',
    SETTINGS: 'settings',
    MARKETPLACE: 'marketplace',
    GUILDS: 'guilds',
    WITHDRAWALS: 'withdrawals',
    LOGS: 'logs',
    TRANSACTIONS: 'transactions'
};
