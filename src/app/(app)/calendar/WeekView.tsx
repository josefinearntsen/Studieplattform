'use client';

import { useEffect, useRef, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { nb } from 'date-fns/locale';
import type { AgendaCategory } from './utils';
import { layoutOverlaps, itemColor, minutesSinceMidnight } from './utils';

const PX_PER_HOUR = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const NOW_COLOR = '#E5484D';

export type SerializedItem = {
  id: string;
  start: string; // ISO
  end: string; // ISO
  title: string;
  category: AgendaCategory;
  color?: string;
  meta?: string;
};

export function WeekView({ days, items }: { days: string[]; items: SerializedItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const anchorHour = Math.max(0, new Date().getHours() - 2);
    container.scrollTop = anchorHour * PX_PER_HOUR;
  }, []);

  const dayDates = days.map((d) => new Date(`${d}T00:00:00`));

  const itemsByDay = dayDates.map((day) =>
    layoutOverlaps(
      items
        .filter((it) => isSameDay(new Date(it.start), day))
        .map((it) => ({ ...it, start: new Date(it.start), end: new Date(it.end) }))
    )
  );

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-line">
        <div />
        {dayDates.map((day) => {
          const today = now ? isSameDay(day, now) : false;
          return (
            <div
              key={day.toISOString()}
              className={`border-l border-line px-2 py-2 text-center ${today ? 'bg-accentSoft' : ''}`}
            >
              <p className="text-[11px] font-medium uppercase text-muted">
                {format(day, 'EEE', { locale: nb })}
              </p>
              <p className={`text-lg font-semibold ${today ? 'text-accent' : 'text-ink'}`}>
                {format(day, 'd')}
              </p>
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="max-h-[600px] overflow-y-auto">
        <div
          className="relative grid grid-cols-[56px_repeat(7,1fr)]"
          style={{ height: PX_PER_HOUR * 24 }}
        >
          <div className="relative">
            {HOURS.map((h) =>
              h === 0 ? null : (
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-muted"
                  style={{ top: h * PX_PER_HOUR }}
                >
                  {`${String(h).padStart(2, '0')}:00`}
                </div>
              )
            )}
          </div>

          {dayDates.map((day, dayIdx) => (
            <div key={day.toISOString()} className="relative border-l border-line">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-line/70"
                  style={{ top: h * PX_PER_HOUR }}
                />
              ))}

              {itemsByDay[dayIdx].map((it) => {
                const top = (minutesSinceMidnight(it.start) / 60) * PX_PER_HOUR;
                const durationMin = Math.max(20, (it.end.getTime() - it.start.getTime()) / 60000);
                const height = Math.max(20, (durationMin / 60) * PX_PER_HOUR);
                const widthPct = 100 / it.cols;
                const leftPct = widthPct * it.col;
                return (
                  <div
                    key={it.id}
                    className="absolute overflow-hidden rounded-md px-1.5 py-0.5 text-[11px] leading-tight text-white shadow-sm"
                    style={{
                      top,
                      height,
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      backgroundColor: itemColor(it),
                    }}
                    title={it.title}
                  >
                    <p className="truncate font-medium">{it.title}</p>
                    {height > 30 && (
                      <p className="truncate opacity-90">
                        {format(it.start, 'HH:mm')}
                        {it.meta ? ` · ${it.meta}` : ''}
                      </p>
                    )}
                  </div>
                );
              })}

              {now && isSameDay(now, day) && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
                  style={{ top: (minutesSinceMidnight(now) / 60) * PX_PER_HOUR }}
                >
                  <span
                    className="-ml-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: NOW_COLOR }}
                  />
                  <span className="h-px w-full" style={{ backgroundColor: NOW_COLOR }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
