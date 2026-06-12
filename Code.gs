/**
 * Google Apps Script — Contact form backend
 *
 * Deployed as a Web App (Execute as: me, Access: Anyone).
 * Receives POST requests from the contact form on polygentic.com
 * and appends rows to the bound Google Sheet.
 *
 * Sheet ID: 1U0ViF9GANGhojsGZZQWbu55FNSJYg4tI1ShLHIY_AFc
 * Deployment URL: https://script.google.com/macros/s/AKfycbzBCV_N0njWkj0tCw98frXm1TnaY9GI1OVFkwY4QMMB3gvjnKN0Z4cUl-t76-aSVEQsKA/exec
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(e.postData.contents);

    // Honeypot check
    if (data._gotcha) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.message || '',
      data._gotcha || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
