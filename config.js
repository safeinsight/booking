// Copy this file to your GitHub Pages repository and replace the placeholders.
// The anon key is safe to expose when Supabase RLS is configured correctly.
// NEVER put Google client secrets, refresh tokens, Stripe secret keys, or the
// Supabase service-role key in this file.

window.BOOKING_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",

  // Optional: default location when the URL has no ?location=...
  defaultLocationSlug: "safe-insight",

  // URL of your deployed Supabase Edge Function.
  functionsBaseUrl: "https://YOUR-PROJECT.supabase.co/functions/v1"
};
