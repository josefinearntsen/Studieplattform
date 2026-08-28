// NB: importeres fra undermappen, ikke pakkeroten — pdf-parses eget index.js har
// et "er dette kjørt direkte som debug-script"-sjekk (`!module.parent`) som feiler
// under webpack-bundling (Next.js) og prøver å lese en test-PDF ved import-tid.
// lib/pdf-parse.js er selve implementasjonen uten den sjekken.
import PdfParse from 'pdf-parse/lib/pdf-parse.js';
import { createClient } from './supabase/server';
import { completeChat } from './ai/provider';

/**
 * Pipeline: opplastet dokument → tekstuttrekk → AI-analyse → skriv resultatet
 * tilbake til `documents` (sammendrag/nøkkelbegreper) og — når dokumentet ser ut
 * som en uke-for-uke undervisningsplan — til `lectures.prep_instructions` m.fl.
 * for de neste kommende forelesningene i faget. Server-only.
 */

const BUCKET = 'course-documents';
const MAX_CHARS = 12000; // trygt tegnbudsjett for prompten; lange lærebøker kappes

interface AnalysisSession {
  topic: string;
  prepInstructions: string;
  prepMinutes?: number;
  learningGoals: string[];
}

interface AnalysisResult {
  summary: string;
  keyConcepts: string[];
  examRelevance: string;
  sessions: AnalysisSession[];
}

function extractionKind(filename: string): 'pdf' | 'text' {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt' || ext === 'md' || ext === 'markdown') return 'text';
  throw new Error(`Filtypen ".${ext}" støttes ikke ennå (kun PDF, .txt og .md).`);
}

async function extractText(blob: Blob, filename: string): Promise<string> {
  const kind = extractionKind(filename);
  if (kind === 'text') return await blob.text();

  const buffer = Buffer.from(await blob.arrayBuffer());
  const parsed = await PdfParse(buffer);
  return parsed.text;
}

function parseAiJson(raw: string): AnalysisResult {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI-svaret var ikke gyldig JSON — prøv å analysere på nytt.');
  }

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    keyConcepts: Array.isArray(parsed.keyConcepts)
      ? parsed.keyConcepts.filter((x: unknown) => typeof x === 'string')
      : [],
    examRelevance: typeof parsed.examRelevance === 'string' ? parsed.examRelevance : '',
    sessions: Array.isArray(parsed.sessions)
      ? parsed.sessions
          .filter((s: any) => s && typeof s.topic === 'string')
          .map((s: any) => ({
            topic: s.topic,
            prepInstructions: typeof s.prepInstructions === 'string' ? s.prepInstructions : '',
            prepMinutes: typeof s.prepMinutes === 'number' ? s.prepMinutes : undefined,
            learningGoals: Array.isArray(s.learningGoals)
              ? s.learningGoals.filter((x: unknown) => typeof x === 'string')
              : [],
          }))
      : [],
  };
}

async function analyzeWithAi(text: string, courseLabel: string): Promise<AnalysisResult> {
  const truncated =
    text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n…[avkortet]` : text;

  const { text: raw } = await completeChat([
    {
      role: 'system',
      content:
        'Du analyserer pensum og undervisningsplaner for universitetsemner. ' +
        'Svar KUN med gyldig JSON — ingen markdown-fences, ingen forklaringstekst utenfor JSON-en. Format:\n' +
        '{"summary": string, "keyConcepts": string[], "examRelevance": string, ' +
        '"sessions": [{"topic": string, "prepInstructions": string, "prepMinutes": number, "learningGoals": string[]}]}\n\n' +
        '"sessions" skal ha én oppføring per forelesning/uke i planen, i kronologisk rekkefølge, ' +
        'KUN hvis dokumentet faktisk er en uke-for-uke undervisningsplan. Er det i stedet f.eks. et ' +
        'eksamensoppgavesett eller et enkeltstående notat uten en slik struktur, returner en tom liste ' +
        'for "sessions" i stedet for å gjette.',
    },
    {
      role: 'user',
      content: `Fag: ${courseLabel}\n\nDokumentinnhold:\n${truncated}`,
    },
  ]);

  return parseAiJson(raw);
}

export async function runAnalysis(documentId: string): Promise<void> {
  const supabase = createClient();

  const { data: doc } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .maybeSingle();
  if (!doc) throw new Error('Dokumentet finnes ikke.');

  await supabase
    .from('documents')
    .update({ status: 'processing', error_message: null })
    .eq('id', documentId);

  try {
    const { data: course } = await supabase
      .from('courses')
      .select('id, code, name')
      .eq('id', doc.course_id)
      .maybeSingle();

    const { data: blob, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(doc.storage_path);
    if (downloadError || !blob) {
      throw new Error(downloadError?.message ?? 'Klarte ikke å laste ned filen fra Storage.');
    }

    const filename = doc.storage_path.split('/').pop() ?? doc.title;
    const text = await extractText(blob, filename);
    if (!text.trim()) throw new Error('Fant ingen tekst i dokumentet.');

    const courseLabel = course ? `${course.code} — ${course.name}` : doc.title;
    const result = await analyzeWithAi(text, courseLabel);

    await supabase
      .from('documents')
      .update({
        status: 'done',
        error_message: null,
        ai_summary: result.summary || null,
        ai_key_concepts: result.keyConcepts,
        ai_exam_relevance: result.examRelevance || null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Match sesjoner i planen mot kommende forelesninger i kronologisk rekkefølge
    // og fyll inn forberedelse automatisk — dette er det Today/Dashboard/kalenderen
    // allerede viser fram (lectures.prep_instructions m.fl.), så det dukker opp
    // der uten videre kode-endringer.
    if (result.sessions.length > 0 && doc.course_id) {
      const { data: upcomingLectures } = await supabase
        .from('lectures')
        .select('id, scheduled_at')
        .eq('course_id', doc.course_id)
        .eq('status', 'upcoming')
        .order('scheduled_at', { ascending: true });

      const pairCount = Math.min(result.sessions.length, upcomingLectures?.length ?? 0);
      for (let i = 0; i < pairCount; i++) {
        const session = result.sessions[i];
        const lecture = upcomingLectures![i];
        await supabase
          .from('lectures')
          .update({
            prep_instructions: session.prepInstructions || null,
            prep_minutes: session.prepMinutes ?? null,
            learning_goals: session.learningGoals,
          })
          .eq('id', lecture.id);
      }
    }
  } catch (err: any) {
    await supabase
      .from('documents')
      .update({ status: 'error', error_message: String(err?.message ?? err) })
      .eq('id', documentId);
    throw err;
  }
}
