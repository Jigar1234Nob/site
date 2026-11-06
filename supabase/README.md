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


## Website account pages

The static website now includes:

- `/account/`: sign-in, registration, password-reset request, password update, and sign-out.
- `/admin/`: a staff-role gate for the future management dashboard.
- Browser code uses the Supabase project URL and publishable key from `docs/assets/js/supabase-client.js` only.

Before testing the website account page, configure the standalone Supabase project's Authentication settings:

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to `https://jigar.au`.
3. Add `https://jigar.au/account/` to the allowed redirect URLs. If the www hostname is actively used, also add `https://www.jigar.au/account/`.
4. Under **Authentication → Providers → Email**, enable email/password sign-in. Keep email confirmation enabled for public registration.
5. Configure a working SMTP provider and review the confirmation and password-reset email templates before relying on them in production.
6. Apply the SQL migration before testing staff roles or the admin route. Without the migration, authentication itself may work, but the profile/role database features will not.

Public registration does not grant staff access. The first administrator must still be assigned manually using the SQL instructions above.
