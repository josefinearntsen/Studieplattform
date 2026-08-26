import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getAssignments, getLectures } from '@/lib/data';
import { Badge, Card, SectionTitle } from '@/components/ui';

type AgendaItem = {
  id: string;
  date: Date;
  title: string;
  category: 'lecture' | 'deadline';
};

export default async function CalendarPage() {
  const [lectures, assignments] = await Promise.all([getLectures(), getAssignments()]);

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
  ];

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Kalender</h1>
        <p className="text-sm text-muted">
          Forelesninger, øvingstimer, deadlines og eksamener samlet ett sted.
          Google Calendar- og .ics-import settes opp under Settings → Integrations.
        </p>
      </header>

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
                  <li key={it.id}>
                    <Badge tone={it.category === 'lecture' ? 'accent' : 'warn'}>
                      {format(it.date, 'HH:mm')} {it.title}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card>
        <SectionTitle>Koble til Google Calendar</SectionTitle>
        <p className="text-sm text-muted">
          Gå til <span className="font-medium">Settings → Integrations</span> for å koble til Google
          Calendar, eller importer en .ics-fil direkte.
        </p>
      </Card>
    </div>
  );
}
