import Link from 'next/link';
import { addDays, addWeeks, format, isSameDay, startOfWeek } from 'date-fns';
import { nb } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { getAssignments, getLectures, DEMO_MODE } from '@/lib/data';
import { getGoogleCalendarEvents, getGoogleTasks, isGoogleCalendarConnected } from '@/lib/google-calendar';
import { Badge, Card, SectionTitle } from '@/components/ui';

type AgendaItem = {
  id: string;
  date: Date;
  title: string;
  category: 'lecture' | 'deadline' | 'google';
  color?: string;
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const [lectures, assignments, googleEvents, googleTasks, googleConnected] = await Promise.all([
    getLectures(),
    getAssignments(),
    DEMO_MODE ? Promise.resolve([]) : getGoogleCalendarEvents(),
    DEMO_MODE ? Promise.resolve([]) : getGoogleTasks(),
    DEMO_MODE ? Promise.resolve(false) : isGoogleCalendarConnected(),
  ]);

  const items: AgendaItem[] = [
    ...lectures.map((l) => ({
      id: l.id,
      date: new Date(l.scheduledAt),
      title: `${l.courseCode} — ${l.title}`,
      category: 'lecture' as const,
    })),
    ...assignments.map((a) => ({
      id: a.id,
      date: new Date(a.dueAt),
      title: `${a.courseCode} — ${a.title} (frist)`,
      category: 'deadline' as const,
    })),
    ...googleEvents.map((e) => ({
      id: e.id,
      date: new Date(e.start),
      title: e.title,
      category: 'google' as const,
      color: e.color,
    })),
  ];

  // Gjøremål med frist vises også i tidslinjen; de uten frist vises kun i egen liste
  const tasksWithDue = googleTasks.filter((t) => t.due);
  const tasksWithoutDue = googleTasks.filter((t) => !t.due);
  tasksWithDue.forEach((t) => {
    items.push({
      id: `task-${t.id}`,
      date: new Date(t.due as string),
      title: `✓ ${t.title}`,
      category: 'google',
      color: '#6E5A94',
    });
  });

  const weekOffset = Number(searchParams.week ?? '0') || 0;
  const weekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const upcoming = items
    .filter((it) => it.date.getTime() >= Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 15);

  function itemBadge(it: AgendaItem, showTime = true) {
    if (it.category === 'google') {
      return (
        <span
          className="inline-block rounded-full px-2.5 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: it.color }}
        >
          {showTime && `${format(it.date, 'HH:mm')} `}
          {it.title}
        </span>
      );
    }
    return (
      <Badge tone={it.category === 'lecture' ? 'accent' : 'warn'}>
        {showTime && `${format(it.date, 'HH:mm')} `}
        {it.title}
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Kalender</h1>
        <p className="text-sm text-muted">
          Forelesninger, øvingstimer, deadlines og eksamener samlet ett sted.
          Google Calendar- og .ics-import settes opp under Settings → Integrations.
        </p>
      </header>

      <div className="flex items-center justify-between">
        <Link
          href={`/calendar?week=${weekOffset - 1}`}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:bg-canvas"
        >
          <ChevronLeft size={16} /> Forrige uke
        </Link>
        <p className="text-sm font-medium">
          {format(weekStart, 'd. MMM', { locale: nb })} –{' '}
          {format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: nb })}
          {weekOffset !== 0 && (
            <Link href="/calendar" className="ml-2 text-xs text-accent">
              (til i dag)
            </Link>
          )}
        </p>
        <Link
          href={`/calendar?week=${weekOffset + 1}`}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:bg-canvas"
        >
          Neste uke <ChevronRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-7">
        {days.map((day) => {
          const dayItems = items.filter((it) => isSameDay(it.date, day));
          return (
            <Card key={day.toISOString()} className="min-h-[160px]">
              <p className="text-xs font-medium uppercase text-muted">
                {format(day, 'EEE d.', { locale: nb })}
              </p>
              <ul className="mt-2 space-y-2">
                {dayItems.map((it) => (
                  <li key={it.id}>{itemBadge(it)}</li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card>
        <SectionTitle>Kommende hendelser</SectionTitle>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">Ingen kommende hendelser funnet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((it) => (
              <li key={it.id} className="flex items-center justify-between py-2 text-sm">
                <span>{it.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted">
                    {format(it.date, 'EEE d. MMM, HH:mm', { locale: nb })}
                  </span>
                  {itemBadge(it, false)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {tasksWithoutDue.length > 0 && (
        <Card>
          <SectionTitle>Gjøremål uten frist</SectionTitle>
          <ul className="space-y-2">
            {tasksWithoutDue.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <CheckSquare size={14} className="text-muted" />
                {t.title}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <SectionTitle>Google Calendar</SectionTitle>
        {googleConnected ? (
          <p className="text-sm text-good">
            ✓ Koblet til — hendelser og gjøremål fra Google vises nå med kalenderens egen farge.
          </p>
        ) : (
          <p className="text-sm text-muted">
            Gå til <span className="font-medium">Settings → Integrations</span> for å koble til
            Google Calendar, eller importer en .ics-fil direkte.
          </p>
        )}
      </Card>
    </div>
  );
}
