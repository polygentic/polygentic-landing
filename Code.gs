/**
 * Google Apps Script — Contact form backend for polygentic.com
 *
 * Deployed as a Web App (Execute as: me, Access: Anyone).
 * Receives POST requests from the contact form and appends rows to the
 * bound Google Sheet.
 *
 * Sheet ID: 1U0ViF9GANGhojsGZZQWbu55FNSJYg4tI1ShLHIY_AFc
 * Deployment URL: https://script.google.com/macros/s/AKfycbzBCV_N0njWkj0tCw98frXm1TnaY9GI1OVFkwY4QMMB3gvjnKN0Z4cUl-t76-aSVEQsKA/exec
 *
 * After editing this file: Apps Script editor → Deploy → Manage deployments →
 * edit the existing deployment → Version: New version → Deploy. The URL stays
 * the same, so the site needs no change.
 *
 * Security measures (see README):
 * - Honeypot field: bots that fill `_gotcha` get a fake success and no row.
 * - Time-on-page: submissions under MIN_ELAPSED_MS are rejected.
 * - Validation: required fields, length caps, email shape, JSON-only body.
 * - Sanitising: control characters stripped; values that Sheets would parse
 *   as formulas (=, +, -, @, |) are prefixed with an apostrophe.
 * - Rate limits: global per-minute and per-email per-hour via CacheService.
 * - Errors: generic messages only; internals go to Logger, not the client.
 */

var LIMITS = { name: 100, email: 254, message: 2000 };
var MIN_ELAPSED_MS = 2000;
var GLOBAL_PER_MINUTE = 10;
var PER_EMAIL_PER_HOUR = 3;
var MAX_BODY_BYTES = 8192;

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var FORMULA_RE = /^[=+\-@|]/;
// Every C0 control character except newline (0x0A), plus DEL.
var CONTROL_RE = /[\x00-\x09\x0b-\x1f\x7f]/g;

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok() { return json({ result: 'success' }); }
function fail(message) { return json({ result: 'error', message: message }); }

/** Make a value safe to write into a Sheets cell as plain text. */
function sanitizeCell(value, max) {
  var s = String(value == null ? '' : value).replace(CONTROL_RE, '').trim();
  if (s.length > max) s = s.slice(0, max);
  if (FORMULA_RE.test(s)) s = "'" + s;
  return s;
}

/** Validate the parsed payload. Returns null if ok, else a generic reason. */
function validate(data) {
  if (!data || typeof data !== 'object') return 'invalid';
  var name = String(data.name == null ? '' : data.name).trim();
  var email = String(data.email == null ? '' : data.email).trim();
  var message = String(data.message == null ? '' : data.message).trim();
  if (!name || !email || !message) return 'missing';
  if (name.length > LIMITS.name) return 'too_long';
  if (email.length > LIMITS.email || !EMAIL_RE.test(email)) return 'bad_email';
  if (message.length > LIMITS.message) return 'too_long';
  var elapsed = Number(data._elapsed);
  if (!isFinite(elapsed) || elapsed < MIN_ELAPSED_MS) return 'too_fast';
  return null;
}

/** Increment a counter in the script cache; return true if over the limit. */
function overLimit(cache, key, limit, ttlSeconds) {
  var current = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(current), ttlSeconds);
  return current > limit;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return fail('busy');

  try {
    var body = e && e.postData && e.postData.contents;
    if (!body || body.length > MAX_BODY_BYTES) return fail('invalid');

    var data;
    try { data = JSON.parse(body); } catch (parseErr) { return fail('invalid'); }

    // Honeypot: pretend it worked, write nothing.
    if (data && data._gotcha) return ok();

    var reason = validate(data);
    if (reason) return fail(reason);

    var cache = CacheService.getScriptCache();
    var email = String(data.email).trim().toLowerCase();
    var minuteKey = 'rl:global:' + Math.floor(Date.now() / 60000);
    if (overLimit(cache, minuteKey, GLOBAL_PER_MINUTE, 120)) return fail('rate_limited');
    var emailKey = 'rl:email:' + Utilities.base64EncodeWebSafe(email);
    if (overLimit(cache, emailKey, PER_EMAIL_PER_HOUR, 3600)) return fail('rate_limited');

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date().toISOString(),
      sanitizeCell(data.name, LIMITS.name),
      sanitizeCell(email, LIMITS.email),
      sanitizeCell(data.message, LIMITS.message),
      ''
    ]);

    return ok();
  } catch (err) {
    Logger.log('doPost failed: ' + (err && err.stack ? err.stack : err));
    return fail('server_error');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return fail('method_not_allowed');
}
