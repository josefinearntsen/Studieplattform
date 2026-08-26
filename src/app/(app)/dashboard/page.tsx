import Link from 'next/link';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getAssignments, getCourses, getLectures } from '@/lib/data';
import {
  buildNextActionBrief,
  computeWeeklyFocus,
  daysUntil,
  getTodayLectures,
  getUpcomingDeadlines,
  getUpcomingLectures,
} from '@/lib/study-logic';
import { Badge, Button, Card, ProgressBar, SectionTitle } from '@/components/ui';

export default async function DashboardPage() {
  const [courses, lectures, assignments] = await Promise.all([
    getCourses(),
    getLectures(),
    getAssignments(),
  ]);

  const todayLectures = getTodayLectures(lectures);
  const upcomingLectures = getUpcomingLectures(lectures, 5);
  const deadlines = getUpcomingDeadlines(assignments, 6);
  const weeklyFocus = computeWeeklyFocus(courses, lectures, assignments).slice(0, 3);
  const brief = buildNextActionBrief(lectures, assignments);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Hva bør jeg gjøre nå?</h1>
        <p className="text-sm text-muted">
          {format(new Date(), 'EEEE d. MMMM', { locale: nb })}
        </p>
      </header>

      {/* Hovedanbefaling */}
      {brief && (
        <Card className="border-accent/20 bg-accentSoft/40">
          <SectionTitle>Neste steg</SectionTitle>
          <p className="text-lg font-medium">{brief.headline}</p>
          {brief.prepSteps.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-ink/80">
              {brief.prepSteps.map((step, i) => (
                <li key={i}>• {step}</li>
              ))}
            </ul>
          )}
          {brief.lecture?.learningGoals?.length ? (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Du bør kunne
              </p>
              <ul className="mt-1 space-y-1 text-sm text-ink/80">
                {brief.lecture.learningGoals.map((g, i) => (
                  <li key={i}>• {g}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {brief.relatedAssignment && (
            <p className="mt-4 text-sm text-muted">
              {brief.relatedAssignment.title} bruker dette temaet og har frist om{' '}
              {daysUntil(brief.relatedAssignment.dueAt)} dager.
            </p>
          )}
          <Button className="mt-4">Start forberedelse</Button>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* I dag */}
        <Card className="md:col-span-2">
          <SectionTitle>I dag</SectionTitle>
          {todayLectures.length === 0 ? (
            <p className="text-sm text-muted">Ingen forelesninger i dag.</p>
          ) : (
            <ul className="space-y-4">
              {todayLectures.map((l) => (
                <li key={l.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {l.courseCode} — {l.title}
                    </p>
                    <span className="text-sm text-muted">
                      {format(new Date(l.scheduledAt), 'HH:mm')}
                    </span>
                  </div>
                  {l.prepInstructions && (
                    <p className="mt-1 text-sm text-muted">Før forelesningen: {l.prepInstructions}</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            <SectionTitle>Neste forelesninger</SectionTitle>
            <ul className="space-y-2">
              {upcomingLectures.map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm">
                  <span>
                    {l.courseCode} — {l.title}
                  </span>
                  <span className="text-muted">
                    {format(new Date(l.scheduledAt), 'EEE d. MMM, HH:mm', { locale: nb })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Denne uken */}
        <Card>
          <SectionTitle>Denne uken</SectionTitle>
          <ol className="space-y-3">
            {weeklyFocus.map((f, i) => (
              <li key={f.courseCode} className="text-sm">
                <span className="font-medium">
                  {i + 1}. {f.courseCode}
                </span>
                <p className="text-muted">{f.reason}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Kommende deadlines */}
        <Card>
          <SectionTitle>Kommende deadlines</SectionTitle>
          <ul className="space-y-3">
            {deadlines.map((a) => {
              const d = daysUntil(a.dueAt);
              return (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">
                      {a.courseCode} — {a.title}
                    </p>
                    <p className="text-muted">
                      Frist: {format(new Date(a.dueAt), 'd. MMMM', { locale: nb })}
                    </p>
                  </div>
                  <Badge tone={d <= 3 ? 'warn' : 'neutral'}>{d} dager</Badge>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Fagprogresjon */}
        <Card>
          <SectionTitle
            action={
              <Link href="/courses" className="text-xs text-accent">
                Se alle fag →
              </Link>
            }
          >
            Fremgang per fag
          </SectionTitle>
          <ul className="space-y-4">
            {courses.map((c) => (
              <li key={c.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{c.code}</span>
                  <span className="text-muted">{c.progress.curriculumPct}%</span>
                </div>
                <ProgressBar value={c.progress.curriculumPct} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
