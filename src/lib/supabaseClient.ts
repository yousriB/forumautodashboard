import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Define types for environment variables
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Create and export the client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
