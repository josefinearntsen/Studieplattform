import { Card, SectionTitle } from '@/components/ui';

export default function NewCoursePage() {
  return (
    <div className="max-w-lg space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Legg til fag</h1>
        <p className="text-sm text-muted">
          Skriv inn fagkoden, så forsøker vi å hente info fra NTNUs emneside automatisk.
        </p>
      </header>

      <Card>
        <SectionTitle>Fagkode</SectionTitle>
        <form action="/api/courses" method="POST" className="space-y-3">
          <input
            name="code"
            placeholder="f.eks. TDT4172"
            required
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            name="ntnuUrl"
            placeholder="NTNU-lenke (valgfritt, limes inn manuelt hvis auto-henting ikke fungerer)"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Legg til fag
          </button>
        </form>
      </Card>
    </div>
  );
}
