import { createClient } from './supabase/server';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_LIST_URL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';

export interface GoogleEvent {
  id: string;
  title: string;
  start: string; // ISO
  end?: string;
  location?: string;
  calendarSummary?: string;
}

export interface GoogleCalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
}

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

async function getRefreshTokenForCurrentUser(): Promise<{
  userId: string;
  refreshToken: string;
  selectedCalendarIds: string[];
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: integration } = await supabase
    .from('user_integrations')
    .select('google_calendar_connected, google_refresh_token, google_calendar_ids')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!integration?.google_calendar_connected || !integration.google_refresh_token) return null;

  return {
    userId: user.id,
    refreshToken: integration.google_refresh_token,
    selectedCalendarIds: integration.google_calendar_ids?.length
      ? integration.google_calendar_ids
      : ['primary'],
  };
}

/**
 * Lister alle kalendere brukeren har tilgang til i Google Calendar
 * (personlig, skole, delte kalendere osv.), slik at de kan velges i Settings.
 */
export async function listGoogleCalendars(): Promise<GoogleCalendarInfo[]> {
  const ctx = await getRefreshTokenForCurrentUser();
  if (!ctx) return [];

  const accessToken = await getAccessToken(ctx.refreshToken);
  if (!accessToken) return [];

  const res = await fetch(CALENDAR_LIST_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []).map((c: any) => ({
    id: c.id,
    summary: c.summary,
    primary: Boolean(c.primary),
  }));
}

/**
 * Henter kommende hendelser fra alle kalendere brukeren har valgt å synkronisere.
 * Returnerer tom liste (ikke feil) hvis brukeren ikke er koblet til.
 */
export async function getGoogleCalendarEvents(): Promise<GoogleEvent[]> {
  const ctx = await getRefreshTokenForCurrentUser();
  if (!ctx) return [];

  const accessToken = await getAccessToken(ctx.refreshToken);
  if (!accessToken) return [];

  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    maxResults: '50',
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const results = await Promise.all(
    ctx.selectedCalendarIds.map(async (calendarId) => {
      const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?${params.toString()}`;

      const res = await fetch(eventsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return [];

      const data = await res.json();
      return (data.items ?? []).map((e: any) => ({
        id: e.id,
        title: e.summary ?? '(uten tittel)',
        start: e.start?.dateTime ?? e.start?.date,
        end: e.end?.dateTime ?? e.end?.date,
        location: e.location,
        calendarSummary: data.summary,
      }));
    })
  );

  return results.flat();
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  const ctx = await getRefreshTokenForCurrentUser();
  return Boolean(ctx);
}
