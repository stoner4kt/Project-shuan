import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { token } = await request.json();
    const verificationToken = String(token ?? '').trim();

    if (!verificationToken) {
      return jsonResponse({ error: 'Verification token is required.' }, 400);
    }

    const { data: lead, error: lookupError } = await supabase
      .from('leads')
      .select('id, email_verified_at')
      .eq('verification_token', verificationToken)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!lead) return jsonResponse({ error: 'Verification link is invalid or has expired.' }, 404);
    if (lead.email_verified_at) return jsonResponse({ success: true, message: 'This email address has already been verified.' });

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        email_verified_at: new Date().toISOString(),
        metadata: { verified: true }
      })
      .eq('id', lead.id);

    if (updateError) throw updateError;

    return jsonResponse({ success: true, message: 'Your email has been verified successfully. Our team can now review your enquiry.' });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
