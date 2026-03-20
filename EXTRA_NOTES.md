# FinConnectSA – Extra Notes & Customisation Guide

---

## 1. Changing the Colour Scheme

The website uses **Tailwind CSS** with a blue (`brand`) colour palette. To change colours:

### In `index.html` and `admin.html` — find the Tailwind config block:
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',  // Lightest tint
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1d4ed8',  // ← Primary button / accent colour
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',  // Darkest shade
        }
      }
    }
  }
}
```

**To switch to green**, for example, replace all the hex values with Tailwind's green palette:
- `#f0fdf4` (green-50) through `#14532d` (green-900)

You can find Tailwind's full colour palette at: https://tailwindcss.com/docs/customizing-colors

### Hero gradient (in the `<style>` block of `index.html`):
```css
.hero-bg {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 70%, #2563eb 100%);
}
```
Replace the hex values to match your new palette.

---

## 2. Adding Your Logo

Replace the text logo in `index.html`:

Find:
```html
<span class="text-white font-bold text-xl tracking-tight">FinConnect<span class="text-brand-300">SA</span></span>
```

Replace with:
```html
<img src="your-logo.png" alt="Your Company" class="h-8 w-auto">
```

For the admin panel, find the same logo area and do the same.

If hosting on Netlify/Vercel, place your logo file in the same folder as `index.html` and reference it as `./logo.png`.

---

## 3. Changing the Company Name

Search and replace `FinConnectSA` (and `FinConnect SA`) across both HTML files with your actual company name.

Also update the `<title>` tags:
```html
<title>YourCompany – Loans, Debt Review & Financial Solutions</title>
```

---

## 4. Making the Admin Password More Secure

The current password system is **client-side only** — the password is visible in the page source. This is acceptable for internal use where the `admin.html` URL is kept private, but here are better options:

### Option A: Keep `admin.html` offline
Don't upload `admin.html` to your public website. Only access it locally by opening the file directly on your computer. The admin panel fetches data from Google Apps Script (which is hosted by Google), so it works locally without any server.

### Option B: Add a server-side password (Netlify)
Use Netlify's built-in password protection:
1. In Netlify dashboard → Site settings → Access control → Password protection
2. Enable "Password protection" and set a password
3. This protects the entire site at the CDN level

### Option C: Move the admin panel to a separate Netlify site
Deploy only `admin.html` to a second Netlify site with a secret URL. Keep the URL private.

### Option D: Use Google's OAuth
Replace the password gate entirely with a Google login using Firebase Authentication. This is the most secure option for a production system handling sensitive financial data.

---

## 5. Security Note — Public GET Endpoint

The `doGet()` function in the Apps Script returns **all lead data** to anyone who has the URL. This is required for the admin panel to work from the browser without a server.

**Mitigations (easiest to hardest):**

### Mitigation 1: Keep the URL secret
The Apps Script URL contains a long random ID. As long as you don't publish it, it's effectively secret. Don't commit it to public GitHub repos.

### Mitigation 2: Add a token check
In `google-apps-script.js`, uncomment the token check section in `doGet()`:
```javascript
const SECRET = 'my-super-secret-token-xyz';
if (!e.parameter || e.parameter.token !== SECRET) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Then in `admin.html`, update the fetch URL:
```javascript
const res = await fetch(`${APPS_SCRIPT_URL}?action=getLeads&token=my-super-secret-token-xyz`);
```

### Mitigation 3: Full OAuth
Implement Google OAuth so only your Google account can read the data. This requires a backend server or Firebase Functions.

---

## 6. Adding Email Notifications

The Apps Script has a commented-out email notification block in `handleNewLead()`. To enable it:
1. Uncomment the `MailApp.sendEmail(...)` block
2. Replace `admin@yourcompany.co.za` with your actual email
3. Re-deploy the Apps Script

---

## 7. POPIA Compliance Notes

This website includes:
- A clear POPIA consent checkbox (required to submit)
- "Yes" recorded in the sheet when consent is given
- A footer disclaimer stating this is a lead generation service

**Additional steps you should take for full POPIA compliance:**
- Add a Privacy Policy page explaining what data you collect and why
- Add a Cookie Policy if you add analytics (e.g. Google Analytics)
- Register as an Information Officer with the Information Regulator (South Africa)
- Ensure your Google Workspace account is covered by a data processing agreement
- Have a data breach response plan

---

## 8. Adding Google Analytics

Add this in the `<head>` of both HTML files (replace `G-XXXXXXXXXX` with your measurement ID):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Track form submissions by adding to the form success handler in `index.html`:
```javascript
gtag('event', 'generate_lead', {
  event_category: 'form',
  event_label: 'lead_submission'
});
```

---

## 9. WhatsApp Chat Button

Add a floating WhatsApp button by inserting this before the closing `</body>` tag in `index.html`:
```html
<a href="https://wa.me/27XXXXXXXXX?text=Hi%2C%20I%20need%20help%20with%20a%20loan%20or%20debt%20solution."
   target="_blank" rel="noopener noreferrer"
   class="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-green-500/40 transition-all hover:scale-110"
   title="Chat on WhatsApp">
  <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.874L.057 23.454a.75.75 0 00.918.919l5.64-1.476A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.696 9.696 0 01-4.956-1.362l-.355-.211-3.685.965.983-3.597-.232-.371A9.696 9.696 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
  </svg>
</a>
```
Replace `27XXXXXXXXX` with your WhatsApp number in international format (e.g. `27821234567`).

---

## 10. File Summary

| File | Purpose |
|------|---------|
| `index.html` | Public-facing lead generation page |
| `admin.html` | Password-protected admin dashboard |
| `google-apps-script.js` | Paste into Google Apps Script editor |
| `DEPLOYMENT_INSTRUCTIONS.md` | Step-by-step setup guide |
| `EXTRA_NOTES.md` | This file — customisation & security |
