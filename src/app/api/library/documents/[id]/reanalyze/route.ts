import { NextResponse } from 'next/server';
import { DEMO_MODE } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { runAnalysis } from '@/lib/documents';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (DEMO_MODE) {
    return NextResponse.redirect(new URL('/library?library_error=demo_mode', req.url));
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  try {
    await runAnalysis(params.id);
  } catch (err) {
    console.error('Document re-analysis error:', err);
  }

  return NextResponse.redirect(new URL('/library?reanalyzed=1', req.url));
}
