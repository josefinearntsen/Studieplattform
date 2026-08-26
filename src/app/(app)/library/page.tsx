import { getCourses } from '@/lib/data';
import { Card, SectionTitle } from '@/components/ui';

export default async function LibraryPage() {
  const courses = await getCourses();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Library</h1>
        <p className="text-sm text-muted">
          Last opp pensum, slides og undervisningsplaner. Filer lagres i Supabase Storage og
          analyseres automatisk av AI-laget.
        </p>
      </header>

      <Card className="border-dashed">
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <p className="font-medium">Dra og slipp filer her</p>
          <p className="text-sm text-muted">PDF, PowerPoint, tekst eller Word — velg fag og type etterpå.</p>
        </div>
      </Card>

      <Card>
        <SectionTitle>Fag</SectionTitle>
        <ul className="divide-y divide-line">
          {courses.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3 text-sm">
              <span className="font-medium">{c.code}</span>
              <span className="text-muted">Ingen filer lastet opp ennå</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
