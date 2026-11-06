-- Repair/standardise form management permissions.
-- Safe to run whether or not the original policy is already present.
begin;

alter table public.forms enable row level security;

drop policy if exists "forms_manage_admin" on public.forms;
create policy "forms_manage_admin"
on public.forms
for all
to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

grant select on public.forms to anon, authenticated;
grant insert, update, delete on public.forms to authenticated;

commit;
