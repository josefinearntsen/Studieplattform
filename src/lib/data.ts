import { isSupabaseConfigured, createClient } from './supabase/server';
import { demoAssignments, demoCourses, demoExams, demoLectures, demoTopics } from './demo-data';
import type { Assignment, Course, CourseDocument, Exam, Lecture, Topic } from './types';

/**
 * Denne modulen er det ENESTE stedet sidene henter data fra.
 * - Uten Supabase-credentials: returnerer demo-data (appen fungerer fullt ut).
 * - Med Supabase-credentials: henter ekte data for innlogget bruker.
 *
 * Når du kobler til Supabase (se README), bytter appen automatisk
 * til ekte data uten kodeendringer.
 */

export const DEMO_MODE = !isSupabaseConfigured();

export async function getCourses(): Promise<Course[]> {
  if (DEMO_MODE) return demoCourses;

  const supabase = createClient();
  const { data: courses } = await supabase.from('courses').select('*');
  const { data: progress } = await supabase.from('study_progress').select('*');

  return (courses ?? []).map((c: any) => {
    const p = (progress ?? []).find((p: any) => p.course_id === c.id);
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      semester: c.semester,
      examDate: c.exam_date,
      ntnuUrl: c.ntnu_url,
      canvasUrl: c.canvas_url,
      color: c.color,
      progress: {
        curriculumPct: p?.curriculum_pct ?? 0,
        lecturesDone: p?.lectures_done ?? 0,
        lecturesTotal: p?.lectures_total ?? 0,
        assignmentsDone: p?.assignments_done ?? 0,
        assignmentsTotal: p?.assignments_total ?? 0,
        topicsMastered: p?.topics_mastered ?? 0,
        topicsTotal: p?.topics_total ?? 0,
      },
    };
  });
}

export async function getLectures(): Promise<Lecture[]> {
  if (DEMO_MODE) return demoLectures;

  const supabase = createClient();
  const { data } = await supabase
    .from('lectures')
    .select('*, courses(code)')
    .order('scheduled_at', { ascending: true });

  return (data ?? []).map((l: any) => ({
    id: l.id,
    courseId: l.course_id,
    courseCode: l.courses?.code ?? '',
    title: l.title,
    scheduledAt: l.scheduled_at,
    durationMinutes: l.duration_minutes ?? 105,
    room: l.room,
    prepInstructions: l.prep_instructions,
    prepMinutes: l.prep_minutes,
    learningGoals: l.learning_goals ?? [],
    status: l.status,
  }));
}

export async function getAssignments(): Promise<Assignment[]> {
  if (DEMO_MODE) return demoAssignments;

  const supabase = createClient();
  const { data } = await supabase
    .from('assignments')
    .select('*, courses(code)')
    .order('due_at', { ascending: true });

  return (data ?? []).map((a: any) => ({
    id: a.id,
    courseId: a.course_id,
    courseCode: a.courses?.code ?? '',
    title: a.title,
    dueAt: a.due_at,
    difficulty: a.difficulty,
    status: a.status,
    relatedTopics: [], // beriket via related_topic_ids + topics-tabell ved behov
  }));
}

export async function getExams(): Promise<Exam[]> {
  if (DEMO_MODE) return demoExams;

  const supabase = createClient();
  const { data } = await supabase.from('exams').select('*, courses(code)');

  return (data ?? []).map((e: any) => ({
    id: e.id,
    courseId: e.course_id,
    courseCode: e.courses?.code ?? '',
    examDate: e.exam_date,
  }));
}

/**
 * Opplastede pensum-/undervisningsplandokumenter og AI-analysen av dem.
 * Uten Supabase (demo-modus) finnes ingen opplasting, så tom liste returneres.
 */
export async function getDocuments(courseId?: string): Promise<CourseDocument[]> {
  if (DEMO_MODE) return [];

  const supabase = createClient();
  let query = supabase
    .from('documents')
    .select('*, courses(code)')
    .order('created_at', { ascending: false });
  if (courseId) query = query.eq('course_id', courseId);

  const { data } = await query;

  return (data ?? []).map((d: any) => ({
    id: d.id,
    courseId: d.course_id,
    courseCode: d.courses?.code ?? '',
    docType: d.doc_type,
    title: d.title,
    storagePath: d.storage_path,
    status: d.status,
    errorMessage: d.error_message,
    aiSummary: d.ai_summary,
    aiKeyConcepts: d.ai_key_concepts ?? [],
    aiExamRelevance: d.ai_exam_relevance,
    processedAt: d.processed_at,
    createdAt: d.created_at,
  }));
}

export async function getTopics(courseId: string): Promise<Topic[]> {
  if (DEMO_MODE) return demoTopics.filter((t) => t.courseId === courseId);

  const supabase = createClient();
  const { data } = await supabase.from('topics').select('*').eq('course_id', courseId);

  return (data ?? []).map((t: any) => ({
    id: t.id,
    courseId: t.course_id,
    name: t.name,
    mastery: t.mastery,
  }));
}
