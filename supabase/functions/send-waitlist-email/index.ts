// Supabase Edge Function: send a welcome email when someone joins the waitlist.
// Uses Resend (https://resend.com). Set RESEND_API_KEY in Supabase secrets.
// Optional: set FROM_EMAIL (e.g. "CareMap <hello@yourdomain.com>") or defaults to onboarding@resend.dev

const RESEND_API = 'https://api.resend.com/emails';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: { email?: string; first_name?: string };
    try {
      body = (await req.json()) as { email?: string; first_name?: string };
    } catch {
      console.error('Invalid or missing JSON body');
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { email, first_name } = body;
    console.log('send-waitlist-email invoked', { email: email ? `${email.slice(0, 3)}...` : null, first_name });

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const from = Deno.env.get('FROM_EMAIL') || 'CareMap <onboarding@resend.dev>';
    const firstName = first_name?.trim() || 'there';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #0f172a;">You're on the list 🎉</h2>
  <p>Hi ${firstName},</p>
  <p>Thanks for joining the CareMap waitlist. We'll notify you as soon as early access is available.</p>
  <p>— The CareMap team</p>
</body>
</html>`;

    console.log('Calling Resend API, from:', from);
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "You're on the CareMap waitlist",
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));
    console.log('Resend response', res.status, data);
    if (!res.ok) {
      console.error('Resend error:', res.status, data);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: data }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
