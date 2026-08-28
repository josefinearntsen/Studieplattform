import { getAssignments, getLectures, DEMO_MODE } from './data';
import {
  getGoogleCalendarEvents,
  getGoogleTasks,
  isGoogleCalendarConnected,
  type GoogleTask,
} from './google-calendar';
import { buildAgendaItems, type AgendaItem } from './agenda';

/**
 * Henter og bygger agenda-elementer for et gitt tidsrom, inkl. Google Calendar
 * (hendelser + gjøremål) hvis brukeren er koblet til. Server-only (bruker
 * next/headers via Supabase) — importeres kun fra Server Components.
 */
export async function getAgenda(range?: { timeMin: Date; timeMax: Date }): Promise<{
  items: AgendaItem[];
  tasksWithoutDue: GoogleTask[];
  googleConnected: boolean;
}> {
  const [lectures, assignments, googleEvents, googleTasks, googleConnected] = await Promise.all([
    getLectures(),
    getAssignments(),
    DEMO_MODE ? Promise.resolve([]) : getGoogleCalendarEvents(range),
    DEMO_MODE ? Promise.resolve([]) : getGoogleTasks(),
    DEMO_MODE ? Promise.resolve(false) : isGoogleCalendarConnected(),
  ]);

  const { items, tasksWithoutDue } = buildAgendaItems({
    lectures,
    assignments,
    googleEvents,
    googleTasks,
  });

  return { items, tasksWithoutDue, googleConnected };
}
