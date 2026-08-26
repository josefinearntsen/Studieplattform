import { differenceInCalendarDays, isToday, isTomorrow } from 'date-fns';
import type { Assignment, Course, Exam, Lecture, WeekFocusItem } from './types';

/**
 * Ren, deterministisk logikk (ingen AI-magi) for anbefalinger.
 * AI brukes senere kun til å *generere innhold* (prep-tekst, quiz),
 * ikke til å bestemme prioritering — det bestemmes av faktiske data.
 */

export function getTodayLectures(lectures: Lecture[]): Lecture[] {
  return lectures
    .filter((l) => isToday(new Date(l.scheduledAt)) && l.status !== 'skipped')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export function getUpcomingLectures(lectures: Lecture[], limit = 5): Lecture[] {
  const nowTs = Date.now();
  return lectures
    .filter((l) => new Date(l.scheduledAt).getTime() >= nowTs && l.status === 'upcoming')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, limit);
}

export function getUpcomingDeadlines(assignments: Assignment[], limit = 10): Assignment[] {
  return assignments
    .filter((a) => a.status !== 'submitted')
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, limit);
}

export function daysUntil(dateIso: string): number {
  return differenceInCalendarDays(new Date(dateIso), new Date());
}

export function isDueSoon(a: Assignment, withinDays = 10): boolean {
  return daysUntil(a.dueAt) <= withinDays && daysUntil(a.dueAt) >= 0;
}

export function isTomorrowLecture(l: Lecture): boolean {
  return isTomorrow(new Date(l.scheduledAt));
}

/**
 * Eksamensfase (pkt. 20 i spec): styrer hvordan anbefalinger vinkles
 * etter hvor mange uker det er igjen til eksamen.
 */
export type ExamPhase = 'far' | 'review_start' | 'quiz_heavy' | 'final_sprint';

export function getExamPhase(examDateIso: string | null): ExamPhase {
  if (!examDateIso) return 'far';
  const days = daysUntil(examDateIso);
  const weeks = days / 7;
  if (weeks > 8) return 'far';
  if (weeks > 4) return 'review_start';
  if (weeks > 2) return 'quiz_heavy';
  return 'final_sprint';
}

export function examPhaseLabel(phase: ExamPhase): string {
  switch (phase) {
    case 'far':
      return 'Fokus på forelesninger og forståelse';
    case 'review_start':
      return 'Begynn repetisjon';
    case 'quiz_heavy':
      return 'Mer quiz og oppgavetrening';
    case 'final_sprint':
      return 'Eksamenstrening og svakheter';
  }
}

/**
 * Ukens anbefalte fokus (pkt. "Denne uken") — enkel, forklarbar scoring:
 * poeng for forelesning i morgen/denne uken, deadline nær, lav progresjon,
 * og eksamensfase.
 */
export function computeWeeklyFocus(
  courses: Course[],
  lectures: Lecture[],
  assignments: Assignment[]
): WeekFocusItem[] {
  const scored = courses.map((course) => {
    let score = 0;
    const reasons: string[] = [];

    const courseLectures = lectures.filter((l) => l.courseCode === course.code);
    const hasLectureSoon = courseLectures.some((l) => {
      const d = daysUntil(l.scheduledAt);
      return d >= 0 && d <= 3;
    });
    if (hasLectureSoon) {
      score += 3;
      reasons.push('forelesning kommende dager');
    }

    const courseDeadlines = assignments.filter((a) => a.courseCode === course.code);
    const nearDeadline = courseDeadlines.find((a) => isDueSoon(a, 10));
    if (nearDeadline) {
      score += 4;
      reasons.push(`${nearDeadline.title} har frist om ${daysUntil(nearDeadline.dueAt)} dager`);
    }

    if (course.progress.curriculumPct < 25) {
      score += 2;
      reasons.push('lav pensumprogresjon');
    }

    const phase = getExamPhase(course.examDate);
    if (phase === 'quiz_heavy' || phase === 'final_sprint') {
      score += 3;
      reasons.push('eksamen nærmer seg');
    }

    return {
      courseCode: course.code,
      reason: reasons.join(', ') || 'rutinemessig fremdrift',
      priority: score,
    };
  });

  return scored.sort((a, b) => b.priority - a.priority);
}

/**
 * Genererer teksten til hovedanbefalingen ("Du har X i morgen...").
 * Dette er den strukturerte kjernen — AI-laget (senere) kan style/utvide
 * teksten, men selve fakta-grunnlaget kommer herfra, ikke fra en prompt.
 */
export interface NextActionBrief {
  headline: string;
  lecture?: Lecture;
  prepSteps: string[];
  relatedAssignment?: Assignment;
}

export function buildNextActionBrief(
  lectures: Lecture[],
  assignments: Assignment[]
): NextActionBrief | null {
  const upcoming = getUpcomingLectures(lectures, 1)[0];
  if (!upcoming) return null;

  const when = isTomorrow(new Date(upcoming.scheduledAt)) ? 'i morgen' : 'snart';
  const time = new Date(upcoming.scheduledAt).toLocaleTimeString('no-NO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const prepSteps: string[] = [];
  if (upcoming.prepInstructions) prepSteps.push(upcoming.prepInstructions);
  if (upcoming.prepMinutes) prepSteps.push(`Sett av ca. ${upcoming.prepMinutes} minutter`);

  const related = assignments.find(
    (a) =>
      a.courseCode === upcoming.courseCode &&
      a.relatedTopics.some((t) => upcoming.title.toLowerCase().includes(t.toLowerCase().split(' ')[0]))
  );

  return {
    headline: `Du har ${upcoming.courseCode} ${when} kl. ${time} — tema: ${upcoming.title}`,
    lecture: upcoming,
    prepSteps,
    relatedAssignment: related,
  };
}
