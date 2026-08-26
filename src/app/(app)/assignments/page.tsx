import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getAssignments } from '@/lib/data';
import { daysUntil } from '@/lib/study-logic';
import { Badge, Card, SectionTitle } from '@/components/ui';

const statusTone = {
  not_started: 'neutral',
  started: 'accent',
  almost_done: 'warn',
  submitted: 'good',
} as const;

const statusLabel = {
  not_started: 'Ikke startet',
  started: 'Påbegynt',
  almost_done: 'Nesten ferdig',
  submitted: 'Levert',
} as const;

export default async function AssignmentsPage() {
  const assignments = await getAssignments();
  const sorted = [...assignments].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Øvinger</h1>
        <p className="text-sm text-muted">Alle øvinger på tvers av fagene dine, sortert etter frist.</p>
      </header>

      <Card>
        <SectionTitle>Alle øvinger</SectionTitle>
        <ul className="divide-y divide-line">
          {sorted.map((a) => {
            const d = daysUntil(a.dueAt);
            return (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {a.courseCode} — {a.title}
                  </p>
                  <p className="text-muted">
                    Frist: {format(new Date(a.dueAt), 'd. MMMM', { locale: nb })}
                    {a.relatedTopics.length > 0 && ` · Tema: ${a.relatedTopics.join(', ')}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={d <= 3 ? 'warn' : 'neutral'}>
                    {d >= 0 ? `${d} dager igjen` : 'Forfalt'}
                  </Badge>
                  <Badge tone={statusTone[a.status]}>{statusLabel[a.status]}</Badge>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
