import 'react-native-url-polyfill/auto'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { createClient } from '@supabase/supabase-js'; 
 
const supabaseUrl = 'https://wfoabqbtvepwzcmqotta.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmb2FicWJ0dmVwd3pjbXFvdHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTI5OTAsImV4cCI6MjA5MzU4ODk5MH0.uEz9fckQ4ZcXxvosYRXdyMYTOyyYcdckNHlMDXINHr0'; 
 
export const supabase = createClient(supabaseUrl, supabaseAnonKey, { 
  auth: { 
    storage: AsyncStorage, 
    autoRefreshToken: true, 
    persistSession: true, 
    detectSessionInUrl: false, 
  }, 
});