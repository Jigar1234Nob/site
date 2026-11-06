-- Repeatable staff assessments: preserve each test version and score every attempt.
-- Run after migrations 001-004. Safe to re-run.
begin;
alter table public.form_submissions
  add column if not exists assessment_version integer not null default 1,
  add column if not exists assessment_definition jsonb not null default '{}'::jsonb,
  add column if not exists assessment_score integer,
  add column if not exists recommended_role text,
  add column if not exists assessment_feedback text;
alter table public.form_submissions drop constraint if exists form_submissions_assessment_score_check;
alter table public.form_submissions add constraint form_submissions_assessment_score_check check (assessment_score is null or assessment_score between 0 and 100);
update public.form_submissions s
set assessment_definition=f.definition,
    assessment_version=coalesce(nullif(f.definition->>'version','')::integer,1)
from public.forms f
where s.form_id=f.id and (s.assessment_definition='{}'::jsonb or s.assessment_definition is null);
create index if not exists idx_form_submissions_applicant_email_attempt on public.form_submissions (lower(applicant_email),submitted_at desc);
create index if not exists idx_form_submissions_assessment_score on public.form_submissions (assessment_score);
grant select, update on public.form_submissions to authenticated;
commit;
