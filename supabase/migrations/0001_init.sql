-- Studieplattform: kjerneskjema
-- Kjør med: supabase db push  (eller lim inn i Supabase SQL editor)

create extension if not exists "uuid-ossp";
create extension if not exists vector; -- pgvector, brukes av document_chunks (RAG)

-- ---------- Brukere ----------
-- Supabase Auth eier auth.users. Vi speiler ekstra profil-info her.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  program text default 'Datateknologi - Databaser og søk',
  created_at timestamptz not null default now()
);

-- ---------- Fag ----------
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,                 -- f.eks. TDT4172
  name text not null,
  semester text,
  ntnu_url text,
  canvas_url text,
  credits numeric,
  exam_date date,
  color text default '#3F5B87',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, code, semester)
);

-- Ukentlig undervisningsplan / timeline
create table if not exists public.course_weeks (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  week_number int not null,
  title text not null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','done')),
  sort_order int not null default 0
);

-- ---------- Temaer (knowledge map) ----------
create table if not exists public.topics (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  parent_topic_id uuid references public.topics(id) on delete set null,
  mastery text not null default 'not_started' check (mastery in ('not_started','learning','understands','masters')),
  sort_order int not null default 0
);

-- ---------- Forelesninger ----------
create table if not exists public.lectures (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  scheduled_at timestamptz not null,
  duration_minutes int default 105,
  room text,
  prep_instructions text,           -- "Les kapittel 2.1-2.4, ca 40 min"
  prep_minutes int,
  review_instructions text,         -- anbefalt repetisjon etterpå
  learning_goals text[],
  notes text,
  status text not null default 'upcoming' check (status in ('upcoming','done','skipped')),
  created_at timestamptz not null default now()
);

-- ---------- Pensum / materialer ----------
create table if not exists public.course_materials (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  kind text not null check (kind in ('book','slides','notes','course_plan','other')),
  title text not null,
  author text,
  chapters text,                     -- f.eks. "1-12"
  storage_path text,                 -- Supabase Storage-nøkkel
  linked_lecture_id uuid references public.lectures(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Opplastede dokumenter (for AI-analyse / RAG)
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  doc_type text not null check (doc_type in ('lecture_slides','curriculum','assignment','exam','notes','course_plan','other')),
  title text not null,
  storage_path text not null,
  ai_summary text,
  ai_key_concepts text[],
  ai_learning_goals text[],
  ai_exam_relevance text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Chunks for embeddings/RAG
create table if not exists public.document_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);
create index if not exists document_chunks_embedding_idx
  on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------- Øvinger / assignments ----------
create table if not exists public.assignments (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  published_at date,
  due_at timestamptz not null,
  difficulty text check (difficulty in ('easy','medium','hard')),
  related_topic_ids uuid[] default '{}',
  related_lecture_ids uuid[] default '{}',
  link text,
  notes text,
  status text not null default 'not_started' check (status in ('not_started','started','almost_done','submitted')),
  created_at timestamptz not null default now()
);

-- ---------- Eksamener ----------
create table if not exists public.exams (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  exam_date date not null,
  location text,
  grade_distribution jsonb,          -- fra Karakterweb, hvis lagt inn
  karakterweb_url text
);

-- ---------- Kalenderhendelser (manuelle + importerte) ----------
create table if not exists public.calendar_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  source text not null default 'manual' check (source in ('manual','google','ics','system')),
  external_id text,                  -- id fra Google/ICS for deduplisering
  category text not null check (category in ('lecture','exercise_session','deadline','exam','study_session','other')),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text
);

-- ---------- Studieøkter / progresjon ----------
create table if not exists public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  kind text check (kind in ('reading','flashcards','quiz','active_recall','assignment','review')),
  duration_minutes int,
  completed_at timestamptz not null default now()
);

create table if not exists public.study_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  curriculum_pct numeric default 0,
  lectures_done int default 0,
  lectures_total int default 0,
  assignments_done int default 0,
  assignments_total int default 0,
  topics_mastered int default 0,
  topics_total int default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ---------- Quiz / flashcards / spaced repetition ----------
create table if not exists public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  question text not null,
  options jsonb,                     -- [{id,text}]
  correct_option_id text,
  explanation text,
  source_document_id uuid references public.documents(id) on delete set null
);

create table if not exists public.quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  chosen_option_id text,
  is_correct boolean,
  attempted_at timestamptz not null default now()
);

create table if not exists public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  front text not null,
  back text not null,
  ease text default 'medium' check (ease in ('easy','medium','hard')),
  next_review_at timestamptz not null default now(),
  interval_days int not null default 1
);

-- ---------- AI-chat historikk ----------
create table if not exists public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  source_refs jsonb,                 -- ["TDT4172 Lecture 3 - slides 14-21", ...]
  created_at timestamptz not null default now()
);

-- ---------- Integrasjoner (per bruker) ----------
create table if not exists public.user_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_calendar_connected boolean not null default false,
  google_refresh_token text,
  canvas_url text,
  canvas_api_token text,
  ai_provider text default 'anthropic'
);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_weeks enable row level security;
alter table public.topics enable row level security;
alter table public.lectures enable row level security;
alter table public.course_materials enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.assignments enable row level security;
alter table public.exams enable row level security;
alter table public.calendar_events enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_progress enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.flashcards enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.user_integrations enable row level security;

-- Enkelt mønster: alt er scoped til user_id, direkte eller via courses.user_id
create policy "own profile" on public.profiles for all using (auth.uid() = id);
create policy "own courses" on public.courses for all using (auth.uid() = user_id);
create policy "own course_weeks" on public.course_weeks for all using (
  exists (select 1 from public.courses c where c.id = course_id and c.user_id = auth.uid()));
create policy "own topics" on public.topics for all using (
  exists (select 1 from public.courses c where c.id = topics.course_id and c.user_id = auth.uid()));
create policy "own lectures" on public.lectures for all using (
  exists (select 1 from public.courses c where c.id = lectures.course_id and c.user_id = auth.uid()));
create policy "own materials" on public.course_materials for all using (
  exists (select 1 from public.courses c where c.id = course_materials.course_id and c.user_id = auth.uid()));
create policy "own documents" on public.documents for all using (auth.uid() = uploaded_by);
create policy "own chunks" on public.document_chunks for all using (
  exists (select 1 from public.documents d where d.id = document_id and d.uploaded_by = auth.uid()));
create policy "own assignments" on public.assignments for all using (
  exists (select 1 from public.courses c where c.id = assignments.course_id and c.user_id = auth.uid()));
create policy "own exams" on public.exams for all using (
  exists (select 1 from public.courses c where c.id = exams.course_id and c.user_id = auth.uid()));
create policy "own calendar_events" on public.calendar_events for all using (auth.uid() = user_id);
create policy "own study_sessions" on public.study_sessions for all using (auth.uid() = user_id);
create policy "own study_progress" on public.study_progress for all using (auth.uid() = user_id);
create policy "own quiz_questions" on public.quiz_questions for all using (
  exists (select 1 from public.courses c where c.id = quiz_questions.course_id and c.user_id = auth.uid()));
create policy "own quiz_attempts" on public.quiz_attempts for all using (auth.uid() = user_id);
create policy "own flashcards" on public.flashcards for all using (
  exists (select 1 from public.courses c where c.id = flashcards.course_id and c.user_id = auth.uid()));
create policy "own ai_conversations" on public.ai_conversations for all using (auth.uid() = user_id);
create policy "own integrations" on public.user_integrations for all using (auth.uid() = user_id);
