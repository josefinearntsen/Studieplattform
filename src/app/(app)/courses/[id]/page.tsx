import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { getAssignments, getCourses, getLectures, getTopics } from '@/lib/data';
import { Badge, Card, ProgressBar, SectionTitle } from '@/components/ui';

const masteryTone = {
  not_started: 'neutral',
  learning: 'warn',
  understands: 'accent',
  masters: 'good',
} as const;

const masteryLabel = {
  not_started: 'Ikke startet',
  learning: 'Lærer',
  understands: 'Forstår',
  masters: 'Behersker',
} as const;

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const [courses, lectures, assignments, topics] = await Promise.all([
    getCourses(),
    getLectures(),
    getAssignments(),
    getTopics(params.id),
  ]);

  const course = courses.find((c) => c.id === params.id);
  if (!course) notFound();

  const courseLectures = lectures.filter((l) => l.courseCode === course.code);
  const courseAssignments = assignments.filter((a) => a.courseCode === course.code);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted">{course.code}</p>
        <h1 className="text-2xl font-semibold">{course.name}</h1>
        <div className="mt-2 flex gap-4 text-sm text-muted">
          {course.examDate && (
            <span>Eksamen: {format(new Date(course.examDate), 'd. MMMM yyyy', { locale: nb })}</span>
          )}
          {course.ntnuUrl && (
            <a href={course.ntnuUrl} target="_blank" className="text-accent">
              NTNU emneside ↗
            </a>
          )}
          {course.canvasUrl && (
            <a href={course.canvasUrl} target="_blank" className="text-accent">
              Canvas ↗
            </a>
          )}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-muted">Pensum</p>
          <p className="mt-1 text-xl font-semibold">{course.progress.curriculumPct}%</p>
          <ProgressBar value={course.progress.curriculumPct} />
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted">Forelesninger</p>
          <p className="mt-1 text-xl font-semibold">
            {course.progress.lecturesDone} / {course.progress.lecturesTotal}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-muted">Øvinger</p>
          <p className="mt-1 text-xl font-semibold">
            {course.progress.assignmentsDone} / {course.progress.assignmentsTotal}
          </p>
        </Card>
      </div>

      {/* Knowledge map */}
      <Card>
        <SectionTitle>Temaer (knowledge map)</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <Badge key={t.id} tone={masteryTone[t.mastery]}>
              {t.name} · {masteryLabel[t.mastery]}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Forelesninger */}
      <Card>
        <SectionTitle>Forelesninger</SectionTitle>
        <ul className="divide-y divide-line">
          {courseLectures.map((l) => (
            <li key={l.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{l.title}</p>
                {l.prepInstructions && <p className="text-muted">{l.prepInstructions}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted">
                  {format(new Date(l.scheduledAt), 'd. MMM, HH:mm', { locale: nb })}
                </span>
                <Badge tone={l.status === 'done' ? 'good' : 'accent'}>
                  {l.status === 'done' ? 'Gjennomført' : 'Kommende'}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Øvinger */}
      <Card>
        <SectionTitle>Øvinger</SectionTitle>
        <ul className="divide-y divide-line">
          {courseAssignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{a.title}</p>
                {a.relatedTopics.length > 0 && (
                  <p className="text-muted">Krever: {a.relatedTopics.join(', ')}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted">
                  Frist: {format(new Date(a.dueAt), 'd. MMM', { locale: nb })}
                </span>
                <Badge tone="neutral">{a.status.replace('_', ' ')}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
