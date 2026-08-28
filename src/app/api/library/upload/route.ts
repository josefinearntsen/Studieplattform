import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { DEMO_MODE } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { runAnalysis } from '@/lib/documents';
import type { DocumentType } from '@/lib/types';

const BUCKET = 'course-documents';
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const DOC_TYPES: DocumentType[] = [
  'lecture_slides',
  'curriculum',
  'assignment',
  'exam',
  'notes',
  'course_plan',
  'other',
];

export async function POST(req: Request) {
  if (DEMO_MODE) {
    return NextResponse.redirect(new URL('/library?library_error=demo_mode', req.url));
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const form = await req.formData();
  const courseId = String(form.get('courseId') ?? '').trim();
  const docTypeRaw = String(form.get('docType') ?? '').trim();
  const title = String(form.get('title') ?? '').trim();
  const file = form.get('file');

  const docType = DOC_TYPES.includes(docTypeRaw as DocumentType)
    ? (docTypeRaw as DocumentType)
    : 'other';

  if (!courseId || !(file instanceof File) || file.size === 0) {
    return NextResponse.redirect(new URL('/library?library_error=missing_fields', req.url));
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.redirect(new URL('/library?library_error=file_too_large', req.url));
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const storagePath = `${user.id}/${courseId}/${randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) {
    console.error('Document upload error:', uploadError);
    return NextResponse.redirect(new URL('/library?library_error=upload_failed', req.url));
  }

  const { data: inserted, error: insertError } = await supabase
    .from('documents')
    .insert({
      course_id: courseId,
      uploaded_by: user.id,
      doc_type: docType,
      title: title || file.name,
      storage_path: storagePath,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.error('Document insert error:', insertError);
    return NextResponse.redirect(new URL('/library?library_error=upload_failed', req.url));
  }

  // Analyse kjøres synkront her — feiler den (f.eks. NTNU-LLM-et er utilgjengelig
  // utenfor NTNU-nett), lander dokumentet bare med status 'error' og kan
  // analyseres på nytt senere. Selve opplastingen har uansett lyktes.
  try {
    await runAnalysis(inserted.id);
  } catch (err) {
    console.error('Document analysis error:', err);
  }

  return NextResponse.redirect(new URL('/library?uploaded=1', req.url));
}
