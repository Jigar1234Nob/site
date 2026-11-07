-- Public forms visibility and submission rules.
-- Open forms appear in the main list and accept responses. Archived forms are view-only.
-- Closed and draft forms are hidden and cannot receive submissions.
begin;

drop policy if exists "forms_read_open_or_admin" on public.forms;
create policy "forms_read_open_or_admin" on public.forms
for select to anon, authenticated
using (
  status in ('open', 'archived')
  or (select public.is_site_admin())
);

drop policy if exists "submissions_insert_open_form" on public.form_submissions;
create policy "submissions_insert_open_form" on public.form_submissions
for insert to anon, authenticated
with check (
  (user_id is null or user_id = (select auth.uid()))
  and status = 'new'
  and reviewed_at is null
  and reviewed_by is null
  and internal_notes is null
  and exists (
    select 1
    from public.forms f
    where f.id = form_id
      and f.status = 'open'
      and (f.allow_anonymous or user_id is not null)
  )
);

grant select on public.forms to anon, authenticated;
grant insert on public.form_submissions to anon, authenticated;

commit;
