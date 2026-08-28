import type { GoogleEvent, GoogleTask } from './google-calendar';
import type { Assignment, Lecture } from './types';

/**
 * Felles "agenda"-modell: slår sammen lokale forelesninger/frister med Google
 * Calendar-hendelser og -gjøremål til én tidslinje. Brukes av kalendersiden,
 * dashboardet og "I dag"-siden, slik at de alltid viser det samme bildet av
 * hva som faktisk står i kalenderen — ikke bare de lokale forelesningene.
 *
 * NB: denne filen holdes fri for server-only imports (f.eks. next/headers via
 * google-calendar.ts/supabase), fordi kalenderens ukevisning er en klientkomponent
 * som importerer typene og fargelogikken herfra. Selve fetchingen ligger i
 * `agenda-fetch.ts`.
 */

export type AgendaCategory = 'lecture' | 'deadline' | 'google';

export interface AgendaItem {
  id: string;
  start: Date;
  end: Date;
  title: string;
  category: AgendaCategory;
  color?: string;
  meta?: string;
}

const CATEGORY_COLOR: Record<'lecture' | 'deadline', string> = {
  lecture: '#3F5B87',
  deadline: '#B5651D',
};

export function itemColor(item: AgendaItem): string {
  if (item.color) return item.color;
  if (item.category === 'lecture') return CATEGORY_COLOR.lecture;
  if (item.category === 'deadline') return CATEGORY_COLOR.deadline;
  return '#6B6B6E';
}

/**
 * Ren, synkron sammenslåing — tar allerede hentet data og bygger agenda-elementer.
 * Ingen fetching her, så sider som allerede har hentet forelesninger/frister
 * (f.eks. for annen logikk) slipper å hente dem på nytt.
 */
export function buildAgendaItems({
  lectures,
  assignments,
  googleEvents,
  googleTasks,
}: {
  lectures: Lecture[];
  assignments: Assignment[];
  googleEvents: GoogleEvent[];
  googleTasks: GoogleTask[];
}): { items: AgendaItem[]; tasksWithoutDue: GoogleTask[] } {
  const items: AgendaItem[] = [
    ...lectures.map((l) => {
      const start = new Date(l.scheduledAt);
      return {
        id: l.id,
        start,
        end: new Date(start.getTime() + (l.durationMinutes ?? 105) * 60000),
        title: `${l.courseCode} — ${l.title}`,
        category: 'lecture' as const,
        meta: l.room,
      };
    }),
    ...assignments.map((a) => {
      const start = new Date(a.dueAt);
      return {
        id: a.id,
        start,
        end: new Date(start.getTime() + 30 * 60000),
        title: `${a.courseCode} — ${a.title} (frist)`,
        category: 'deadline' as const,
      };
    }),
    ...googleEvents.map((e) => {
      const start = new Date(e.start);
      const end = e.end ? new Date(e.end) : new Date(start.getTime() + 60 * 60000);
      return {
        id: e.id,
        start,
        end,
        title: e.title,
        category: 'google' as const,
        color: e.color,
        meta: e.location,
      };
    }),
  ];

  // Gjøremål med frist vises også i tidslinjen; de uten frist returneres separat.
  const tasksWithDue = googleTasks.filter((t) => t.due);
  const tasksWithoutDue = googleTasks.filter((t) => !t.due);
  tasksWithDue.forEach((t) => {
    const start = new Date(t.due as string);
    items.push({
      id: `task-${t.id}`,
      start,
      end: new Date(start.getTime() + 30 * 60000),
      title: `✓ ${t.title}`,
      category: 'google',
      color: '#6E5A94',
    });
  });

  return { items, tasksWithoutDue };
}
