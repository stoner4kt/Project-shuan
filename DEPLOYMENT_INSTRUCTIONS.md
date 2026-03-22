# FinConnectSA – Supabase + Resend + cPanel Setup Guide

This project is now structured for a **static front end hosted on cPanel** with a **Supabase backend**, **Edge Functions** for public lead intake, and **Resend** for email verification.

---

## 1. What this stack does

### Public website (`index.html`)
- Collects lead enquiries.
- Sends the form to a Supabase Edge Function named `lead-submit`.
- Triggers a verification email to the client.
- Lets the client confirm their email using a verification link.

### Admin dashboard (`admin.html`)
- Uses **Supabase Auth** instead of a visible client-side password.
- Only allows verified users with `app_metadata.role = admin`.
- Reads, filters, updates, deletes, and exports lead records.

### Supabase database
- Stores leads in the `public.leads` table.
- Uses Row Level Security so only admins can read or manage leads.

---

## 2. Files you need to configure

| File | Purpose |
|------|---------|
| `config.js` | Front-end environment values for Supabase and your site URL |
| `supabase/migrations/20260322_finconnect_setup.sql` | Lead table + RLS policies |
| `supabase/functions/lead-submit/index.ts` | Public lead intake + Resend verification email |
| `supabase/functions/lead-verify/index.ts` | Email verification endpoint |
| `index.html` | Public form |
| `admin.html` | Secure admin dashboard |

---

## 3. Create your Supabase project

1. Log into Supabase.
2. Create a new project.
3. Wait for the database and API services to finish provisioning.
4. Copy these values from **Project Settings → API**:
   - `Project URL`
   - `anon public key`
   - `service_role key` *(Edge Function secret only — never place this in `config.js`)*

---

## 4. Run the database migration

Use the SQL in:

- `supabase/migrations/20260322_finconnect_setup.sql`

### Option A — Supabase SQL Editor
1. Open **SQL Editor** in Supabase.
2. Paste the migration contents.
3. Run the script.

### Option B — Supabase CLI
```bash
supabase db push
```

This creates:
- `public.leads`
- indexes for filtering/reporting
- an `updated_at` trigger
- RLS policies for authenticated admin users only

---

## 5. Deploy the Edge Functions

This project includes two functions:

- `lead-submit`
- `lead-verify`

### Required function secrets
Set these in Supabase:

```bash
supabase secrets set \
  SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
  RESEND_API_KEY="re_xxxxxxxxx" \
  RESEND_FROM_EMAIL="FinConnect SA <verify@yourdomain.com>"
```

### Deploy the functions
```bash
supabase functions deploy lead-submit
supabase functions deploy lead-verify
```

---

## 6. Configure Resend

1. Create a Resend account.
2. Verify the sending domain you want to use.
3. Create the sender address used in `RESEND_FROM_EMAIL`.
4. Copy your Resend API key.
5. Store it in Supabase secrets as `RESEND_API_KEY`.

### Optional: use Resend SMTP for Supabase Auth emails too
If you want admin verification emails from Supabase Auth to also use Resend:
1. Open **Supabase → Authentication → SMTP Settings**.
2. Enable custom SMTP.
3. Paste your Resend SMTP credentials.
4. Save.

That way:
- lead verification emails come from your Edge Function + Resend API
- admin user confirmation emails come from Supabase Auth via Resend SMTP

---

## 7. Create your first admin user

The admin dashboard requires:
- a valid Supabase Auth account
- email confirmation completed
- `app_metadata.role = admin`

### Recommended flow
1. In Supabase, go to **Authentication → Users**.
2. Create a user for your admin email.
3. Ensure the user confirms their email address.
4. Set their role to admin.

### Example SQL to set admin metadata
Replace the email address first:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@yourdomain.com';
```

After this, the user can sign into `admin.html`.

---

## 8. Update `config.js`

Open `config.js` and replace the placeholders:

```javascript
window.FINCONNECT_CONFIG = {
  siteUrl: 'https://your-domain.example.com',
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  edgeFunctionBase: 'https://YOUR_PROJECT.supabase.co/functions/v1',
  leadSubmitFunction: 'lead-submit',
  leadVerifyFunction: 'lead-verify',
  leadsTable: 'leads'
};
```

### Important notes
- `siteUrl` must match the live public URL.
- `supabaseAnonKey` is safe for the browser.
- Do **not** place the service role key in any public file.

---

## 9. Upload to cPanel

Because this site is static, cPanel hosting is simple.

### Public site deployment
Upload these files/folders to your web root (`public_html` or your chosen folder):
- `index.html`
- `admin.html`
- `config.js`
- `assets/`

### Recommended structure
```text
public_html/
  index.html
  admin.html
  config.js
  assets/
```

### cPanel checklist
- Ensure `config.js` is uploaded alongside the HTML files.
- Keep file names exactly as committed.
- If using a subfolder, update `siteUrl` accordingly.
- Test both pages using the final live URL, not only local files.

---

## 10. Test the production flow

### Public lead test
1. Open the live `index.html` page.
2. Submit a test enquiry.
3. Confirm the success message appears.
4. Check the inbox of the email used in the form.
5. Click the verification link.
6. Re-open the admin panel and confirm the lead shows as **Verified**.

### Admin test
1. Open `admin.html`.
2. Sign in with your confirmed admin account.
3. Confirm leads load successfully.
4. Test:
   - search
   - province filter
   - service filter
   - status updates
   - delete action
   - Excel export

---

## 11. Recommended Supabase settings

### Authentication URL settings
In **Supabase → Authentication → URL Configuration**:
- set your **Site URL** to the live public domain
- add your production URL to **Redirect URLs**
- add any staging domain if you use one

### RLS best practice
Keep `public.leads` locked down with RLS.
Do not add an `INSERT` policy for `anon` if you are using the supplied Edge Function, because the Edge Function already inserts with the service role key.

---

## 12. Operational recommendations before launch

- Use a real domain email address for Resend.
- Add a Privacy Policy page.
- Add Terms of Use if you route leads to third-party providers.
- Review POPIA wording with your compliance contact.
- Enable CAPTCHA later if spam becomes an issue.
- Back up your database periodically.
- Create at least two admin accounts so you are not locked out.

---

## 13. Troubleshooting

| Problem | Likely cause | Fix |
|--------|--------------|-----|
| Public form says config is missing | `config.js` still contains placeholders | Replace the values and re-upload |
| Form submits but no email arrives | Resend domain/API issue | Verify domain, sender, and `RESEND_API_KEY` |
| Email link opens but verification fails | Wrong `siteUrl` or token issue | Confirm `siteUrl` and function deployment |
| Admin login fails with “email not confirmed” | User has not verified their auth email | Confirm the email from Supabase Auth |
| Admin login works but no data loads | Missing admin role or RLS issue | Set `app_metadata.role = admin` |
| CORS errors from functions | Function not deployed or wrong base URL | Check function deploy status and `edgeFunctionBase` |

---

## 14. Launch checklist

- [ ] Migration executed successfully
- [ ] Functions deployed
- [ ] Secrets added
- [ ] Resend sender verified
- [ ] Admin user created and confirmed
- [ ] Admin role set
- [ ] `config.js` updated
- [ ] Files uploaded to cPanel
- [ ] Public form tested
- [ ] Verification email tested
- [ ] Admin dashboard tested

