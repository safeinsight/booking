// Copy this file to your GitHub Pages repository and replace the placeholders.
// The anon key is safe to expose when Supabase RLS is configured correctly.
// NEVER put Google client secrets, refresh tokens, Stripe secret keys, or the
// Supabase service-role key in this file.

window.BOOKING_CONFIG = {
  supabaseUrl: "https://mgcjalilweficfafnqas.supabase.co",
  supabaseAnonKey: "sb_publishable_KCLFMHgmLsO3q7497w1HgQ_wgVO4Y95",

  // Optional: default location when the URL has no ?location=...
  defaultLocationSlug: "safe-insight",

  // URL of your deployed Supabase Edge Function.
  functionsBaseUrl: "https://mgcjalilweficfafnqas.supabase.co/functions/v1"
};
