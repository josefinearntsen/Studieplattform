import Link from 'next/link';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { nb } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { getAgenda } from '@/lib/agenda-fetch';
import { Card, SectionTitle } from '@/components/ui';
import { WeekView, type SerializedItem } from './WeekView';
import { MonthView } from './MonthView';
import { itemColor } from './utils';

type CalendarView = 'week' | 'month';

function parseAnchorDate(raw?: string): Date {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { view?: string; date?: string };
}) {
  const view: CalendarView = searchParams.view === 'month' ? 'month' : 'week';
  const anchor = parseAnchorDate(searchParams.date);

  // Beregn hvilket datointervall som skal vises i rutenettet.
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const monthStart = startOfMonth(anchor);
  const gridStart = view === 'week' ? weekStart : startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEndExclusive =
    view === 'week'
      ? addDays(weekStart, 7)
      : addDays(endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }), 1);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthDays =
    view === 'month'
      ? eachDayOfInterval({ start: gridStart, end: addDays(gridEndExclusive, -1) })
      : [];

  // Google-hendelser hentes for det synlige rutenettet, men aldri smalere enn
  // "nå til 60 dager frem" — det holder agendalisten nederst fylt uansett hvilken
  // uke/måned man ser på, samtidig som tidligere hendelser i rutenettet ikke forsvinner.
  const now = new Date();
  const fetchMin = gridStart < now ? gridStart : now;
  const fetchMax = gridEndExclusive > addDays(now, 60) ? gridEndExclusive : addDays(now, 60);

  const { items, tasksWithoutDue, googleConnected } = await getAgenda({
    timeMin: fetchMin,
    timeMax: fetchMax,
  });

  const upcoming = items
    .filter((it) => it.start.getTime() >= Date.now())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 15);

  const serializedWeekItems: SerializedItem[] = items.map((it) => ({
    id: it.id,
    start: it.start.toISOString(),
    end: it.end.toISOString(),
    title: it.title,
    category: it.category,
    color: it.color,
    meta: it.meta,
  }));

  const dateParam = format(anchor, 'yyyy-MM-dd');
  const todayParam = format(new Date(), 'yyyy-MM-dd');
  const prevAnchor = view === 'week' ? addWeeks(anchor, -1) : addMonths(anchor, -1);
  const nextAnchor = view === 'week' ? addWeeks(anchor, 1) : addMonths(anchor, 1);
  const hrefFor = (v: CalendarView, d: Date) => `/calendar?view=${v}&date=${format(d, 'yyyy-MM-dd')}`;

  const rangeLabel =
    view === 'week'
      ? `${format(weekStart, 'd. MMM', { locale: nb })} – ${format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: nb })}`
      : format(anchor, 'LLLL yyyy', { locale: nb }).replace(/^./, (c) => c.toUpperCase());

  const isCurrent = view === 'week' ? dateParam === todayParam || weekDays.some((d) => format(d, 'yyyy-MM-dd') === todayParam) : format(anchor, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Kalender</h1>
        <p className="text-sm text-muted">
          Forelesninger, øvingstimer, deadlines og eksamener samlet ett sted.
          Google Calendar- og .ics-import settes opp under Settings → Integrations.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={hrefFor(view, prevAnchor)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:bg-canvas"
          >
            <ChevronLeft size={16} />
          </Link>
          <Link
            href={hrefFor(view, nextAnchor)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:bg-canvas"
          >
            <ChevronRight size={16} />
          </Link>
          {!isCurrent && (
            <Link
              href={hrefFor(view, new Date())}
              className="ml-1 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:bg-canvas"
            >
              I dag
            </Link>
          )}
          <p className="ml-2 text-sm font-medium">{rangeLabel}</p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-line p-0.5">
          <Link
            href={hrefFor('week', anchor)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              view === 'week' ? 'bg-ink text-white' : 'text-muted hover:bg-canvas'
            }`}
          >
            Uke
          </Link>
          <Link
            href={hrefFor('month', anchor)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              view === 'month' ? 'bg-ink text-white' : 'text-muted hover:bg-canvas'
            }`}
          >
            Måned
          </Link>
        </div>
      </div>

      {view === 'week' ? (
        <WeekView
          days={weekDays.map((d) => format(d, 'yyyy-MM-dd'))}
          items={serializedWeekItems}
        />
      ) : (
        <MonthView days={monthDays} monthAnchor={monthStart} items={items} />
      )}

      <Card>
        <SectionTitle>Kommende hendelser</SectionTitle>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">Ingen kommende hendelser funnet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((it) => (
              <li key={it.id} className="flex items-center justify-between py-2 text-sm">
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
