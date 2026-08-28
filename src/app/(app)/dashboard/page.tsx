import Link from 'next/link';
import { addDays, format, isToday, startOfDay } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getAssignments, getCourses, getLectures, DEMO_MODE } from '@/lib/data';
import { getGoogleCalendarEvents, getGoogleTasks } from '@/lib/google-calendar';
import { buildAgendaItems, itemColor } from '@/lib/agenda';
import {
  buildNextActionBrief,
  computeWeeklyFocus,
  daysUntil,
  getUpcomingDeadlines,
} from '@/lib/study-logic';
import { Badge, Button, Card, ProgressBar, SectionTitle } from '@/components/ui';

export default async function DashboardPage() {
  const now = new Date();
  const rangeStart = startOfDay(now);
  const rangeEnd = addDays(now, 14);

  const [courses, lectures, assignments, googleEvents, googleTasks] = await Promise.all([
    getCourses(),
    getLectures(),
    getAssignments(),
    DEMO_MODE ? Promise.resolve([]) : getGoogleCalendarEvents({ timeMin: rangeStart, timeMax: rangeEnd }),
    DEMO_MODE ? Promise.resolve([]) : getGoogleTasks(),
  ]);

  // Slår sammen lokale forelesninger med hendelser fra Google Calendar, slik at
  // "I dag" og "Neste hendelser" viser det samme bildet som selve kalendersiden —
  // ikke bare de forhåndsdefinerte NTNU-forelesningene.
  const { items: agendaItems } = buildAgendaItems({ lectures, assignments, googleEvents, googleTasks });
  const scheduleItems = agendaItems.filter((it) => it.category === 'lecture' || it.category === 'google');
  const todayItems = scheduleItems
    .filter((it) => isToday(it.start))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const upcomingItems = scheduleItems
    .filter((it) => it.start.getTime() >= now.getTime() && !isToday(it.start))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5);

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
          {todayItems.length === 0 ? (
            <p className="text-sm text-muted">Ingen forelesninger eller hendelser i dag.</p>
          ) : (
            <ul className="space-y-4">
              {todayItems.map((it) => {
                const lecture = it.category === 'lecture' ? lectures.find((l) => l.id === it.id) : undefined;
                return (
                  <li key={it.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 font-medium">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: itemColor(it) }}
                        />
                        {it.title}
                      </p>
                      <span className="text-sm text-muted">{format(it.start, 'HH:mm')}</span>
                    </div>
                    {lecture?.prepInstructions && (
                      <p className="mt-1 text-sm text-muted">
                        Før forelesningen: {lecture.prepInstructions}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6">
            <SectionTitle>Neste hendelser</SectionTitle>
            <ul className="space-y-2">
              {upcomingItems.map((it) => (
                <li key={it.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: itemColor(it) }}
                    />
                    {it.title}
                  </span>
                  <span className="text-muted">
                    {format(it.start, 'EEE d. MMM, HH:mm', { locale: nb })}
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
