-- Full admin permissions and role-neutral scenario-based staff application.
-- Run after migrations 001, 002 and 003. Safe to re-run.
begin;

create or replace function public.is_site_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (
   select 1 from public.user_roles ur
   where ur.user_id = (select auth.uid()) and ur.role in ('admin','editor')
 );
$$;
grant execute on function public.is_site_admin() to authenticated;

-- Forms
alter table public.forms enable row level security;
drop policy if exists "forms_read_open_or_admin" on public.forms;
drop policy if exists "forms_manage_admin" on public.forms;
drop policy if exists "forms_staff_insert" on public.forms;
drop policy if exists "forms_staff_update" on public.forms;
drop policy if exists "forms_staff_delete" on public.forms;
create policy "forms_read_open_or_admin" on public.forms for select to anon, authenticated
using (status='open' or (select public.is_site_admin()));
create policy "forms_staff_insert" on public.forms for insert to authenticated
with check ((select public.is_site_admin()));
create policy "forms_staff_update" on public.forms for update to authenticated
using ((select public.is_site_admin())) with check ((select public.is_site_admin()));
create policy "forms_staff_delete" on public.forms for delete to authenticated
using ((select public.is_site_admin()));
grant select on public.forms to anon, authenticated;
grant insert, update, delete on public.forms to authenticated;

-- Projects
alter table public.projects enable row level security;
drop policy if exists "projects_read_published_or_admin" on public.projects;
drop policy if exists "projects_manage_admin" on public.projects;
drop policy if exists "projects_staff_insert" on public.projects;
drop policy if exists "projects_staff_update" on public.projects;
drop policy if exists "projects_staff_delete" on public.projects;
create policy "projects_read_published_or_admin" on public.projects for select to anon, authenticated
using (is_published or (select public.is_site_admin()));
create policy "projects_staff_insert" on public.projects for insert to authenticated
with check ((select public.is_site_admin()));
create policy "projects_staff_update" on public.projects for update to authenticated
using ((select public.is_site_admin())) with check ((select public.is_site_admin()));
create policy "projects_staff_delete" on public.projects for delete to authenticated
using ((select public.is_site_admin()));
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

-- Private applications: staff can review/update, applicants cannot change their own submitted records.
alter table public.form_submissions enable row level security;
drop policy if exists "submissions_read_staff_or_own" on public.form_submissions;
drop policy if exists "submissions_update_staff" on public.form_submissions;
create policy "submissions_read_staff_or_own" on public.form_submissions for select to authenticated
using ((select public.is_site_admin()) or (user_id is not null and user_id=(select auth.uid())));
create policy "submissions_update_staff" on public.form_submissions for update to authenticated
using ((select public.is_site_admin())) with check ((select public.is_site_admin()));
grant select, update on public.form_submissions to authenticated;
grant insert on public.form_submissions to anon, authenticated;

-- Contact inbox
alter table public.contact_messages enable row level security;
drop policy if exists "contact_admin_read" on public.contact_messages;
drop policy if exists "contact_admin_update" on public.contact_messages;
create policy "contact_admin_read" on public.contact_messages for select to authenticated
using ((select public.is_site_admin()));
create policy "contact_admin_update" on public.contact_messages for update to authenticated
using ((select public.is_site_admin())) with check ((select public.is_site_admin()));
grant insert on public.contact_messages to anon, authenticated;
grant select, update on public.contact_messages to authenticated;

-- Site settings
alter table public.site_settings enable row level security;
drop policy if exists "settings_read_public_or_admin" on public.site_settings;
drop policy if exists "settings_manage_admin" on public.site_settings;
create policy "settings_read_public_or_admin" on public.site_settings for select to anon, authenticated
using (is_public or (select public.is_site_admin()));
create policy "settings_manage_admin" on public.site_settings for all to authenticated
using ((select public.is_site_admin())) with check ((select public.is_site_admin()));
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

-- Scenario-only staff application. No role/position preference question.
-- Keep its existing status; publishing remains an explicit admin action.
update public.forms set
 title='Jigar''s Station | Team Application',
 description='Answer realistic situations so the team can understand your judgement, communication and strengths. Do not select a position. Responsibilities are matched by the team after reviewing your answers.',
 definition=jsonb_build_object('version',2,'fields',jsonb_build_array(
  jsonb_build_object('name','full_name','label','Full name','type','text','required',true,'maxLength',120),
  jsonb_build_object('name','email','label','Email address','type','email','required',true),
  jsonb_build_object('name','discord_username','label','Discord username','type','text','required',true,'maxLength',100),
  jsonb_build_object('name','timezone','label','What timezone are you usually in?','type','text','required',true,'maxLength',80),
  jsonb_build_object('name','availability','label','What days and times are you generally available? Include regular commitments.','type','textarea','required',true,'maxLength',1500),
  jsonb_build_object('name','scenario_support','label','A new member cannot join the server. They are frustrated, have tried several fixes, and you do not know the cause. Explain your response from first contact to resolution.','type','textarea','required',true,'maxLength',4000),
  jsonb_build_object('name','scenario_conflict','label','Two members are arguing publicly. One is a long-time regular and one is new. Both blame the other. What do you do, what evidence do you check, and how do you stay fair?','type','textarea','required',true,'maxLength',4000),
  jsonb_build_object('name','scenario_safety','label','You see targeted harassment and a message telling someone to hurt themselves. What immediate steps do you take to protect the person, preserve evidence, enforce rules and escalate?','type','textarea','required',true,'maxLength',4000),
  jsonb_build_object('name','scenario_staff','label','A staff member you are friends with appears to be abusing permissions and asks you to keep it secret. How do you respond and who needs to know?','type','textarea','required',true,'maxLength',3500),
  jsonb_build_object('name','scenario_privacy','label','A user sends you their password and asks you to log in to fix their account. What do you do instead, and how do you protect their information?','type','textarea','required',true,'maxLength',3000),
  jsonb_build_object('name','scenario_outage','label','A major service stops working during a busy period. Users are complaining, staff give conflicting explanations, and the cause is unknown. How do you prioritise, communicate updates and escalate?','type','textarea','required',true,'maxLength',4000),
  jsonb_build_object('name','scenario_testing','label','A new website, bot or game feature works inconsistently. Another person reports intermittent failures. Explain how you reproduce the issue, collect evidence and write a useful bug report.','type','textarea','required',true,'maxLength',4000),
  jsonb_build_object('name','scenario_announcement','label','You are asked to publish an announcement, but the information is incomplete and people are waiting. What do you verify, what do you communicate, and what do you avoid guessing?','type','textarea','required',true,'maxLength',3000),
  jsonb_build_object('name','scenario_priorities','label','Three things happen at once: someone needs urgent help, a rule violation is happening in chat, and an event is about to start. How do you prioritise, delegate and escalate?','type','textarea','required',true,'maxLength',4000),
  jsonb_build_object('name','scenario_feedback','label','A team lead says your decision was wrong. You disagree with part of the feedback. How do you respond, verify what happened and improve?','type','textarea','required',true,'maxLength',3000),
  jsonb_build_object('name','experience','label','Describe anything you have built, organised, supported, moderated, tested or learned that demonstrates your skills. Formal experience is not required.','type','textarea','required',true,'maxLength',4000),
  jsonb_build_object('name','strengths','label','Which tasks do you naturally do well, and which are difficult for you? Give examples, not job titles.','type','textarea','required',true,'maxLength',3000),
  jsonb_build_object('name','learning','label','Describe a time you had to learn an unfamiliar tool, rule or process quickly. What did you do and what happened?','type','textarea','required',true,'maxLength',3000),
  jsonb_build_object('name','confidentiality','label','What does protecting private information mean in practice? Give examples of information you would never share publicly.','type','textarea','required',true,'maxLength',2500),
  jsonb_build_object('name','motivation','label','Why do you want to contribute to Jigar''s Station, and what positive contribution would you make? Do not name a position.','type','textarea','required',true,'maxLength',2500),
  jsonb_build_object('name','final_declaration','label','I confirm my answers are accurate and I will follow the community rules, staff procedures and privacy requirements.','type','checkbox','required',true)
 )),
 updated_at=now()
where slug='jigars-station-staff-application';

commit;
