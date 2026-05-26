# Career Website Build-Out Design

**Date:** 2026-05-27
**Status:** Approved

## Overview

Build out `leebaroneau/website` — a personal CV/portfolio site for Lee Barone. Starting point is a working vanilla JS static site generator with profile/resume JSON data, 6 projects, Playwright PDF export, and a private job-search dashboard. Four work streams: repo reorganisation, Coolify deployment with contact form backend, visual redesign (bold/distinctive), and content audit.

## Scope

| Stream | What changes |
| :--- | :--- |
| Repo move | `leebaroneau/career/00_repos/website/` → `leebaroneau/00_repos/website/` |
| Infrastructure | Express server, Dockerfile, GitHub Actions, Coolify setup |
| Contact form | `POST /api/contact` → Resend → email to `lee@haverford.com.au` |
| Visual redesign | Full CSS overhaul + template updates, bold/distinctive direction |
| Content audit | Profile, resume, case studies — fix gaps, sharpen copy |

**Out of scope:** Private job-search layer (`career/applications/`, `career/cover-letters/`, `career/dashboard.json`), project selection (which 4 are featured), framework migration.

---

## 1. Repo Reorganisation

### Move

```
FROM: leebaroneau/career/00_repos/website/
TO:   leebaroneau/00_repos/website/
```

Use `git mv` to preserve history. Update `leebaroneau/00_repos.md` to add the website repo row.

### GitHub remote

Create public repo `leebaroneau/website`. Push `main` branch. Repo is the source of truth for Coolify deploys.

### Updated repo structure

```
leebaroneau/00_repos/website/
├── career/                    ← data layer (profile, resume, job-search)
├── projects/                  ← case studies and project data
├── scripts/                   ← build-site.mjs, build-pdf.mjs, new-project.mjs
├── templates/                 ← site.mjs (HTML rendering — visual overhaul here)
├── styles/
│   ├── site.css               ← full redesign
│   └── print.css              ← resume print styles (minor updates)
├── dist/                      ← generated output (gitignored)
├── server/
│   ├── index.mjs              ← Express server: serves dist/, mounts /api
│   └── contact.mjs            ← POST /api/contact handler
├── Dockerfile
├── .env.example
├── .github/
│   └── workflows/
│       └── deploy.yml         ← build → push GHCR image → trigger Coolify
├── docs/
│   ├── content-architecture.md
│   └── specs/
│       └── 2026-05-27-career-website-build-out-design.md
└── package.json               ← add express, @resend/node
```

---

## 2. Infrastructure

### Express server (`server/index.mjs`)

- Serves `dist/` as static files
- Mounts `/api/contact` route from `contact.mjs`
- Listens on `PORT` env var (default `3000`)
- No sessions, no DB, no middleware beyond `express.json()` and static

### Contact form (`server/contact.mjs`)

**Endpoint:** `POST /api/contact`

**Request body:**
```json
{ "name": "string", "email": "string", "message": "string" }
```

**Validation:**
- All three fields required, non-empty
- Email must match basic format
- Message max 2000 chars
- Returns `400` with `{ error: "..." }` on validation failure

**Happy path:**
1. Validate
2. Call Resend API: send email to `CONTACT_EMAIL` with name, sender email, message
3. Return `200 { ok: true }`

**Error handling:**
- Resend API failure → `500 { error: "Failed to send message. Please try again." }`
- Never expose internal error details to client

**Env vars required:**
```
RESEND_API_KEY=re_...
CONTACT_EMAIL=lee@haverford.com.au
```

### Dockerfile

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npx playwright install --with-deps chromium
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server/index.mjs"]
```

Note: `npm ci` (not `--omit=dev`) because Playwright is a dev dependency needed at build time. The final image includes dev deps but the surface area is acceptable for a personal site. If image size becomes a concern, use a multi-stage build.

Build runs at image build time — `dist/` is baked in. No runtime build step.

### GitHub Actions (`deploy.yml`)

Trigger: push to `main`

Steps:
1. Checkout
2. `npm ci`
3. `npx playwright install chromium` (needed for PDF build)
4. `npm run build`
5. Build Docker image, push to GHCR (`ghcr.io/leebaroneau/website:latest`)
6. `curl` Coolify deploy webhook to trigger redeploy

Secrets needed: `GHCR_TOKEN`, `COOLIFY_WEBHOOK_URL`

### Coolify setup

- App type: Docker image from GHCR
- Image: `ghcr.io/leebaroneau/website:latest`
- Port: `3000`
- Env vars: `RESEND_API_KEY`, `CONTACT_EMAIL`
- Custom domain: user's domain → Traefik handles TLS
- Deploy trigger: webhook called by GitHub Actions

---

## 3. Visual Redesign

### Direction

Editorial, high-contrast, typographically confident. Looks like it was made by someone who cares about UI. Warm tones, strong type scale, monospace metadata. Not a SaaS landing page.

### Color system

```css
--bg:             #f5f4f0;   /* warm off-white — replaces cold blue-grey */
--bg-dark:        #0d1117;   /* hero, contact, footer */
--surface:        #ffffff;
--text:           #0d1117;
--text-on-dark:   #f5f4f0;
--muted:          #5c6b82;
--muted-on-dark:  #8b99b0;
--accent:         #e8440a;   /* burnt orange — primary CTA, highlights */
--accent-blue:    #2563eb;   /* links only */
--line:           rgba(13, 17, 23, 0.10);
--line-dark:      rgba(245, 244, 240, 0.12);
```

Remove decorative radial gradients and the grid overlay background texture.

### Typography

| Role | Font | Size | Weight |
| :--- | :--- | :--- | :--- |
| Hero display | Fraunces | 80–96px | 700 |
| Section headings | Fraunces | 36–48px | 500 |
| Subheadings | Fraunces | 24–28px | 500 |
| Body | Instrument Sans | 16px | 400 |
| Labels / tags / dates | JetBrains Mono | 12–13px | 400 |

Add JetBrains Mono to the Google Fonts import. Use it for: eyebrow labels, tag pills, dates, proof stat values, metadata fields.

### Layout changes

**Hero (dark section)**
- Full-width dark background (`--bg-dark`)
- Name at 96px Fraunces — the dominant element
- Role in JetBrains Mono below
- One-sentence availability statement
- Single primary CTA ("Download resume") + secondary ("View resume")
- LinkedIn pill link
- Remove sidebar panel from hero — it fragments first impression

**Proof stats**
- Full-width strip, no cards
- Stat value in JetBrains Mono at 40px
- Label in Instrument Sans below
- Separated by thin vertical rules
- Trust strip of company names below it

**Projects grid**
- Featured project (first) spans full width or 2/3 width — larger presence
- Remaining 3 in equal columns below
- Cards: white surface, `--accent` border-left on hover, no rounded-corner softness — sharp `4px` radius

**Experience timeline**
- Entries get more vertical space
- Company + role in stronger hierarchy (role is `h3` in Fraunces, company in muted Instrument Sans)
- Period in JetBrains Mono

**Contact section**
- Dark background (bookends the hero visually)
- Contact form inline — name, email, message, submit
- Submit button uses `--accent`
- Inline success / error state below submit

**Footer**
- Dark, minimal — just the generated-from note

### What stays

- Skip link, focus-visible states, semantic HTML — accessibility unchanged
- Print styles — resume PDF layout untouched
- Two-surface model (live site, dashboard, gateway) — structure unchanged
- Section order — already optimised for recruiter flow

---

## 4. Content Audit

Audit runs against these files during implementation. Changes go into the data files only — templates render whatever the data says.

### `career/profile.json`

- **Tools list:** Add React, TypeScript, Git, Node.js, Vite — remove or demote anything no longer current
- **Proof stats:** Each stat must be specific and defensible — replace any vague claims
- **Headline:** Tighten to match bold direction — shorter, more confident

### `career/resume.json`

- **Experience highlights:** Each bullet must be achievement-focused, not duty-focused ("Reduced page load by 40%" not "Responsible for page performance")
- **Summary:** Read for tone — should sound confident, not hedged

### `projects/*/case-study.md`

- Read all 6 case studies
- Flag any that are placeholder / thin (< 150 words of real content)
- Thin ones get a content stub with clear prompts for what to fill in — don't invent content

### `projects/*/project.json`

- Check `skills` arrays are current and accurate
- Check `links` are live (no dead URLs)
- Check `featured: true` is set on the 4 strongest projects

---

## 5. Contact Form — Frontend

The form lives in the contact section of `dist/live/index.html` (rendered by `templates/site.mjs`).

```html
<form id="contact-form">
  <label for="contact-name">Name</label>
  <input id="contact-name" name="name" type="text" required>

  <label for="contact-email">Email</label>
  <input id="contact-email" name="email" type="email" required>

  <label for="contact-message">Message</label>
  <textarea id="contact-message" name="message" rows="5" required></textarea>

  <button type="submit">Send message</button>
  <p id="contact-status" aria-live="polite"></p>
</form>
```

Inline `<script>` in the page handles `submit`:
1. `preventDefault()`
2. Disable submit button, set status to "Sending…"
3. `fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) })`
4. On success: show "Message sent — I'll be in touch." Clear form.
5. On error: show error message. Re-enable button.

`aria-live="polite"` on status element ensures screen reader announces outcome.

---

## Success Criteria

- [ ] Repo moved to `leebaroneau/00_repos/website/`, GitHub remote live
- [ ] Push to `main` triggers build → GHCR push → Coolify redeploy
- [ ] Site live at custom domain via Coolify
- [ ] `POST /api/contact` delivers email to `lee@haverford.com.au`
- [ ] Contact form shows inline success/error, no page reload
- [ ] Visual redesign matches bold/distinctive direction (dark hero, warm bg, orange accent, JetBrains Mono metadata)
- [ ] Content audit complete — no placeholder case studies, no outdated tools
- [ ] Dashboard remains accessible (not publicly linked, but not auth-gated in this phase)
- [ ] Resume PDF generation still works in CI
- [ ] Accessibility: skip link present, focus states visible, form labels correct
