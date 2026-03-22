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

function sanitize(value: unknown, max = 400) {
  return String(value ?? '').trim().slice(0, max);
}

function normalizeServices(value: unknown) {
  return sanitize(value, 500)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

async function sendVerificationEmail(params: {
  email: string;
  fullName: string;
  verificationUrl: string;
}) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM_EMAIL');

  if (!apiKey || !from) {
    throw new Error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL environment variable.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [params.email],
      subject: 'Verify your FinConnect SA enquiry',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#212A31;max-width:560px;margin:0 auto;">
          <h2 style="margin-bottom:12px;">Confirm your enquiry</h2>
          <p>Hello ${params.fullName || 'there'},</p>
          <p>Thank you for your enquiry with FinConnect SA. Please verify your email address to confirm that we can route your request to the most suitable financial partner.</p>
          <p style="margin:24px 0;">
            <a href="${params.verificationUrl}" style="display:inline-block;background:#124E66;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;">Verify my email</a>
          </p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p><a href="${params.verificationUrl}">${params.verificationUrl}</a></p>
          <p style="font-size:12px;color:#748D92;">If you did not make this request, you can ignore this email.</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend error: ${text}`);
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await request.json();

    const fullName = sanitize(body.fullName, 120);
    const email = sanitize(body.email, 160).toLowerCase();
    const phone = sanitize(body.phone, 40);
    const province = sanitize(body.province, 80);
    const services = normalizeServices(body.services);
    const message = sanitize(body.message, 2000);
    const consent = sanitize(body.consent, 10) || 'Yes';
    const siteUrl = sanitize(body.siteUrl, 240).replace(/\/$/, '');

    if (!fullName || !email || !phone || !province || services.length === 0 || consent !== 'Yes') {
      return jsonResponse({ error: 'Missing required lead fields.' }, 400);
    }

    const verificationToken = crypto.randomUUID();
    const verificationUrl = `${siteUrl || 'https://your-domain.example.com'}?verify=${verificationToken}`;

    const { error: insertError } = await supabase.from('leads').insert({
      full_name: fullName,
      email,
      phone,
      province,
      services,
      message,
      consent,
      status: 'New',
      verification_token: verificationToken,
      verification_sent_at: new Date().toISOString(),
      metadata: {
        source: 'public-site',
        verified: false
      }
    });

    if (insertError) {
      throw insertError;
    }

    await sendVerificationEmail({
      email,
      fullName,
      verificationUrl
    });

    return jsonResponse({ success: true, message: 'Lead submitted and verification email sent.' }, 200);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
