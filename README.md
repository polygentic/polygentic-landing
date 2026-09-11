# polygentic.com

Marketing site for Polygentic, Inc. A single static page: what we do, how we work, and a contact form.
No framework, no build step.

## Files

| File | Purpose |
|---|---|
| `index.html` | The page: nav, four numbered sections, contact form, footer. Also carries the CSP and Open Graph meta tags. |
| `styles.css` | All styling. Desktop-first, with a tablet step at 1100px and a phone breakpoint at 720px. |
| `script.js` | Contact form: client-side validation, honeypot, time-on-page, JSON POST to the Apps Script backend. |
| `Code.gs` | Reference copy of the Google Apps Script backend. Deployed separately in the Apps Script editor (see below). |
| `og-image.png` | 1200×630 link-preview image referenced by the Open Graph / Twitter meta tags. |
| `favicon.svg` | Browser tab icon. |
| `polygentic-logo-*.svg` | Wordmark assets (the page currently renders the wordmark as text). |
| `CNAME` | Custom domain for GitHub Pages. |

The design was approved in a Claude Design canvas:
https://claude.ai/code/artifact/ab4d0b91-80e5-4dfb-b062-ef106ec736a6

## Local development

```bash
python3 -m http.server 8765 --bind 127.0.0.1
# open http://127.0.0.1:8765/
```

Any static server works. The form posts to the real backend even locally, so use a throwaway
message or stub `fetch` in DevTools when testing.

## Deploy

GitHub Pages serves the `main` branch at https://polygentic.com (HTTPS enforced, custom domain
via `CNAME`). Merging to `main` deploys; it usually goes live within a minute.

Work happens on feature branches with a PR into `main`.

## Contact form backend

The form POSTs JSON to a Google Apps Script web app that appends a row to a Google Sheet:

- Sheet: https://docs.google.com/spreadsheets/d/1U0ViF9GANGhojsGZZQWbu55FNSJYg4tI1ShLHIY_AFc
- Columns: ISO timestamp, name, email, message, honeypot (always empty for real rows)
- Web app deployment URL: in `script.js` (`APPS_SCRIPT_URL`) and at the top of `Code.gs`

`Code.gs` in this repo is the source of truth for the backend, but it is not deployed from here.
To ship a change:

1. Open the bound Apps Script project from the Sheet (Extensions → Apps Script).
2. Replace the contents of `Code.gs` with this repo's copy and save.
3. Deploy → Manage deployments → pencil icon on the existing deployment → Version: **New version** → Deploy.

Editing the existing deployment keeps the same URL, so the site needs no change. Creating a
*new* deployment would change the URL and require updating `APPS_SCRIPT_URL` in `script.js`.

## Security

GitHub Pages cannot set custom HTTP headers, so protections live in the page and the backend.

**Page**

- `Content-Security-Policy` meta tag: only same-origin scripts, styles, fonts and images; network
  calls only to `script.google.com` and `script.googleusercontent.com` (the Apps Script redirect
  target); no plugins, no `<base>` override, no native form submission. `frame-ancestors` cannot be
  set from a meta tag, so clickjacking protection is not available on Pages.
- `referrer` meta: `strict-origin-when-cross-origin`.
- No inline scripts or styles; no third-party assets.
- Inputs carry `maxlength` matching the backend caps.

**Form / backend (`Code.gs`)**

- Honeypot field `_gotcha`: if filled, the backend returns success and writes nothing.
- Time-on-page: the client sends `_elapsed` (ms since load); submissions under 2 s are rejected.
- Validation: all three fields required; name ≤ 100, email ≤ 254 and well-formed, message ≤ 2000;
  body must be JSON under 8 KB.
- Spreadsheet formula injection: values starting with `=`, `+`, `-`, `@` or `|` are prefixed with
  an apostrophe so Sheets stores them as text. C0 control characters (except newline) are stripped.
- Rate limits via `CacheService`: 10 submissions per minute globally, 3 per hour per email address.
- Errors returned to the client are generic codes; stack traces go to the Apps Script log only.
- `GET` requests are refused.

**What this does not do**

- No CAPTCHA. If spam gets through the honeypot and rate limits, that is the next step.
- No email notification on submission; check the Sheet.
- The Apps Script URL and Sheet ID are public by design (the Sheet itself requires sign-in).

## Verifying a change to the form end to end

1. Deploy the backend as above.
2. Open https://polygentic.com, submit a short test message.
3. Confirm a new row appears in the Sheet with an empty honeypot column.
