import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getAssignments, getLectures } from '@/lib/data';
import { daysUntil, getTodayLectures, getUpcomingDeadlines } from '@/lib/study-logic';
import { Card, SectionTitle } from '@/components/ui';

export default async function TodayPage() {
  const [lectures, assignments] = await Promise.all([getLectures(), getAssignments()]);
  const todayLectures = getTodayLectures(lectures);
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
        {todayLectures.length === 0 ? (
          <p className="text-sm text-muted">Ingen forelesninger i dag — god dag for repetisjon.</p>
        ) : (
          <ul className="space-y-4">
            {todayLectures.map((l) => (
              <li key={l.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                <p className="font-medium">
                  {format(new Date(l.scheduledAt), 'HH:mm')} {l.courseCode} — {l.title}
                </p>
                {l.prepInstructions && (
                  <p className="mt-1 text-sm text-muted">📖 {l.prepInstructions}</p>
                )}
                {l.prepMinutes && <p className="text-sm text-muted">⏱ {l.prepMinutes} min</p>}
              </li>
            ))}
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
