# jigar.au Supabase backend

This is a standalone Supabase project for the jigar.au portfolio website. It is not connected to JPN and must not share JPN users, roles, database credentials, or secrets.

## Included database areas

- Website profiles and staff roles
- Forms and private form submissions
- Public portfolio projects
- Contact enquiries
- Public/private site settings
- Read-only staff audit log access

## Apply the initial migration

1. Open the Supabase dashboard for the project whose URL is configured in the website.
2. Open **SQL Editor** and create a new query.
3. Copy the contents of `migrations/202611060001_initial_schema.sql` from this repository.
4. Run it once, then inspect **Table Editor** and **Authentication**.

Do not run this against the JPN Supabase project.

## Create the first site administrator

1. In Supabase **Authentication → Users**, create your own website account using an email address you control.
2. Copy that account's UUID.
3. In the SQL Editor for this jigar.au project only, run the following after replacing the UUID:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR_AUTH_USER_UUID', 'admin')
on conflict (user_id, role) do nothing;
```

Never expose a role-assignment endpoint to anonymous users. The browser cannot promote itself because role management is restricted to an existing site owner.

## Browser configuration

Use only:
- Supabase Project URL
- Supabase publishable key

These values are intended for browser use. RLS is mandatory. Never put a database password, service_role key, secret key, or access token in HTML, JavaScript, GitHub Pages, or a public repository.

## Important implementation notes

- Public visitors can read only open forms and published projects.
- Public visitors can submit an open form when anonymous submissions are enabled.
- Submissions, contact enquiries, private settings, profiles, roles, and audit records are not publicly readable.
- Staff roles are assigned manually by the site owner.
- Audit-log writes should be performed by trusted server-side code, not directly by the browser.
- Add CAPTCHA / Turnstile and rate limiting before opening public forms to reduce spam.
- Configure Auth email templates, redirect URLs, and SMTP before relying on account verification or password resets.
