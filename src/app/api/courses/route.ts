import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

async function tryFetchNtnuInfo(code: string) {
  try {
    const url = `https://www.ntnu.no/studier/emner/${code}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'studieplattform-bot' } });
    if (!res.ok) return { ntnuUrl: url, name: null };
    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const name = titleMatch ? titleMatch[1].split('-')[0].trim() : null;
    return { ntnuUrl: url, name };
  } catch {
    return { ntnuUrl: `https://www.ntnu.no/studier/emner/${code}`, name: null };
  }
}

export async function POST(req: Request) {
  const form = await req.formData();
  const code = String(form.get('code') ?? '').trim().toUpperCase();
  const providedUrl = String(form.get('ntnuUrl') ?? '').trim();

  if (!code) {
    return NextResponse.redirect(new URL('/courses/new', req.url));
  }

  const ntnuInfo = providedUrl
    ? { ntnuUrl: providedUrl, name: null }
    : await tryFetchNtnuInfo(code);

  if (!isSupabaseConfigured()) {
    // Demo-modus: ingen persistering, bare send tilbake til Courses.
    return NextResponse.redirect(new URL('/courses', req.url));
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  await supabase.from('courses').insert({
    user_id: user.id,
    code,
    name: ntnuInfo.name ?? code,
    semester: 'Høst 2026',
    ntnu_url: ntnuInfo.ntnuUrl,
  });

  return NextResponse.redirect(new URL('/courses', req.url));
}
