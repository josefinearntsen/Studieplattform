import { getCourses } from '@/lib/data';
import { Card, SectionTitle, Badge } from '@/components/ui';

const modes = [
  'Forklar tema',
  'Quiz meg',
  'Flashcards',
  'Active recall',
  'Feynman-teknikk',
  'Eksamenstrening',
];

export default async function StudyPage() {
  const courses = await getCourses();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Study Mode</h1>
        <p className="text-sm text-muted">Velg fag og tema, og hvordan du vil øve.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {courses.map((c) => (
          <Card key={c.id}>
            <p className="font-medium">{c.code}</p>
            <p className="mb-3 text-sm text-muted">{c.name}</p>
            <div className="flex flex-wrap gap-2">
              {modes.map((m) => (
                <Badge key={m} tone="accent">
                  {m}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle>Om Study Mode</SectionTitle>
        <p className="text-sm text-muted">
          Quiz, flashcards og active recall genereres av AI basert på opplastede slides og
          pensum for faget/temaet du velger (se Library). Dette kobles til AI-laget når
          ANTHROPIC_API_KEY eller OPENAI_API_KEY er satt — se README.
        </p>
      </Card>
    </div>
  );
}
