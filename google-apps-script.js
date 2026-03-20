// ════════════════════════════════════════════════════════════════════
// FinConnectSA – Google Apps Script (paste-ready)
// ════════════════════════════════════════════════════════════════════
// HOW TO USE:
//   1. Open Google Sheets → Extensions → Apps Script
//   2. Delete all existing code and paste this entire file
//   3. Click "Deploy" → "New deployment" → "Web app"
//   4. Set "Execute as" = Me, "Who has access" = Anyone
//   5. Copy the deployment URL and paste it into index.html and admin.html
//
// SHEET COLUMNS (must be in this exact order, row 1):
//   A: Timestamp  B: Full Name  C: Email  D: Phone  E: ID Number
//   F: Province   G: Services   H: Message  I: Consent  J: Status
// ════════════════════════════════════════════════════════════════════

// ── Configuration ──
const SHEET_NAME = 'Leads';  // Name of the sheet tab

/**
 * Returns the active spreadsheet's "Leads" sheet.
 * Creates the header row automatically if the sheet is empty.
 */
function getSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Auto-create headers if the sheet is blank
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp', 'Full Name', 'Email', 'Phone', 'ID Number',
      'Province', 'Services', 'Message', 'Consent', 'Status'
    ]);
    // Style header row
    const headerRange = sheet.getRange(1, 1, 1, 10);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1d4ed8');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// ════════════════════════════════════════════════════════════════════
// doPost – Receives form data from index.html and writes to sheet
// ════════════════════════════════════════════════════════════════════
function doPost(e) {
  // Allow CORS
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    // Parse the incoming JSON body
    const payload = JSON.parse(e.postData.contents);

    // ── Route based on action ──
    if (payload.action === 'updateStatus') {
      return handleUpdateStatus(payload, output);
    }

    if (payload.action === 'deleteRow') {
      return handleDeleteRow(payload, output);
    }

    // Default action: new lead submission
    return handleNewLead(payload, output);

  } catch (err) {
    output.setContent(JSON.stringify({ success: false, error: err.message }));
    return output;
  }
}

/**
 * Appends a new lead row to the sheet.
 */
function handleNewLead(payload, output) {
  const sheet = getSheet();

  const timestamp = new Date().toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  sheet.appendRow([
    timestamp,
    sanitise(payload.fullName),
    sanitise(payload.email),
    sanitise(payload.phone),
    sanitise(payload.idNumber),
    sanitise(payload.province),
    sanitise(payload.services),
    sanitise(payload.message),
    sanitise(payload.consent),
    'New'  // Default status
  ]);

  // Optional: send email notification to admin when a new lead comes in
  // Uncomment the lines below and replace the email address:
  /*
  try {
    MailApp.sendEmail({
      to: 'admin@yourcompany.co.za',
      subject: '🔔 New Lead: ' + sanitise(payload.fullName),
      body: `A new lead has been submitted on FinConnectSA:\n\n` +
            `Name: ${sanitise(payload.fullName)}\n` +
            `Email: ${sanitise(payload.email)}\n` +
            `Phone: ${sanitise(payload.phone)}\n` +
            `Province: ${sanitise(payload.province)}\n` +
            `Services: ${sanitise(payload.services)}\n\n` +
            `Log in to your admin panel to view and manage this lead.`
    });
  } catch(mailErr) {
    // Mail failure should not break the lead submission
    console.error('Mail error:', mailErr.message);
  }
  */

  output.setContent(JSON.stringify({ success: true }));
  return output;
}

/**
 * Updates the Status column for a specific row.
 * Payload must include: rowIndex (1-based), status (string)
 */
function handleUpdateStatus(payload, output) {
  const sheet    = getSheet();
  const rowIndex = parseInt(payload.rowIndex, 10);
  const status   = sanitise(payload.status);

  // Validate status
  const validStatuses = ['New', 'Contacted', 'Closed'];
  if (!validStatuses.includes(status)) {
    output.setContent(JSON.stringify({ success: false, error: 'Invalid status' }));
    return output;
  }

  // Column J (10) = Status
  sheet.getRange(rowIndex, 10).setValue(status);

  output.setContent(JSON.stringify({ success: true }));
  return output;
}

/**
 * Deletes a row from the sheet.
 * Payload must include: rowIndex (1-based, where row 1 is the header)
 */
function handleDeleteRow(payload, output) {
  const sheet    = getSheet();
  const rowIndex = parseInt(payload.rowIndex, 10);

  // Safety: never delete the header row
  if (rowIndex <= 1) {
    output.setContent(JSON.stringify({ success: false, error: 'Cannot delete header row' }));
    return output;
  }

  sheet.deleteRow(rowIndex);

  output.setContent(JSON.stringify({ success: true }));
  return output;
}

// ════════════════════════════════════════════════════════════════════
// doGet – Returns all leads as JSON for the admin panel
// ════════════════════════════════════════════════════════════════════
function doGet(e) {
  // ⚠️  SECURITY NOTE:
  // This endpoint is publicly accessible (required for the admin panel to read data).
  // Anyone with the URL can query your lead data.
  // Mitigation options:
  //   1. Add a secret token check (see commented code below)
  //   2. Use Google's OAuth instead
  //   3. Restrict "Who has access" to your Google account only (but then CORS won't work from browser)

  // Optional: Secret token check
  // Uncomment and set ADMIN_SECRET to match what you send in the request
  /*
  const SECRET = 'my-secret-token-123';
  if (!e.parameter || e.parameter.token !== SECRET) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  */

  try {
    const sheet      = getSheet();
    const lastRow    = sheet.getLastRow();
    const lastCol    = 10; // A–J
    const output     = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (lastRow <= 1) {
      // Only header row — no leads yet
      output.setContent(JSON.stringify({ success: true, leads: [] }));
      return output;
    }

    // Get all data rows (skip header row 1)
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    const values    = dataRange.getValues();

    const headers = ['Timestamp', 'Full Name', 'Email', 'Phone', 'ID Number',
                     'Province', 'Services', 'Message', 'Consent', 'Status'];

    const leads = values.map((row, idx) => {
      const lead = {};
      headers.forEach((h, i) => {
        lead[h] = row[i] ? String(row[i]) : '';
      });
      // Include the actual row index (for update/delete operations)
      // Row 1 = header, Row 2 = first data row, so actual sheet row = idx + 2
      lead._rowIndex = idx + 2;
      return lead;
    });

    output.setContent(JSON.stringify({ success: true, leads }));
    return output;

  } catch (err) {
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({ success: false, error: err.message }));
    return output;
  }
}

// ════════════════════════════════════════════════════════════════════
// Utility
// ════════════════════════════════════════════════════════════════════
/**
 * Sanitises a value to a safe string.
 * Strips leading/trailing whitespace and limits length.
 */
function sanitise(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().substring(0, 2000);
}

// ════════════════════════════════════════════════════════════════════
// Test helper (optional — run from the Apps Script editor to verify)
// ════════════════════════════════════════════════════════════════════
function testWrite() {
  const sheet = getSheet();
  Logger.log('Sheet name: ' + sheet.getName());
  Logger.log('Last row: ' + sheet.getLastRow());
  Logger.log('✅ Sheet is accessible.');
}
