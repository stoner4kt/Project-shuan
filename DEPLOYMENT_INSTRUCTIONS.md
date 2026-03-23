# HTML + Google Apps Script Setup Guide

This repo is now a static HTML site that submits the inquiry form directly to a Google Apps Script Web App.

## 1. Files you need for deployment
Upload these items to your web host / cPanel public web root:

- `index.html`
- `privacy.html`
- `terms.html`
- `legal.html`
- `assets/`

## 2. Front-end placeholder to replace
Open `index.html` and find:

```js
const APPS_SCRIPT_URL = '{{APPS_SCRIPT_URL}}';
```

Replace it with your deployed Apps Script Web App URL, for example:

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

## 3. What the website sends to Apps Script
### Submit request
The form sends a JSON `POST` body like this:

```json
{
  "action": "submit",
  "name": "Thabo Nkosi",
  "email": "you@email.com",
  "phone": "0821234567",
  "province": "Western Cape",
  "services": ["Debt Consolidation", "Personal Loans"],
  "message": "Optional message",
  "consent": true,
  "source": "https://your-domain.example.com/"
}
```

Expected success response:

```json
{
  "status": "verification_sent",
  "reference": "abc123"
}
```

### Verify request
After submit, the page sends another JSON `POST` body:

```json
{
  "action": "verify",
  "email": "you@email.com",
  "code": "123456",
  "reference": "abc123",
  "source": "https://your-domain.example.com/"
}
```

Expected success response:

```json
{
  "status": "verified",
  "success": true
}
```

### Optional rate-limit response
If you want Apps Script to throttle attempts, return:

```json
{
  "status": "rate_limited",
  "message": "Please wait before trying again."
}
```

## 4. Apps Script project setup
1. Go to [script.google.com](https://script.google.com/).
2. Create a new Apps Script project.
3. Add a script file such as `Code.gs`.
4. Paste your server logic.
5. Deploy it as a **Web App**.
6. Set access so the website can send requests to it.
7. Copy the deployment URL and paste it into `index.html`.

## 5. Minimal Apps Script structure
A typical implementation should:

- accept `POST` requests
- parse JSON from `e.postData.contents`
- branch on `action === 'submit'` and `action === 'verify'`
- generate and store a 6-digit code during submit
- send the verification code by email
- verify the code during the `verify` action
- return JSON with the shapes shown above

## 6. Example Apps Script skeleton
```javascript
function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents || '{}');

  if (body.action === 'submit') {
    // 1. validate fields
    // 2. generate 6-digit code
    // 3. store lead + code (Sheet / Properties / database)
    // 4. send verification email
    return jsonResponse({ status: 'verification_sent', reference: 'abc123' });
  }

  if (body.action === 'verify') {
    // 1. look up stored lead by email/reference
    // 2. compare submitted code
    // 3. mark lead as verified
    return jsonResponse({ status: 'verified', success: true });
  }

  return jsonResponse({ status: 'error', message: 'Unsupported action.' });
}
```

## 7. Suggested storage options for Apps Script
You can store leads and verification codes in any of these:

- Google Sheets
- Script Properties / User Properties (for small/simple workflows)
- an external database you call from Apps Script

Google Sheets is usually the fastest option for brochure-site lead capture.

## 8. cPanel upload steps
1. Zip or upload the site files listed in section 1.
2. Place them in `public_html/` or your chosen document root.
3. Confirm `assets/` stays in the same relative path.
4. Replace the Apps Script placeholder in `index.html`.
5. Clear any host/CDN cache.
6. Load the site and test the form.

## 9. Manual test checklist
- Open the homepage.
- Submit the form with all required fields.
- Confirm the page shows `Verification email sent`.
- Check that the 6-digit verification panel appears.
- Enter a valid code and click `Verify`.
- Confirm the thank-you state appears with the home link.
- Try a repeated submit quickly to confirm the warning message appears.

## 10. Notes
- This site no longer depends on the removed Supabase/admin files.
- The static pages continue to work as normal without any build step.
- If your Apps Script needs CORS handling, return JSON consistently and deploy the script in Web App mode.
