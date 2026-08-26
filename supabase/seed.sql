-- Demo-data. Alt merket is_demo = true slik at det er trygt å slette senere:
-- delete from courses where is_demo = true;  (cascader til resten via FK)
--
-- Bytt ut :demo_user_id med din faktiske auth.users.id før kjøring,
-- eller kjør via Supabase SQL editor logget inn som deg.

insert into public.courses (id, user_id, code, name, semester, exam_date, credits, is_demo)
values
  ('00000000-0000-0000-0000-000000000001', :'demo_user_id', 'TDT4172', 'Introduksjon til maskinlæring', 'Høst 2026', '2026-12-02', 7.5, true),
  ('00000000-0000-0000-0000-000000000002', :'demo_user_id', 'TDT4117', 'Informasjonsteknologi, grunnkurs', 'Høst 2026', '2026-12-10', 7.5, true);

insert into public.topics (course_id, name, mastery, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Introduction', 'masters', 1),
  ('00000000-0000-0000-0000-000000000001', 'Linear Regression', 'understands', 2),
  ('00000000-0000-0000-0000-000000000001', 'Logistic Regression', 'learning', 3),
  ('00000000-0000-0000-0000-000000000001', 'Classification', 'not_started', 4),
  ('00000000-0000-0000-0000-000000000001', 'Decision Trees', 'not_started', 5);

insert into public.lectures (course_id, title, scheduled_at, prep_instructions, prep_minutes, learning_goals, status) values
  ('00000000-0000-0000-0000-000000000001', 'Logistic Regression', now() + interval '1 day' + interval '10 hours 15 minutes',
   'Les kapittel 4.1-4.3 og repeter sigmoid-funksjonen', 40,
   array['Forklare forskjellen på input og target','Forstå logistic regression intuitivt','Vite hva en loss function er'],
   'upcoming'),
  ('00000000-0000-0000-0000-000000000001', 'Linear Regression', now() - interval '6 days' + interval '10 hours 15 minutes',
   'Les kapittel 2.1-2.4', 45, array['Forstå lineær regresjon'], 'done');

insert into public.assignments (course_id, title, due_at, difficulty, status) values
  ('00000000-0000-0000-0000-000000000001', 'Øving 2', now() + interval '8 days', 'medium', 'not_started'),
  ('00000000-0000-0000-0000-000000000002', 'Exercise 1', now() + interval '11 days', 'easy', 'started');

insert into public.exams (course_id, exam_date) values
  ('00000000-0000-0000-0000-000000000001', '2026-12-02'),
  ('00000000-0000-0000-0000-000000000002', '2026-12-10');

insert into public.study_progress (user_id, course_id, curriculum_pct, lectures_done, lectures_total, assignments_done, assignments_total, topics_mastered, topics_total)
values
  (:'demo_user_id', '00000000-0000-0000-0000-000000000001', 32, 6, 14, 1, 6, 1, 21),
  (:'demo_user_id', '00000000-0000-0000-0000-000000000002', 18, 3, 12, 1, 6, 1, 15);
