import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getCourses } from '@/lib/data';
import { daysUntil, examPhaseLabel, getExamPhase } from '@/lib/study-logic';
import { Badge, Card, ProgressBar, SectionTitle } from '@/components/ui';

export default async function ExamsPage() {
  const courses = await getCourses();
  const withExams = courses.filter((c) => c.examDate);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Eksamen</h1>
        <p className="text-sm text-muted">
          Fokuset endres automatisk etter hvor lenge det er til hver eksamen.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {withExams.map((c) => {
          const days = daysUntil(c.examDate as string);
          const phase = getExamPhase(c.examDate);
          return (
            <Card key={c.id}>
              <SectionTitle
                action={<Badge tone="accent">{days} dager igjen</Badge>}
              >
                {c.code}
              </SectionTitle>
              <p className="text-sm text-muted">
                Eksamen {format(new Date(c.examDate as string), 'd. MMMM yyyy', { locale: nb })}
              </p>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span>Pensumprogresjon</span>
                  <span>{c.progress.curriculumPct}%</span>
                </div>
                <ProgressBar value={c.progress.curriculumPct} />
              </div>

              <p className="mt-4 text-sm">
                Anbefalt fokus nå: <span className="font-medium">{examPhaseLabel(phase)}</span>
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
