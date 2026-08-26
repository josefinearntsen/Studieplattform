import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const form = await req.formData();
  const selectedIds = form.getAll('calendarId').map(String);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  await supabase
    .from('user_integrations')
    .update({ google_calendar_ids: selectedIds.length ? selectedIds : ['primary'] })
    .eq('user_id', user.id);

  return NextResponse.redirect(new URL('/settings?calendars_saved=1', req.url));
}
