import { getAssignments, getCourses, getLectures } from '@/lib/data';
import { Card, SectionTitle } from '@/components/ui';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? '').toLowerCase().trim();
  const [courses, lectures, assignments] = await Promise.all([
    getCourses(),
    getLectures(),
    getAssignments(),
  ]);

  const matchedCourses = q ? courses.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) : [];
  const matchedLectures = q ? lectures.filter((l) => l.title.toLowerCase().includes(q)) : [];
  const matchedAssignments = q ? assignments.filter((a) => a.title.toLowerCase().includes(q)) : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Søk</h1>
        <form className="mt-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Søk på tvers av fag, forelesninger og øvinger…"
            className="w-full max-w-lg rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </form>
      </header>

      {q && (
        <div className="space-y-4">
          <Card>
            <SectionTitle>Fag</SectionTitle>
            {matchedCourses.length === 0 ? (
              <p className="text-sm text-muted">Ingen treff</p>
            ) : (
              matchedCourses.map((c) => <p key={c.id} className="text-sm">{c.code} — {c.name}</p>)
            )}
          </Card>
          <Card>
            <SectionTitle>Forelesninger</SectionTitle>
            {matchedLectures.length === 0 ? (
              <p className="text-sm text-muted">Ingen treff</p>
            ) : (
              matchedLectures.map((l) => <p key={l.id} className="text-sm">{l.courseCode} — {l.title}</p>)
            )}
          </Card>
          <Card>
            <SectionTitle>Øvinger</SectionTitle>
            {matchedAssignments.length === 0 ? (
              <p className="text-sm text-muted">Ingen treff</p>
            ) : (
              matchedAssignments.map((a) => <p key={a.id} className="text-sm">{a.courseCode} — {a.title}</p>)
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
