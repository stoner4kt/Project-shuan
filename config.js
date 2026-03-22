window.FINCONNECT_CONFIG = {
  // Public site URL, used in email verification links.
  siteUrl: 'https://your-domain.example.com',

  // Supabase project settings.
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',

  // Optional overrides.
  edgeFunctionBase: 'https://YOUR_PROJECT.supabase.co/functions/v1',
  leadSubmitFunction: 'lead-submit',
  leadVerifyFunction: 'lead-verify',
  leadsTable: 'leads'
};
