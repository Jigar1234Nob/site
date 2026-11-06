-- jigar.au standalone Supabase backend
-- Initial schema migration. Safe to run once in the Supabase SQL Editor.
-- Never place service_role keys or database passwords in this repository.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'archived')),
  definition jsonb not null default '{"version":1,"fields":[]}'::jsonb,
  allow_anonymous boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  applicant_name text,
  applicant_email text,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'reviewing', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  internal_notes text
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  website_url text,
  repository_url text,
  category text,
  status text not null default 'in_progress' check (status in ('planned', 'in_progress', 'live', 'paused', 'archived')),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'closed', 'spam')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  internal_notes text
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Starter staff application. It remains a draft until an administrator opens it.
insert into public.forms (slug, title, description, status, definition, allow_anonymous)
values (
  'jigars-station-staff-application',
  'Jigar''s Station | Staff Application',
  'Apply to join the Jigar''s Station team. Choose the roles that match your interests and experience.',
  'draft',
  '{
    "version": 1,
    "fields": [
      {"name":"full_name","label":"Full name","type":"text","required":true,"maxLength":120},
      {"name":"email","label":"Email address","type":"email","required":true},
      {"name":"discord_username","label":"Discord username","type":"text","required":true,"maxLength":100},
      {"name":"positions","label":"Which position(s) are you applying for?","type":"multiselect","required":true,"options":["Community Helper","Support Staff","Moderator","Senior Moderator","Project Tester","Community Manager","Administrator"]},
      {"name":"motivation","label":"Why would you like to join the team?","type":"textarea","required":true,"maxLength":4000},
      {"name":"experience","label":"Describe any relevant experience, including community support or moderation","type":"textarea","required":true,"maxLength":4000},
      {"name":"support_scenario","label":"A community member asks for help and you do not know the answer. What would you do?","type":"textarea","required":true,"maxLength":3000},
      {"name":"moderation_scenario","label":"You see a staff member treating someone unfairly. How would you handle it?","type":"textarea","required":true,"maxLength":3000},
      {"name":"project_knowledge","label":"What do you know about Jigar''s Station and its projects?","type":"textarea","required":true,"maxLength":3000},
      {"name":"testing_experience","label":"If applying as Project Tester, explain how you would report a bug clearly","type":"textarea","required":false,"maxLength":3000},
      {"name":"availability","label":"What days and times are you generally available? Include your timezone","type":"textarea","required":true,"maxLength":1500},
      {"name":"teamwork","label":"How do you handle disagreements and confidential staff information?","type":"textarea","required":true,"maxLength":3000},
      {"name":"final_declaration","label":"I confirm that my answers are accurate and I will follow the community and staff rules","type":"checkbox","required":true}
    ]
  }'::jsonb,
  true
)
on conflict (slug) do nothing;

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_forms_status on public.forms(status);
create index if not exists idx_form_submissions_form_id on public.form_submissions(form_id);
create index if not exists idx_form_submissions_status on public.form_submissions(status);
create index if not exists idx_form_submissions_submitted_at on public.form_submissions(submitted_at desc);
create index if not exists idx_projects_published_order on public.projects(is_published, sort_order);
create index if not exists idx_contact_messages_created_at on public.contact_messages(created_at desc);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in ('admin', 'editor')
  );
$$;

create or replace function public.is_site_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = 'admin'
  );
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists forms_set_updated_at on public.forms;
create trigger forms_set_updated_at before update on public.forms
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.forms enable row level security;
alter table public.form_submissions enable row level security;
alter table public.projects enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: users can read and update only their own profile.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (select public.is_site_admin()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Role assignments are never self-service. Only an existing site owner can manage them.
drop policy if exists "roles_select_self_or_admin" on public.user_roles;
create policy "roles_select_self_or_admin" on public.user_roles
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_site_owner()));

drop policy if exists "roles_manage_owner_only" on public.user_roles;
create policy "roles_manage_owner_only" on public.user_roles
for all to authenticated
using ((select public.is_site_owner()))
with check ((select public.is_site_owner()));

-- Public can read only open forms. Admin/editor can manage all forms.
drop policy if exists "forms_read_open_or_admin" on public.forms;
create policy "forms_read_open_or_admin" on public.forms
for select to anon, authenticated
using (status = 'open' or (select public.is_site_admin()));

drop policy if exists "forms_manage_admin" on public.forms;
create policy "forms_manage_admin" on public.forms
for all to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

-- Applicants may submit only to an open form. Responses are private to staff and
-- the signed-in applicant (when there is one). Anonymous applicants cannot read submissions.
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
    select 1 from public.forms f
    where f.id = form_id
      and f.status = 'open'
      and (f.allow_anonymous or user_id is not null)
  )
);

drop policy if exists "submissions_read_staff_or_own" on public.form_submissions;
create policy "submissions_read_staff_or_own" on public.form_submissions
for select to authenticated
using (
  (select public.is_site_admin())
  or (user_id is not null and user_id = (select auth.uid()))
);

drop policy if exists "submissions_update_staff" on public.form_submissions;
create policy "submissions_update_staff" on public.form_submissions
for update to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

-- Published project records are public. Drafts and edits are staff-only.
drop policy if exists "projects_read_published_or_admin" on public.projects;
create policy "projects_read_published_or_admin" on public.projects
for select to anon, authenticated
using (is_published or (select public.is_site_admin()));

drop policy if exists "projects_manage_admin" on public.projects;
create policy "projects_manage_admin" on public.projects
for all to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

-- Contact form: public insert only. No public read/update/delete.
drop policy if exists "contact_public_insert" on public.contact_messages;
create policy "contact_public_insert" on public.contact_messages
for insert to anon, authenticated
with check (
  length(trim(name)) between 1 and 120
  and length(trim(email)) between 3 and 254
  and length(trim(message)) between 1 and 10000
  and status = 'new'
  and reviewed_at is null
  and internal_notes is null
);

drop policy if exists "contact_admin_read" on public.contact_messages;
create policy "contact_admin_read" on public.contact_messages
for select to authenticated
using ((select public.is_site_admin()));

drop policy if exists "contact_admin_update" on public.contact_messages;
create policy "contact_admin_update" on public.contact_messages
for update to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

-- Only explicitly public settings are readable without staff access.
drop policy if exists "settings_read_public_or_admin" on public.site_settings;
create policy "settings_read_public_or_admin" on public.site_settings
for select to anon, authenticated
using (is_public or (select public.is_site_admin()));

drop policy if exists "settings_manage_admin" on public.site_settings;
create policy "settings_manage_admin" on public.site_settings
for all to authenticated
using ((select public.is_site_admin()))
with check ((select public.is_site_admin()));

-- Audit records are intentionally read-only to staff through the browser.
-- Inserts should be made by trusted server-side code using a server secret.
drop policy if exists "audit_read_admin" on public.audit_logs;
create policy "audit_read_admin" on public.audit_logs
for select to authenticated
using ((select public.is_site_admin()));

-- Explicit grants complement RLS. No anon access to private records.
grant usage on schema public to anon, authenticated;
grant select, insert on public.forms to anon, authenticated;
grant update, delete on public.forms to authenticated;
grant select, insert on public.form_submissions to anon, authenticated;
grant update on public.form_submissions to authenticated;
grant select, insert, update, delete on public.projects to anon, authenticated;
grant select, insert, update on public.contact_messages to anon, authenticated;
grant select, insert, update, delete on public.site_settings to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select on public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

commit;
