import Link from 'next/link';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getCourses, getLectures, getAssignments } from '@/lib/data';
import { getUpcomingDeadlines, getUpcomingLectures } from '@/lib/study-logic';
import { Card, ProgressBar, SectionTitle } from '@/components/ui';

export default async function CoursesPage() {
  const [courses, lectures, assignments] = await Promise.all([
    getCourses(),
    getLectures(),
    getAssignments(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mine fag</h1>
          <p className="text-sm text-muted">Oversikt over alle fagene dine dette semesteret.</p>
        </div>
        <Link
          href="/courses/new"
          className="rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-white hover:bg-black"
        >
          + Legg til fag
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => {
          const nextLecture = getUpcomingLectures(
            lectures.filter((l) => l.courseCode === c.code),
            1
          )[0];
          const nextDeadline = getUpcomingDeadlines(
            assignments.filter((a) => a.courseCode === c.code),
            1
          )[0];

          return (
            <Link key={c.id} href={`/courses/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{c.code}</p>
                    <p className="text-sm text-muted">{c.name}</p>
                  </div>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>Pensum</span>
                    <span>{c.progress.curriculumPct}%</span>
                  </div>
                  <ProgressBar value={c.progress.curriculumPct} />
                </div>

                <dl className="mt-4 space-y-1 text-sm">
                  {nextLecture && (
                    <div className="flex justify-between">
                      <dt className="text-muted">Neste forelesning</dt>
                      <dd>{nextLecture.title}</dd>
                    </div>
                  )}
                  {nextDeadline && (
                    <div className="flex justify-between">
                      <dt className="text-muted">Neste deadline</dt>
                      <dd>{nextDeadline.title}</dd>
                    </div>
                  )}
                  {c.examDate && (
                    <div className="flex justify-between">
                      <dt className="text-muted">Eksamen</dt>
                      <dd>{format(new Date(c.examDate), 'd. MMMM', { locale: nb })}</dd>
                    </div>
                  )}
                </dl>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
