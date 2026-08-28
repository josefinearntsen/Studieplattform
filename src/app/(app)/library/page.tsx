import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { DEMO_MODE, getCourses, getDocuments } from '@/lib/data';
import type { DocumentStatus, DocumentType } from '@/lib/types';
import { Badge, Card, SectionTitle } from '@/components/ui';

const docTypeLabel: Record<DocumentType, string> = {
  lecture_slides: 'Forelesningsslides',
  curriculum: 'Pensum',
  assignment: 'Øving',
  exam: 'Eksamen',
  notes: 'Notater',
  course_plan: 'Undervisningsplan',
  other: 'Annet',
};

const statusInfo: Record<DocumentStatus, { label: string; tone: 'good' | 'warn' | 'neutral' }> = {
  pending: { label: 'Venter', tone: 'neutral' },
  processing: { label: 'Analyserer…', tone: 'warn' },
  done: { label: 'Analysert', tone: 'good' },
  error: { label: 'Feilet', tone: 'warn' },
};

const libraryErrorMessages: Record<string, string> = {
  demo_mode: 'Opplasting krever Supabase (se README.md) — du kjører nå i demo-modus.',
  missing_fields: 'Velg et fag og en fil før du laster opp.',
  file_too_large: 'Filen er for stor (maks 15 MB).',
  upload_failed: 'Opplastingen feilet. Prøv igjen.',
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { uploaded?: string; deleted?: string; reanalyzed?: string; library_error?: string };
}) {
  const [courses, documents] = await Promise.all([getCourses(), getDocuments()]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Library</h1>
        <p className="text-sm text-muted">
          Last opp pensum, slides og undervisningsplaner. Filer lagres i Supabase Storage og
          analyseres automatisk av AI-laget — som fyller inn hva neste forelesning handler om og
          hva du bør lese før du møter opp.
        </p>
      </header>

      {searchParams.uploaded && (
        <Card className="border-good/30 bg-goodSoft">
          <p className="text-sm text-good">✓ Filen er lastet opp og analysert.</p>
        </Card>
      )}
      {searchParams.deleted && (
        <Card className="border-good/30 bg-goodSoft">
          <p className="text-sm text-good">✓ Filen er slettet.</p>
        </Card>
      )}
      {searchParams.reanalyzed && (
        <Card className="border-good/30 bg-goodSoft">
          <p className="text-sm text-good">✓ Dokumentet er analysert på nytt.</p>
        </Card>
      )}
      {searchParams.library_error && (
        <Card className="border-warn/30 bg-warnSoft">
          <p className="text-sm text-warn">
            {libraryErrorMessages[searchParams.library_error] ??
              `Noe gikk galt: ${searchParams.library_error}`}
          </p>
        </Card>
      )}

      <Card className={DEMO_MODE ? 'border-dashed' : undefined}>
        <SectionTitle>Last opp dokument</SectionTitle>
        {DEMO_MODE ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="font-medium">Opplasting krever Supabase</p>
            <p className="text-sm text-muted">
              Sett opp Supabase (se README.md) for å laste opp og AI-analysere pensum og
              undervisningsplaner.
            </p>
          </div>
        ) : courses.length === 0 ? (
          <p className="text-sm text-muted">Legg til et fag under Courses før du laster opp filer.</p>
        ) : (
          <form
            action="/api/library/upload"
            method="POST"
            encType="multipart/form-data"
            className="grid gap-3 sm:grid-cols-2"
          >
            <select
              name="courseId"
              required
              className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Velg fag…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            <select
              name="docType"
              required
              defaultValue="course_plan"
              className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {Object.entries(docTypeLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              name="title"
              placeholder="Tittel (valgfritt, bruker filnavn hvis tomt)"
              className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent sm:col-span-2"
            />
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.txt,.md,.markdown"
              className="text-sm sm:col-span-2"
            />
            <p className="text-xs text-muted sm:col-span-2">PDF, .txt eller .md — maks 15 MB.</p>
            <button
              type="submit"
              className="rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-black sm:col-span-2 sm:w-fit"
            >
              Last opp og analyser
            </button>
          </form>
        )}
      </Card>

      <Card>
        <SectionTitle>Fag</SectionTitle>
        <div className="divide-y divide-line">
          {courses.map((c) => {
            const courseDocs = documents.filter((d) => d.courseId === c.id);
            return (
              <div key={c.id} className="py-4">
                <p className="mb-3 text-sm font-medium">{c.code}</p>
                {courseDocs.length === 0 ? (
                  <p className="text-sm text-muted">Ingen filer lastet opp ennå</p>
                ) : (
                  <ul className="space-y-4">
                    {courseDocs.map((d) => {
                      const status = statusInfo[d.status];
                      return (
                        <li key={d.id} className="rounded-lg border border-line p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{d.title}</p>
                              <p className="text-xs text-muted">
                                {docTypeLabel[d.docType]} · lastet opp{' '}
                                {format(new Date(d.createdAt), 'd. MMM yyyy', { locale: nb })}
                              </p>
                            </div>
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </div>

                          {d.status === 'error' && d.errorMessage && (
                            <p className="mt-2 text-sm text-warn">{d.errorMessage}</p>
                          )}

                          {d.status === 'done' && (
                            <div className="mt-2 space-y-2">
                              {d.aiSummary && <p className="text-sm text-ink/80">{d.aiSummary}</p>}
                              {d.aiKeyConcepts.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {d.aiKeyConcepts.map((k) => (
                                    <Badge key={k} tone="accent">
                                      {k}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {d.aiExamRelevance && (
                                <p className="text-xs text-muted">Eksamensrelevans: {d.aiExamRelevance}</p>
                              )}
                            </div>
                          )}

                          <div className="mt-3 flex gap-3 text-xs">
                            <form action={`/api/library/documents/${d.id}/reanalyze`} method="POST">
                              <button type="submit" className="text-accent hover:underline">
                                Analyser på nytt
                              </button>
                            </form>
                            <form action={`/api/library/documents/${d.id}/delete`} method="POST">
                              <button type="submit" className="text-warn hover:underline">
                                Slett
                              </button>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
          {courses.length === 0 && <p className="py-3 text-sm text-muted">Ingen fag lagt til ennå.</p>}
        </div>
      </Card>
    </div>
  );
}
