import { NextResponse } from 'next/server';
import { DEMO_MODE } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'course-documents';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (DEMO_MODE) {
    return NextResponse.redirect(new URL('/library?library_error=demo_mode', req.url));
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', params.id)
    .maybeSingle();

  if (doc?.storage_path) {
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  }
  await supabase.from('documents').delete().eq('id', params.id);

  return NextResponse.redirect(new URL('/library?deleted=1', req.url));
}
