import Link from 'next/link';
import { DEMO_MODE } from '@/lib/data';
import { isGoogleCalendarConnected, listGoogleCalendars } from '@/lib/google-calendar';
import { createClient } from '@/lib/supabase/server';
import { Badge, Button, Card, SectionTitle } from '@/components/ui';

const googleErrorMessages: Record<string, string> = {
  missing_code: 'Google sendte ikke tilbake noen autorisasjonskode. Prøv på nytt.',
  missing_env: 'GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI mangler i .env.local.',
  token_exchange_failed: 'Klarte ikke å bytte koden mot et tilgangstoken. Sjekk client secret.',
  not_logged_in: 'Du må være logget inn for å koble til Google Calendar.',
  no_refresh_token:
    'Fikk ikke et vedvarende tilgangstoken. Fjern appen under myaccount.google.com/permissions og prøv på nytt.',
  access_denied: 'Du avbrøt eller avslo tilgangen på Google sin side.',
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { google_connected?: string; google_error?: string; calendars_saved?: string };
}) {
  const googleConnected = DEMO_MODE ? false : await isGoogleCalendarConnected();
  const calendars = googleConnected ? await listGoogleCalendars() : [];

  let selectedIds: string[] = ['primary'];
  if (googleConnected && !DEMO_MODE) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_integrations')
        .select('google_calendar_ids')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.google_calendar_ids?.length) selectedIds = data.google_calendar_ids;
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">Koble til eksterne tjenester og administrer kontoen din.</p>
      </header>

      {searchParams.google_connected && (
        <Card className="border-good/30 bg-goodSoft">
          <p className="text-sm text-good">✓ Google Calendar er nå koblet til.</p>
        </Card>
      )}
      {searchParams.calendars_saved && (
        <Card className="border-good/30 bg-goodSoft">
          <p className="text-sm text-good">✓ Kalendervalg lagret.</p>
        </Card>
      )}
      {searchParams.google_error && (
        <Card className="border-warn/30 bg-warnSoft">
          <p className="text-sm text-warn">
            {googleErrorMessages[searchParams.google_error] ??
              `Noe gikk galt: ${searchParams.google_error}`}
          </p>
        </Card>
      )}

      <Card>
        <SectionTitle>Integrations</SectionTitle>
        <div className="divide-y divide-line">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Google Calendar</p>
              <p className="text-sm text-muted">Synkroniser timeplanen din automatisk.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={googleConnected ? 'good' : 'neutral'}>
                {googleConnected ? 'Tilkoblet' : 'Ikke tilkoblet'}
              </Badge>
              {DEMO_MODE ? (
                <Button variant="ghost" disabled>
                  Koble til
                </Button>
              ) : (
                <Link href="/api/integrations/google/start">
                  <Button variant="ghost">{googleConnected ? 'Koble til på nytt' : 'Koble til'}</Button>
                </Link>
              )}
            </div>
          </div>

          {googleConnected && calendars.length > 0 && (
            <div className="py-4">
              <p className="mb-2 text-sm font-medium">Velg hvilke kalendere som skal synkroniseres</p>
              <form action="/api/integrations/google/select" method="POST" className="space-y-2">
                {calendars.map((cal) => (
                  <label key={cal.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="calendarId"
                      value={cal.id}
                      defaultChecked={selectedIds.includes(cal.id)}
                      className="rounded border-line"
                    />
                    {cal.summary} {cal.primary && <span className="text-muted">(personlig)</span>}
                  </label>
                ))}
                <button
                  type="submit"
                  className="mt-2 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-black"
                >
                  Lagre valg
                </button>
              </form>
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Canvas</p>
              <p className="text-sm text-muted">
                Legg inn Canvas URL og API-token for å hente assignments og undervisningsplan.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="neutral">Ikke tilkoblet</Badge>
              <Button variant="ghost" disabled={DEMO_MODE}>
                Sett opp
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">AI-leverandør</p>
              <p className="text-sm text-muted">Anthropic, OpenAI eller NTNU IDUN — konfigureres via env-variabler.</p>
            </div>
            <Badge tone="good">{process.env.AI_PROVIDER ?? 'anthropic'}</Badge>
          </div>
        </div>
      </Card>

      {DEMO_MODE && (
        <Card>
          <p className="text-sm text-muted">
            Du kjører i demo-modus. Sett opp Supabase (se README.md) for å aktivere ekte
            innlogging og integrasjoner.
          </p>
        </Card>
      )}
    </div>
  );
}
