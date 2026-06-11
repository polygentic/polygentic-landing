# Polygentic.com Site Redesign — Design Spec

## Overview

Redesign polygentic.com from a minimal splash page to a single-page site that communicates what Polygentic does and provides a contact form for inbound inquiries (funders, partners, etc.). The site stays simple, stealth-appropriate, and requires no backend infrastructure beyond Google Apps Script.

## Constraints

- Single page, no navigation
- Static HTML/CSS/JS — no framework, no dependencies
- Stealth posture — no product names, no roadmap, no team details
- Less is more — every element must earn its place

## Page Sections

### 1. Hero

- POLYGENTIC wordmark (existing SVG logo)
- Tagline: "Application development for highly regulated industries."
- Left-aligned, generous top padding

### 2. Get in Touch

- Section label: "Get in touch" (uppercase, small, muted)
- Form fields:
  - Name (text, required)
  - Email (email, required)
  - Message (textarea, required)
- Submit button: "Send"
- Form submits to Google Apps Script → Google Sheet (same pattern as bijoux.app waitlist)
- Client-side validation before submission
- Honeypot field for bot protection
- States: default, loading (spinner on button), success confirmation, error message

### 3. Footer

- Copyright: "© 2025 Polygentic, Inc."
- Centered, minimal

## Form Backend

Replicate the bijoux-landing approach:

1. Create a new Google Sheet with columns: timestamp, name, email, message, honeypot
2. Create a Google Apps Script (Code.gs) that:
   - Receives POST requests as JSON
   - Checks honeypot field (reject if filled)
   - Validates required fields (name, email)
   - Appends row to sheet
   - Returns JSON response: `{ result: "success" | "error" }`
3. Deploy as Web App (execute as owner, anyone can access)
4. Frontend POSTs to the Apps Script URL with `Content-Type: text/plain`

No confirmation email needed (unlike Bijoux waitlist). Keep it simple.

## Visual Direction

- Clean, minimal, typography-driven
- No images, icons, or decorative elements
- Generous whitespace between sections
- Light or dark palette — to be decided during implementation (current site is white; open to either direction)
- Font: system fonts (current stack) or a single clean sans-serif
- Form inputs: subtle borders, minimal styling, clear focus states

## Technical Notes

- Existing files to modify: `index.html`, `styles.css`, `script.js`
- New file: `Code.gs` (reference for Google Apps Script setup, not deployed from repo)
- Keep the existing SVG logo assets
- No build step, no bundler, no package.json
- Google Apps Script URL will be configured as a constant in `script.js`

## Out of Scope

- Product descriptions or names
- Team/about section
- Analytics or tracking
- SEO metadata beyond basics (title, description)
- Multiple pages or navigation
- Confirmation emails on form submission
