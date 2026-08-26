import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');

  const settingsUrl = new URL('/settings', url.origin);

  if (errorParam) {
    settingsUrl.searchParams.set('google_error', errorParam);
    return NextResponse.redirect(settingsUrl);
  }
  if (!code) {
    settingsUrl.searchParams.set('google_error', 'missing_code');
    return NextResponse.redirect(settingsUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    settingsUrl.searchParams.set('google_error', 'missing_env');
    return NextResponse.redirect(settingsUrl);
  }

  // Bytt code mot access_token + refresh_token
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    settingsUrl.searchParams.set('google_error', 'token_exchange_failed');
    return NextResponse.redirect(settingsUrl);
  }

  const tokenData = await tokenRes.json();
  const refreshToken: string | undefined = tokenData.refresh_token;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    settingsUrl.searchParams.set('google_error', 'not_logged_in');
    return NextResponse.redirect(settingsUrl);
  }

  if (!refreshToken) {
    // Skjer typisk hvis brukeren allerede har godkjent tilgang tidligere uten
    // "prompt=consent" — Google gir da ikke refresh_token på nytt.
    settingsUrl.searchParams.set('google_error', 'no_refresh_token');
    return NextResponse.redirect(settingsUrl);
  }
    if (!user) {
    settingsUrl.searchParams.set('google_error', 'not_logged_in');
    return NextResponse.redirect(settingsUrl);
  }
  console.log('Google callback — innlogget bruker:', user.id);

    const { error: upsertError } = await supabase.from('user_integrations').upsert({
    user_id: user.id,
    google_calendar_connected: true,
    google_refresh_token: refreshToken,
  });

  if (upsertError) {
    console.error('Klarte ikke å lagre Google-integrasjon:', upsertError);
    settingsUrl.searchParams.set('google_error', `db_error: ${upsertError.message}`);
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set('google_connected', '1');
  return NextResponse.redirect(settingsUrl);
}
