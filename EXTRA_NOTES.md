# FinConnectSA – Production Notes

## Design system updates

The site now uses the following palette derived from your reference image:

- `#212A31`
- `#2E3944`
- `#124E66`
- `#748D92`
- `#D3D9D4`.

These values are defined in the Tailwind config blocks inside both `index.html` and `admin.html`.

---

## Image treatment approach

The photography is now displayed with a more professional system:

- controlled aspect ratios
- rounded editorial cards
- subtle overlays for text legibility
- image groupings that support the message rather than distract from it
- consistent spacing and shadows across sections

If you add more photos later, keep the same style:
- use high-resolution business / finance imagery
- avoid heavily saturated colours that fight the palette
- prefer landscape or portrait photos with clean negative space

---

## Production security improvements vs. previous version

The old version relied on a browser-visible password and Google Apps Script.

The current version is stronger because it uses:
- Supabase Auth for admin sign-in
- admin role checks through `app_metadata`
- RLS for database protection
- Edge Functions for public writes
- Resend verification before operational follow-up

---

## Suggested next upgrades

If you want to continue hardening after launch, the next best improvements would be:

1. Add hCaptcha or Cloudflare Turnstile to the public form.
2. Add server-side rate limiting in the `lead-submit` function.
3. Log admin actions in a separate `lead_activity` table.
4. Add a `source`, `campaign`, and `assigned_to` workflow to the admin table.
5. Add analytics events for submit, verify, and admin status changes.

---

## cPanel hosting note

Because this project is static, cPanel hosting is fine for the front end.
The dynamic parts live in Supabase, so cPanel only needs to serve:

- HTML
- JS
- images
- config file

No Node.js runtime is required on cPanel for this setup.

