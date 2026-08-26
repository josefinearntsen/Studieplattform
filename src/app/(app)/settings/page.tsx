import { DEMO_MODE } from '@/lib/data';
import { Badge, Button, Card, SectionTitle } from '@/components/ui';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">Koble til eksterne tjenester og administrer kontoen din.</p>
      </header>

      <Card>
        <SectionTitle>Integrations</SectionTitle>
        <div className="divide-y divide-line">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Google Calendar</p>
              <p className="text-sm text-muted">Synkroniser timeplanen din automatisk.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="neutral">Ikke tilkoblet</Badge>
              <Button variant="ghost" disabled={DEMO_MODE}>
                Koble til
              </Button>
            </div>
          </div>

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
              <p className="text-sm text-muted">Anthropic eller OpenAI — konfigureres via env-variabler.</p>
            </div>
            <Badge tone="good">Anthropic</Badge>
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
