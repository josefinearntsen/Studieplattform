import { addDays, format, isToday, startOfDay } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getAssignments, getLectures, DEMO_MODE } from '@/lib/data';
import { getGoogleCalendarEvents, getGoogleTasks } from '@/lib/google-calendar';
import { buildAgendaItems, itemColor } from '@/lib/agenda';
import { daysUntil, getUpcomingDeadlines } from '@/lib/study-logic';
import { Card, SectionTitle } from '@/components/ui';

export default async function TodayPage() {
  const now = new Date();
  const rangeStart = startOfDay(now);
  const rangeEnd = addDays(now, 1);

  const [lectures, assignments, googleEvents, googleTasks] = await Promise.all([
    getLectures(),
    getAssignments(),
    DEMO_MODE ? Promise.resolve([]) : getGoogleCalendarEvents({ timeMin: rangeStart, timeMax: rangeEnd }),
    DEMO_MODE ? Promise.resolve([]) : getGoogleTasks(),
  ]);

  // Samme sammenslåing som kalendersiden, slik at dagens agenda her stemmer med
  // det som faktisk står i kalenderen (inkl. Google Calendar-hendelser).
  const { items: agendaItems } = buildAgendaItems({ lectures, assignments, googleEvents, googleTasks });
  const todayItems = agendaItems
    .filter((it) => (it.category === 'lecture' || it.category === 'google') && isToday(it.start))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const soonDeadlines = getUpcomingDeadlines(assignments, 3);

  const hour = new Date().getHours();
  const greeting = hour < 10 ? 'God morgen' : hour < 17 ? 'God dag' : 'God kveld';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{greeting} 👋</h1>
        <p className="text-sm text-muted">{format(new Date(), 'EEEE d. MMMM', { locale: nb })}</p>
      </header>

      <Card>
        <SectionTitle>I dag har du</SectionTitle>
        {todayItems.length === 0 ? (
          <p className="text-sm text-muted">Ingen forelesninger eller hendelser i dag — god dag for repetisjon.</p>
        ) : (
          <ul className="space-y-4">
            {todayItems.map((it) => {
              const lecture = it.category === 'lecture' ? lectures.find((l) => l.id === it.id) : undefined;
              return (
                <li key={it.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                  <p className="flex items-center gap-2 font-medium">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: itemColor(it) }}
                    />
                    {format(it.start, 'HH:mm')} {it.title}
                  </p>
                  {lecture?.prepInstructions && (
                    <p className="mt-1 text-sm text-muted">📖 {lecture.prepInstructions}</p>
                  )}
                  {lecture?.prepMinutes && <p className="text-sm text-muted">⏱ {lecture.prepMinutes} min</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle>Deadline snart</SectionTitle>
        <ul className="space-y-2 text-sm">
          {soonDeadlines.map((a) => (
            <li key={a.id} className="flex justify-between">
              <span>
                {a.courseCode} — {a.title}
              </span>
              <span className="text-muted">{daysUntil(a.dueAt)} dager</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
