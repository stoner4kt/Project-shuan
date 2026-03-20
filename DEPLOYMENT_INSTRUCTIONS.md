# FinConnectSA – Deployment Instructions
## Complete Step-by-Step Guide

---

## STEP 1 — Set Up Your Google Sheet

1. Go to [https://sheets.google.com](https://sheets.google.com)
2. Click **"+ Blank spreadsheet"**
3. Name it **"FinConnectSA Leads"** (click the title at the top)
4. The Apps Script will auto-create the header row for you (see Step 2)
5. Note your spreadsheet URL — you'll need it in Step 2

---

## STEP 2 — Deploy the Google Apps Script

1. Inside your Google Sheet, click **Extensions → Apps Script**
2. A new tab opens with the script editor
3. **Delete all existing code** in the editor
4. Open `google-apps-script.js` and **copy everything**
5. **Paste** it into the Apps Script editor
6. Click **"Save project"** (floppy disk icon or Ctrl+S)
7. Click **"Deploy"** (top right) → **"New deployment"**
8. Click the gear icon next to "Type" and select **"Web app"**
9. Fill in:
   - **Description:** `FinConnectSA Lead Form v1`
   - **Execute as:** `Me (your.email@gmail.com)`
   - **Who has access:** `Anyone`
10. Click **"Deploy"**
11. Google will ask you to **authorise** the app:
    - Click "Authorise access"
    - Choose your Google account
    - Click "Advanced" → "Go to FinConnectSA (unsafe)" *(this is normal for your own scripts)*
    - Click "Allow"
12. **Copy the Web app URL** — it looks like:
    `https://script.google.com/macros/s/AKfycby.../exec`

---

## STEP 3 — Add Your URL to the HTML Files

### In `index.html`:
Find this line (near the bottom in the `<script>` tag):
```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID_HERE/exec';
```
Replace it with your actual URL:
```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
```

### In `admin.html`:
Find the same line in the configuration section and replace it with the same URL.

---

## STEP 4 — Test Your Setup

### Test the public form:
1. Open `index.html` in a browser (double-click the file)
2. Fill in all required fields
3. Click "Submit My Application"
4. You should see the green success message
5. Open your Google Sheet — the new row should appear within seconds

### Test the admin panel:
1. Open `admin.html` in a browser
2. Enter password: `Admin2026`
3. You should see the dashboard with your test lead
4. Try the search, filters, status update, and export buttons

### Verify Apps Script is working:
1. Go back to Apps Script editor
2. Select the function `testWrite` from the dropdown
3. Click the ▶ Run button
4. In the "Execution log" you should see "✅ Sheet is accessible."

---

## STEP 5 — Deploy to the Web (Free Hosting)

### Option A: Netlify (Recommended — easiest)
1. Go to [https://app.netlify.com](https://app.netlify.com) and sign up free
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag and drop your project folder (containing `index.html` and `admin.html`) onto the upload area
4. Wait ~30 seconds
5. Netlify gives you a URL like `https://random-name.netlify.app`
6. Optional: Go to **Site settings → Domain management** to set a custom domain
7. To update: simply drag-and-drop again

### Option B: Vercel
1. Go to [https://vercel.com](https://vercel.com) and sign up free
2. Install Vercel CLI: `npm i -g vercel`
3. In your project folder, run: `vercel`
4. Follow the prompts (Framework: Other, Root: ./)
5. Your site is live at `https://your-project.vercel.app`

### Option C: GitHub Pages (also free)
1. Create a free account at [https://github.com](https://github.com)
2. Create a new repository (public)
3. Upload `index.html` and `admin.html` to the repository
4. Go to **Settings → Pages → Source → Deploy from branch → main**
5. Your site is live at `https://yourusername.github.io/repo-name`

---

## STEP 6 — Change the Admin Password

Open `admin.html` and find this line near the top of the `<script>` section:
```javascript
const ADMIN_PASSWORD = 'Admin2026';
```
Change `Admin2026` to your own secure password.

> ⚠️ **Important:** This is a client-side password and is visible in the page source.
> See the "Security Notes" file for how to make this more secure.

---

## STEP 7 — Re-deploying After Changes

If you change the Apps Script code and need to redeploy:
1. Go to Apps Script editor
2. Click **Deploy → Manage deployments**
3. Click the pencil ✏️ icon next to your deployment
4. Change version to **"New version"**
5. Click **"Deploy"**
6. The URL stays the same — no changes needed in your HTML files

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Form submits but no row appears in sheet | Check your APPS_SCRIPT_URL is correct. Check Google Sheet permissions. |
| Admin panel shows "Failed to load leads" | Ensure the Apps Script is deployed with "Anyone" access. Try opening the URL directly in your browser — it should return JSON. |
| Export to Excel button does nothing | Check browser console for errors. Ensure SheetJS CDN loaded. |
| "Redirect URI mismatch" error | Redeploy the Apps Script as a new version. |
| CORS error in browser console | This is expected for POST in no-cors mode. The data still sends. For GET requests, if you see a CORS error, redeploy the script. |
