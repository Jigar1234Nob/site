# Admin user Edge Function

This function is required for administrator-only Auth account actions (list Auth users, disable/enable accounts, delete accounts). The website's browser code never receives the service-role key.

## Deploy

Install and sign in to the Supabase CLI, link the standalone jigar.au project, then run:

```sh
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
supabase functions deploy admin-users
```

The function also reads the project URL and anon key from the Supabase Edge Function environment. Do not commit secrets to this repository or paste them into frontend files.

The function verifies the caller's JWT, checks that the caller has the `admin` role in `public.user_roles`, and only then uses the service-role client. It does not allow an administrator to disable or delete their own account. Account deletion is irreversible and should be used cautiously.

After deployment, the Admin → People & roles page can load Auth account details and expose disable/enable/delete controls. Until deployment, profile and role management remains available through the database policies, but Auth account controls stay unavailable.
