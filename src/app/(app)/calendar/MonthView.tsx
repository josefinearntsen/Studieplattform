import { format, isSameDay, isSameMonth, isToday } from 'date-fns';
import type { AgendaItem } from './utils';
import { itemColor } from './utils';

const WEEKDAY_LABELS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const MAX_VISIBLE = 3;

export function MonthView({
  days,
  monthAnchor,
  items,
}: {
  days: Date[];
  monthAnchor: Date;
  items: AgendaItem[];
}) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-[11px] font-medium uppercase text-muted"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = items
            .filter((it) => isSameDay(it.start, day))
            .sort((a, b) => a.start.getTime() - b.start.getTime());
          const visible = dayItems.slice(0, MAX_VISIBLE);
          const hidden = dayItems.length - visible.length;
          const inMonth = isSameMonth(day, monthAnchor);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[112px] border-b border-r border-line p-1.5 ${
                inMonth ? '' : 'bg-line/25'
              }`}
            >
              <p
                className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  today ? 'bg-accent text-white' : inMonth ? 'text-ink' : 'text-muted'
                }`}
              >
                {format(day, 'd')}
              </p>
              <ul className="space-y-0.5">
                {visible.map((it) => (
                  <li
                    key={it.id}
                    className="truncate rounded px-1 py-0.5 text-[11px] font-medium text-white"
                    style={{ backgroundColor: itemColor(it) }}
                    title={it.title}
                  >
                    {format(it.start, 'HH:mm')} {it.title}
                  </li>
                ))}
                {hidden > 0 && <li className="px-1 text-[11px] text-muted">+{hidden} mer</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
