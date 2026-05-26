# Career Website Build-Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the career website repo, add Express + Resend contact form, deploy via Coolify, and ship a bold visual redesign with content improvements.

**Architecture:** Vanilla JS static site generator builds `dist/` at Docker image build time. A minimal Express server serves `dist/` and adds a single `POST /api/contact` endpoint backed by Resend. GitHub Actions builds the image, pushes to GHCR, and triggers a Coolify redeploy.

**Tech Stack:** Node 22, Express 5, @resend/node, Playwright (PDF build), Docker, GitHub Actions, Coolify

**Spec:** `docs/specs/2026-05-27-career-website-build-out-design.md`

---

## File Map

| File | Action | Purpose |
| :--- | :--- | :--- |
| `server/index.mjs` | Create | Express server — serves dist/, mounts /api |
| `server/contact.mjs` | Create | POST /api/contact — validates + sends via Resend |
| `server/contact.test.mjs` | Create | Node built-in test runner — validateContactInput tests |
| `Dockerfile` | Create | Node 22 Alpine, builds dist/, runs server |
| `.env.example` | Create | Required env var documentation |
| `.github/workflows/deploy.yml` | Create | Build → push GHCR → trigger Coolify |
| `styles/site.css` | Replace | Full visual redesign |
| `templates/site.mjs` | Modify | Hero + contact structure, contact form HTML |
| `package.json` | Modify | Add express, @resend/node, test script |
| `career/profile.json` | Modify | Content audit — tools, proof stats, headline |
| `career/resume.json` | Modify | Content audit — experience highlights |
| `projects/*/project.json` | Review | Verify featured, public, skills are current |
| `projects/*/case-study.md` | Review | Identify and flag thin/placeholder content |

---

## Task 1: Repo Move + GitHub Remote

**Files:**
- Move: `leebaroneau/career/00_repos/website/` → `leebaroneau/00_repos/website/`
- Modify: `leebaroneau/00_repos.md`

- [ ] **Step 1: Move the repo locally**

Run from the lee-dashboard root:
```bash
mv leebaroneau/career/00_repos/website leebaroneau/00_repos/website
```

- [ ] **Step 2: Verify the move**

```bash
cd leebaroneau/00_repos/website
git log --oneline -3
```
Expected: same commits as before — `32210bd Initial commit` at minimum.

- [ ] **Step 3: Create GitHub repo**

```bash
gh repo create leebaroneau/website --public --description "Lee Barone — CV and portfolio site"
```

- [ ] **Step 4: Add remote and push**

```bash
git remote add origin https://github.com/leebaroneau/website.git
git push -u origin main
```
Expected: push succeeds, `main` visible on GitHub.

- [ ] **Step 5: Update 00_repos.md**

Open `leebaroneau/00_repos.md`. Add or update a row for the website repo:
```markdown
| `website/` | https://github.com/leebaroneau/website | Personal CV and portfolio site |
```

- [ ] **Step 6: Commit 00_repos.md from lee-dashboard**

```bash
cd /path/to/lee-dashboard
git add leebaroneau/00_repos.md
git commit -m "chore(career): move website repo to leebaroneau/00_repos"
```

---

## Task 2: Add Dependencies + Test Script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Express and Resend**

From `leebaroneau/00_repos/website/`:
```bash
npm install express @resend/node
```

- [ ] **Step 2: Add test script to package.json**

Open `package.json`. The `"scripts"` block should become:
```json
{
  "name": "lee-barone-career",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "npm run build:site && npm run build:pdf",
    "build:site": "node scripts/build-site.mjs",
    "build:pdf": "node scripts/build-pdf.mjs",
    "preview": "python3 -m http.server 4173 -d dist",
    "start": "node server/index.mjs",
    "test": "node --test server/contact.test.mjs",
    "project:new": "node scripts/new-project.mjs"
  },
  "dependencies": {
    "@resend/node": "^4.0.0",
    "express": "^5.0.1",
    "marked": "^15.0.7",
    "playwright": "^1.59.1"
  }
}
```

(Exact versions shown above will be whatever `npm install` resolved — don't hardcode versions, just verify express and @resend/node appear under `dependencies`.)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add express and @resend/node"
```

---

## Task 3: Contact Form Validation — TDD

**Files:**
- Create: `server/contact.mjs` (validation export only — handler added in Task 4)
- Create: `server/contact.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `server/contact.test.mjs`:
```javascript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateContactInput } from "./contact.mjs";

describe("validateContactInput", () => {
  it("returns empty array for valid input", () => {
    const errors = validateContactInput({
      name: "Alice Smith",
      email: "alice@example.com",
      message: "Hello there"
    });
    assert.deepEqual(errors, []);
  });

  it("requires name", () => {
    const errors = validateContactInput({ name: "", email: "a@b.com", message: "Hi" });
    assert.ok(errors.some((e) => e.toLowerCase().includes("name")));
  });

  it("requires name to be non-whitespace", () => {
    const errors = validateContactInput({ name: "   ", email: "a@b.com", message: "Hi" });
    assert.ok(errors.some((e) => e.toLowerCase().includes("name")));
  });

  it("requires email", () => {
    const errors = validateContactInput({ name: "Alice", email: "", message: "Hi" });
    assert.ok(errors.some((e) => e.toLowerCase().includes("email")));
  });

  it("rejects invalid email format", () => {
    const errors = validateContactInput({ name: "Alice", email: "notanemail", message: "Hi" });
    assert.ok(errors.some((e) => e.toLowerCase().includes("valid")));
  });

  it("accepts email with subdomain", () => {
    const errors = validateContactInput({
      name: "Alice",
      email: "alice@mail.example.com",
      message: "Hi"
    });
    assert.deepEqual(errors, []);
  });

  it("requires message", () => {
    const errors = validateContactInput({ name: "Alice", email: "a@b.com", message: "" });
    assert.ok(errors.some((e) => e.toLowerCase().includes("message")));
  });

  it("rejects message over 2000 chars", () => {
    const errors = validateContactInput({
      name: "Alice",
      email: "a@b.com",
      message: "x".repeat(2001)
    });
    assert.ok(errors.some((e) => e.includes("2000")));
  });

  it("accepts message of exactly 2000 chars", () => {
    const errors = validateContactInput({
      name: "Alice",
      email: "a@b.com",
      message: "x".repeat(2000)
    });
    assert.deepEqual(errors, []);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```
Expected: error like `Cannot find module './contact.mjs'` or similar import failure.

- [ ] **Step 3: Create server/contact.mjs with validateContactInput**

Create `server/contact.mjs`:
```javascript
import { Resend } from "@resend/node";

export function validateContactInput({ name, email, message }) {
  const errors = [];

  if (!name || !name.trim()) {
    errors.push("Name is required.");
  }

  if (!email || !email.trim()) {
    errors.push("Email is required.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("Email must be a valid address.");
  }

  if (!message || !message.trim()) {
    errors.push("Message is required.");
  } else if (message.length > 2000) {
    errors.push("Message must be 2000 characters or fewer.");
  }

  return errors;
}

export async function handleContact(req, res) {
  // Implemented in Task 4
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```
Expected: all 9 tests pass, no failures.

- [ ] **Step 5: Commit**

```bash
git add server/contact.mjs server/contact.test.mjs
git commit -m "feat: add contact form validation with tests"
```

---

## Task 4: Contact Handler + Express Server

**Files:**
- Modify: `server/contact.mjs` (complete handleContact)
- Create: `server/index.mjs`

- [ ] **Step 1: Complete handleContact in server/contact.mjs**

Replace the stub `handleContact` with:
```javascript
export async function handleContact(req, res) {
  const { name, email, message } = req.body ?? {};
  const errors = validateContactInput({ name, email, message });

  if (errors.length) {
    return res.status(400).json({ error: errors.join(" ") });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const contactEmail = process.env.CONTACT_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: contactEmail,
      subject: `Portfolio contact from ${name.trim()}`,
      text: [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        "",
        "Message:",
        message.trim()
      ].join("\n")
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Resend error:", err?.message ?? err);
    return res.status(500).json({ error: "Failed to send message. Please try again." });
  }
}
```

- [ ] **Step 2: Create server/index.mjs**

```javascript
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { handleContact } from "./contact.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.static(join(__dirname, "../dist")));
app.post("/api/contact", handleContact);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 3: Verify tests still pass**

```bash
npm test
```
Expected: all 9 tests pass (handleContact change doesn't break validation tests).

- [ ] **Step 4: Smoke test the server locally**

```bash
npm run build
RESEND_API_KEY=test CONTACT_EMAIL=test@example.com RESEND_FROM_EMAIL=from@example.com npm start
```
In a second terminal:
```bash
curl -s -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"","message":""}' | python3 -m json.tool
```
Expected: `{"error": "Name is required. Email is required. Message is required."}`

```bash
curl -s http://localhost:3000/ | head -5
```
Expected: `<!doctype html>` (serves dist/index.html).

Stop the server with `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add server/contact.mjs server/index.mjs
git commit -m "feat: add Express server with /api/contact endpoint"
```

---

## Task 5: Dockerfile + .env.example

**Files:**
- Create: `Dockerfile`
- Create: `.env.example`
- Modify: `.gitignore` (add .env)

- [ ] **Step 1: Create Dockerfile**

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

- [ ] **Step 2: Create .env.example**

```bash
# Required — get your key from resend.com
RESEND_API_KEY=re_your_key_here

# The email address that receives contact form submissions
CONTACT_EMAIL=lee@haverford.com.au

# The verified sender address in your Resend account
# Requires domain verification at resend.com/domains
RESEND_FROM_EMAIL=hello@yourdomain.com

# Server port (optional, defaults to 3000)
PORT=3000
```

- [ ] **Step 3: Ensure .env is gitignored**

Open `.gitignore`. Verify `.env` is present. If not, add it:
```
.env
```

- [ ] **Step 4: Verify Dockerfile builds**

```bash
docker build -t lee-website-test .
```
Expected: build succeeds, final layer logs `Built workspace with N project entries.`

If Docker isn't installed locally, skip this step — CI will catch build failures.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .env.example .gitignore
git commit -m "chore: add Dockerfile and .env.example"
```

---

## Task 6: GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Prerequisites before this task works:**
- Go to `https://github.com/leebaroneau/website/settings/secrets/actions`
- Add secret `COOLIFY_DEPLOY_WEBHOOK` — get this from Coolify app settings → Webhooks (set up app first in Task 11, then add this secret)

- [ ] **Step 1: Create .github/workflows/deploy.yml**

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build site
        run: npm run build

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/leebaroneau/website:latest

      - name: Trigger Coolify deploy
        if: ${{ secrets.COOLIFY_DEPLOY_WEBHOOK != '' }}
        run: |
          curl -s -X GET "${{ secrets.COOLIFY_DEPLOY_WEBHOOK }}" \
            --fail-with-body
```

Note: the `if` condition on the Coolify step means the workflow succeeds even before the secret is set — useful during initial setup.

- [ ] **Step 2: Push and watch the workflow run**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions build and deploy workflow"
git push
```

Go to `https://github.com/leebaroneau/website/actions` and watch the workflow. Expected: all steps green. The Coolify step will be skipped until you add the secret.

---

## Task 7: Contact Form Frontend

**Files:**
- Modify: `templates/site.mjs` — add `renderContactSection` helper, update `renderLiveHomePage`

The current contact section inside `renderLiveHomePage` is a simple card with email/phone links. Replace it with a full-width dark section containing the form. The section moves **outside** `.page-shell` in the template (see Task 9 for the full hero restructure — this task only handles the contact section).

- [ ] **Step 1: Add renderContactSection to templates/site.mjs**

Add this function before `renderGatewayPage` at the bottom of `templates/site.mjs`:

```javascript
function renderContactSection(profile) {
  const contactLinks = [
    `<a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a>`,
    `<a href="tel:${escapeHtml(profile.phone.replace(/\s+/g, ""))}">${escapeHtml(profile.phone)}</a>`,
    `<span>${escapeHtml(profile.location)}</span>`
  ].join("");

  return `
    <section class="contact-section" id="contact">
      <div class="contact-inner">
        <p class="eyebrow">Contact</p>
        <h2>Reach out if you want to talk frontend, UX-minded product work or ecommerce execution</h2>
        <form id="contact-form" class="contact-form" novalidate>
          <div>
            <label for="contact-name">Name</label>
            <input id="contact-name" name="name" type="text" autocomplete="name" required>
          </div>
          <div>
            <label for="contact-email">Email</label>
            <input id="contact-email" name="email" type="email" autocomplete="email" required>
          </div>
          <div>
            <label for="contact-message">Message</label>
            <textarea id="contact-message" name="message" rows="5" required></textarea>
          </div>
          <button class="button button-primary" type="submit">Send message</button>
          <p class="contact-status" id="contact-status" aria-live="polite" aria-atomic="true"></p>
        </form>
        <div class="contact-links-row">
          ${contactLinks}
          ${renderExternalLinks(profile.publicLinks ?? [], "hero-links")}
        </div>
      </div>
      <script>
(function() {
  var form = document.getElementById('contact-form');
  var status = document.getElementById('contact-status');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var data = {
      name: form.elements['name'].value,
      email: form.elements['email'].value,
      message: form.elements['message'].value
    };
    btn.disabled = true;
    status.textContent = 'Sending…';
    status.className = 'contact-status';
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.ok) {
        status.textContent = 'Message sent — I’ll be in touch.';
        status.className = 'contact-status success';
        form.reset();
        btn.disabled = false;
      } else {
        throw new Error(json.error || 'Something went wrong.');
      }
    })
    .catch(function(err) {
      status.textContent = err.message;
      status.className = 'contact-status error';
      btn.disabled = false;
    });
  });
})();
      </script>
    </section>`;
}
```

- [ ] **Step 2: Update renderLiveHomePage to use renderContactSection**

In `renderLiveHomePage`, find the existing contact section:
```javascript
        <section class="section contact-card" id="contact">
          <p class="eyebrow">Contact</p>
          <h2>Reach out if you want to talk frontend, UX-minded product work or ecommerce execution</h2>
          <div class="contact-links">
            <a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a>
            <a href="tel:${escapeHtml(profile.phone.replace(/\s+/g, ""))}">${escapeHtml(profile.phone)}</a>
            <span>${escapeHtml(profile.location)}</span>
          </div>
          ${renderExternalLinks(profile.publicLinks ?? [], "hero-links")}
        </section>
```

Replace it with (inside the template literal, outside of `.page-shell` — this gets handled fully in Task 9; for now just replace the section content):
```javascript
        ${renderContactSection(profile)}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build:site
```
Expected: no errors. Check `dist/live/index.html` — search for `id="contact-form"` to verify the form rendered.

- [ ] **Step 4: Commit**

```bash
git add templates/site.mjs
git commit -m "feat: add contact form to live site template"
```

---

## Task 8: CSS Overhaul

**Files:**
- Replace: `styles/site.css`

This is a full replacement. The new CSS: warm off-white body, dark hero/contact/footer, burnt orange accent, JetBrains Mono for metadata, sharp 4px card radius, no glass blur, no decorative gradients.

- [ ] **Step 1: Replace styles/site.css with the following**

```css
@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");

:root {
  --bg:            #f5f4f0;
  --bg-dark:       #0d1117;
  --surface:       #ffffff;
  --text:          #0d1117;
  --text-on-dark:  #f5f4f0;
  --muted:         #5c6b82;
  --muted-on-dark: #8b99b0;
  --line:          rgba(13, 17, 23, 0.10);
  --line-dark:     rgba(245, 244, 240, 0.12);
  --accent:        #e8440a;
  --accent-blue:   #2563eb;
  --shadow:        0 4px 24px rgba(13, 17, 23, 0.07);
  --radius:        4px;
  --max-width:     1200px;
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  color: var(--text);
  font-family: "Instrument Sans", sans-serif;
  line-height: 1.6;
  background: var(--bg);
}

a { color: inherit; }

a:focus-visible,
button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}

/* ── Skip link ── */
.skip-link {
  position: absolute;
  left: 1rem;
  top: -3rem;
  z-index: 100;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  text-decoration: none;
  font-size: 0.9rem;
}
.skip-link:focus { top: 1rem; }

code {
  padding: 0.15rem 0.4rem;
  border-radius: 2px;
  background: rgba(13, 17, 23, 0.07);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.85em;
}

/* ── Site header ── */
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0.9rem 1.5rem;
  background: rgba(245, 244, 240, 0.92);
  backdrop-filter: blur(12px);
}

.site-page section,
.dashboard-page section {
  scroll-margin-top: 5rem;
}

.brand {
  display: inline-flex;
  flex-direction: column;
  gap: 0.1rem;
  text-decoration: none;
}

.brand-kicker {
  font-family: "JetBrains Mono", monospace;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.66rem;
  color: var(--muted);
}

.brand-name {
  font-weight: 700;
  font-size: 1rem;
}

.site-nav {
  display: flex;
  gap: 0.25rem;
  padding: 0.3rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
}

.site-nav a {
  text-decoration: none;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  font-size: 0.88rem;
}

.site-nav a:hover,
.site-nav a:focus-visible {
  background: rgba(13, 17, 23, 0.07);
  outline: none;
}

/* ── Page shell ── */
.page-shell,
.resume-shell {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* ── Hero ── */
.hero-section {
  background: var(--bg-dark);
  color: var(--text-on-dark);
  padding: 5rem 1.5rem 4.5rem;
}

.hero-inner {
  max-width: var(--max-width);
  margin: 0 auto;
}

.hero-eyebrow {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted-on-dark);
  margin: 0 0 1.2rem;
  display: block;
}

.hero-inner h1 {
  margin: 0 0 1rem;
  font-family: "Fraunces", serif;
  font-size: clamp(3.6rem, 9vw, 6.5rem);
  line-height: 0.95;
  font-weight: 700;
  color: var(--text-on-dark);
  letter-spacing: -0.02em;
}

.hero-tagline {
  margin: 0 0 2rem;
  font-size: clamp(1rem, 1.5vw, 1.15rem);
  max-width: 58ch;
  color: var(--muted-on-dark);
  line-height: 1.55;
}

.hero-links { margin-top: 0.75rem; }

.pill-link {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.85rem;
  border: 1px solid var(--line-dark);
  border-radius: 999px;
  text-decoration: none;
  font-size: 0.88rem;
  color: var(--muted-on-dark);
  transition: color 120ms, border-color 120ms;
}

.pill-link:hover {
  color: var(--text-on-dark);
  border-color: rgba(245, 244, 240, 0.35);
}

/* ── Sections ── */
.section { margin-top: 3.5rem; }

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-heading.compact { margin-bottom: 0.75rem; }

.eyebrow,
.meta-label {
  font-family: "JetBrains Mono", monospace;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.68rem;
  color: var(--muted);
  margin: 0 0 0.4rem;
  display: block;
}

.section-heading h2,
.info-panel h2,
.case-study h3,
.project-card h3 {
  margin: 0;
  font-family: "Fraunces", serif;
  line-height: 1.1;
}

.section-heading h2 {
  font-size: clamp(1.8rem, 2.4vw, 2.5rem);
  max-width: 22ch;
}

.section-copy {
  max-width: 32ch;
  color: var(--muted);
  font-size: 0.95rem;
}

/* ── Proof strip ── */
.proof-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.proof-card {
  padding: 1.5rem;
  background: var(--surface);
  border-right: 1px solid var(--line);
}

.proof-card:last-child { border-right: none; }

.proof-value {
  display: block;
  font-family: "JetBrains Mono", monospace;
  font-size: clamp(1.6rem, 2.6vw, 2.4rem);
  font-weight: 500;
  line-height: 1;
  color: var(--accent);
  margin: 0 0 0.45rem;
}

.proof-label {
  margin: 0;
  color: var(--muted);
  font-size: 0.88rem;
}

.trust-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.trust-chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.9rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--muted);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ── Overview grid ── */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.info-panel {
  padding: 1.5rem;
  background: var(--surface);
}

.info-panel h2 {
  font-size: 1.15rem;
  margin: 0 0 0.75rem;
}

/* ── Buttons ── */
.button-row,
.hero-links,
.link-list,
.tag-list,
.contact-links,
.resume-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.6rem;
  padding: 0.65rem 1.2rem;
  border-radius: 999px;
  text-decoration: none;
  border: 1px solid transparent;
  font-size: 0.9rem;
  font-weight: 600;
  transition: transform 130ms ease, background 130ms ease, border-color 130ms ease;
}

.button:hover,
.button:focus-visible {
  transform: translateY(-1px);
  outline: none;
}

.button-primary {
  color: #ffffff;
  background: var(--accent);
}

.button-primary:hover { background: #cf3c09; }

/* secondary variant adapts to dark/light context */
.button-secondary {
  border-color: var(--line-dark);
  color: var(--text-on-dark);
  background: transparent;
}

.page-shell .button-secondary,
.resume-shell .button-secondary {
  border-color: var(--line);
  color: var(--text);
  background: var(--surface);
}

/* ── Tags ── */
.tag {
  display: inline-flex;
  align-items: center;
  min-height: 1.8rem;
  padding: 0.2rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  background: var(--surface);
  color: var(--muted);
}

.tag-list.compact .tag {
  min-height: 1.6rem;
  font-size: 0.65rem;
}

.tag-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }

/* ── Timeline ── */
.timeline,
.case-study-list {
  display: grid;
  gap: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.timeline-card {
  display: grid;
  grid-template-columns: minmax(180px, 0.38fr) minmax(0, 1fr);
  background: var(--surface);
  border-top: 1px solid var(--line);
}

.timeline-card:first-child { border-top: none; }

.timeline-meta {
  padding: 1.5rem;
  border-right: 1px solid var(--line);
  background: rgba(245, 244, 240, 0.55);
}

.timeline-content { padding: 1.5rem; }

.timeline-period,
.project-period {
  font-family: "JetBrains Mono", monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.68rem;
  color: var(--muted);
  display: block;
  margin-bottom: 0.3rem;
}

.timeline-location {
  font-size: 0.82rem;
  color: var(--muted);
  margin-top: 0.3rem;
  display: block;
}

.timeline-content h3 {
  margin: 0 0 0.25rem;
  font-family: "Fraunces", serif;
  font-size: 1.2rem;
}

.timeline-company,
.project-role,
.resume-title {
  margin: 0 0 0.7rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.bullet-list {
  margin: 0.7rem 0 0;
  padding-left: 1.1rem;
}

.bullet-list li + li { margin-top: 0.4rem; }

.compact-list { margin-top: 0.35rem; }
.compact-list li + li { margin-top: 0.25rem; }

/* ── Project grid ── */
.project-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.project-grid > :first-child {
  grid-column: 1 / -1;
  border-bottom: 1px solid var(--line);
}

.project-card {
  display: grid;
  gap: 0.75rem;
  padding: 1.75rem;
  background: var(--surface);
  border-left: 1px solid var(--line);
  transition: background 120ms;
}

.project-grid > :first-child.project-card { border-left: none; }
.project-grid > :nth-child(2).project-card { border-left: none; }

.project-card:hover { background: rgba(245, 244, 240, 0.6); }

.project-card h3 {
  font-size: 1.35rem;
  margin: 0;
}

.project-card-top { display: grid; gap: 0.35rem; }

.project-anchor {
  width: fit-content;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--accent-blue);
}

/* ── Value pillars ── */
.value-pillar-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.value-pillar-card {
  padding: 1.75rem;
  background: var(--surface);
  border-left: 1px solid var(--line);
}

.value-pillar-card:first-child { border-left: none; }

.value-pillar-card h3 {
  margin: 0.35rem 0 0.6rem;
  font-family: "Fraunces", serif;
  font-size: 1.1rem;
}

.value-pillar-card p { color: var(--muted); margin: 0 0 0.75rem; }

/* ── Case studies ── */
.case-study {
  padding: 2rem 0;
  border-top: 1px solid var(--line);
}

.case-study:first-child { border-top: none; }

.case-study-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.case-study-side {
  display: grid;
  gap: 0.85rem;
  min-width: 200px;
}

.case-study-body > :first-child { margin-top: 1rem; }

.case-study-body h1,
.case-study-body h2,
.case-study-body h3 {
  margin-bottom: 0.3rem;
  font-family: "Fraunces", serif;
}

/* ── Resume CTA ── */
.resume-cta { margin-top: 3rem; }

.resume-cta-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 2rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}

.resume-cta-card h2 {
  margin: 0;
  font-family: "Fraunces", serif;
  font-size: clamp(1.3rem, 1.8vw, 1.9rem);
}

/* ── Contact section (dark, full-width sibling of page-shell) ── */
.contact-section {
  background: var(--bg-dark);
  color: var(--text-on-dark);
  padding: 5rem 1.5rem 4rem;
  margin-top: 4rem;
}

.contact-inner {
  max-width: var(--max-width);
  margin: 0 auto;
}

.contact-section .eyebrow { color: var(--muted-on-dark); }

.contact-section h2 {
  margin: 0.3rem 0 0;
  font-family: "Fraunces", serif;
  font-size: clamp(2rem, 3.2vw, 3rem);
  max-width: 24ch;
  color: var(--text-on-dark);
  line-height: 1.1;
}

.contact-form {
  display: grid;
  gap: 1rem;
  max-width: 520px;
  margin-top: 2.5rem;
}

.contact-form label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
  color: var(--muted-on-dark);
  font-family: "JetBrains Mono", monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.contact-form input,
.contact-form textarea {
  display: block;
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--line-dark);
  border-radius: var(--radius);
  background: rgba(245, 244, 240, 0.07);
  color: var(--text-on-dark);
  font-family: "Instrument Sans", sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 120ms, background 120ms;
}

.contact-form input:focus,
.contact-form textarea:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-color: transparent;
  background: rgba(245, 244, 240, 0.1);
}

.contact-form input::placeholder,
.contact-form textarea::placeholder {
  color: var(--muted-on-dark);
  opacity: 0.45;
}

.contact-form button[type="submit"] {
  width: fit-content;
}

.contact-status {
  font-size: 0.88rem;
  min-height: 1.4em;
  color: var(--muted-on-dark);
  margin: 0;
}

.contact-status.success { color: #4ade80; }
.contact-status.error { color: #f87171; }

.contact-links-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 2rem;
}

.contact-links-row a,
.contact-links-row span {
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--line-dark);
  text-decoration: none;
  color: var(--muted-on-dark);
  font-size: 0.88rem;
  transition: color 120ms, border-color 120ms;
}

.contact-links-row a:hover {
  color: var(--text-on-dark);
  border-color: rgba(245, 244, 240, 0.3);
}

/* ── Footer ── */
.site-footer {
  padding: 1.5rem 1.5rem 3rem;
  text-align: center;
  color: var(--muted-on-dark);
  background: var(--bg-dark);
  font-size: 0.82rem;
}

/* ── Shared card padding helpers ── */
.detail-stack {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.detail-stack div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--line);
}

.detail-stack strong {
  font-family: "Fraunces", serif;
  font-size: 1.35rem;
}

.detail-label {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
}

/* ── Resume page ── */
.resume-toolbar {
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.resume-sheet {
  padding: 2.5rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}

.resume-header {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(210px, 0.55fr);
  gap: 1.5rem;
  align-items: start;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--line);
}

.resume-sheet h1 {
  margin: 0 0 0.3rem;
  font-family: "Fraunces", serif;
  font-size: clamp(2.6rem, 4vw, 4rem);
  line-height: 1.0;
}

.resume-sheet h2 {
  margin: 0;
  font-family: "Fraunces", serif;
  font-size: 1.45rem;
}

.resume-contact { display: grid; gap: 0.5rem; }

.resume-contact a,
.resume-contact span {
  font-size: 0.88rem;
  text-decoration: none;
  color: var(--muted);
}

.resume-contact a:hover { color: var(--accent-blue); }

.resume-section { margin-top: 1.5rem; }

.resume-experience { display: grid; gap: 0; }

.resume-role-card {
  padding: 1rem 0;
  border-top: 1px solid var(--line);
}

.resume-role-card:first-child { border-top: none; }

.resume-role-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.resume-overview {
  margin: 0.3rem 0 0.5rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.resume-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.compact-projects { display: grid; gap: 0; }

.compact-project {
  padding: 0.7rem 0;
  border-top: 1px solid var(--line);
}

.compact-project:first-child { border-top: none; }

.compact-project h3 {
  margin: 0 0 0.2rem;
  font-family: "Fraunces", serif;
  font-size: 0.95rem;
}

.skill-group { padding: 0; }
.skill-group + .skill-group { margin-top: 1rem; }

.skill-group h3 {
  margin: 0 0 0.5rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted);
}

.education-item { padding: 0; }
.education-item + .education-item { margin-top: 1rem; }

.education-item h3 {
  margin: 0.2rem 0 0.1rem;
  font-family: "Fraunces", serif;
  font-size: 0.95rem;
}

/* ── Gateway page ── */
.gateway-shell { max-width: 860px; }

.gateway-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.surface-card {
  padding: 1.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}

.surface-card h2 {
  margin: 0.3rem 0 0.5rem;
  font-family: "Fraunces", serif;
}

/* ── Dashboard page ── */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.doc-grid,
.dashboard-project-list {
  display: grid;
  gap: 1rem;
}

.quick-link-card,
.doc-card,
.dashboard-project-card {
  padding: 1.4rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}

.quick-link-card h3,
.doc-card h3,
.dashboard-project-card h3 {
  margin: 0.2rem 0 0.4rem;
  font-family: "Fraunces", serif;
}

.quick-link-card p,
.doc-card p,
.dashboard-project-card p { color: var(--muted); }

.doc-card-header,
.dashboard-project-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.doc-card-body > :first-child,
.dashboard-note-block > :first-child { margin-top: 0; }

.doc-card-body h1,
.doc-card-body h2,
.doc-card-body h3 {
  margin: 0.9rem 0 0.25rem;
  font-family: "Fraunces", serif;
  font-size: 1rem;
}

.doc-card-body ul {
  margin: 0.4rem 0 0;
  padding-left: 1rem;
}

.file-chip {
  display: inline-flex;
  align-items: center;
  min-height: 1.8rem;
  max-width: 100%;
  padding: 0.25rem 0.55rem;
  border-radius: 2px;
  border: 1px solid var(--line);
  color: var(--muted);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  overflow-wrap: anywhere;
}

.dashboard-project-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.project-meta-card {
  padding: 0.85rem;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: rgba(245, 244, 240, 0.5);
}

.project-meta-card p { margin: 0; }

.dashboard-note-block { margin-top: 1rem; }

.screen-only { display: flex; }

/* ── Responsive ── */
@media (max-width: 980px) {
  .timeline-card {
    grid-template-columns: 1fr;
  }

  .timeline-meta {
    border-right: none;
    border-bottom: 1px solid var(--line);
  }

  .overview-grid,
  .resume-grid,
  .gateway-grid,
  .dashboard-grid,
  .project-meta-grid,
  .value-pillar-grid {
    grid-template-columns: 1fr;
  }

  .value-pillar-card { border-left: none; border-top: 1px solid var(--line); }
  .value-pillar-card:first-child { border-top: none; }

  .proof-grid { grid-template-columns: repeat(2, 1fr); }
  .proof-card:nth-child(2) { border-right: none; }
  .proof-card:nth-child(n+3) { border-top: 1px solid var(--line); }

  .project-grid { grid-template-columns: 1fr; }
  .project-grid > :first-child { grid-column: auto; border-bottom: none; }
  .project-card { border-left: none; border-top: 1px solid var(--line); }
  .project-card:first-child { border-top: none; }

  .case-study-header,
  .resume-header,
  .resume-cta-card,
  .doc-card-header,
  .dashboard-project-header {
    flex-direction: column;
  }

  .site-header,
  .section-heading {
    flex-direction: column;
    align-items: start;
  }

  .site-nav { overflow-x: auto; width: 100%; }
}

@media (max-width: 720px) {
  .hero-section { padding: 3rem 1rem 3rem; }
  .contact-section { padding: 3.5rem 1rem 3rem; }

  .page-shell,
  .resume-shell,
  .site-header {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .hero-inner h1 { font-size: 3rem; }

  .proof-grid { grid-template-columns: 1fr; }
  .proof-card { border-right: none; border-top: 1px solid var(--line); }
  .proof-card:first-child { border-top: none; }

  .resume-sheet { padding: 1.5rem; }
  .resume-cta-card { flex-direction: column; }
}
```

- [ ] **Step 2: Build and preview**

```bash
npm run build:site
npm run preview
```

Open `http://localhost:4173/live/index.html` in your browser. Verify:
- Body background is warm off-white (#f5f4f0), not blue-grey
- Timeline cards are bordered, no rounded glass blobs
- Tags use monospace font
- Eyebrows use monospace font
- Buttons: primary is orange, secondary is outlined

Stop the server with `Ctrl+C`.

- [ ] **Step 3: Commit**

```bash
git add styles/site.css
git commit -m "design: full CSS overhaul — warm palette, bold typography, JetBrains Mono metadata"
```

---

## Task 9: Template Restructure — Hero + Contact Full-Bleed

**Files:**
- Modify: `templates/site.mjs` — `renderLiveHomePage` only

The hero currently lives inside `<main class="page-shell">`. Move it outside, make it `<section class="hero-section">`. The contact section (added in Task 7) already uses `.contact-section` — move it outside `page-shell` too. The footer becomes dark.

- [ ] **Step 1: Rewrite renderLiveHomePage structure**

In `templates/site.mjs`, replace the entire `renderLiveHomePage` function with:

```javascript
export function renderLiveHomePage({ generatedOn, profile, resume, featuredProjects, paths }) {
  const liveSite = profile.liveSite ?? {};
  const featuredSelection = featuredProjects.slice(0, 4);

  return documentShell({
    title: `${profile.name} - Portfolio`,
    description: profile.siteDescription,
    bodyClass: "site-page",
    assetPrefix: paths.assetPrefix,
    content: `
      <a class="skip-link" href="#main-content">Skip to main content</a>
      <header class="site-header">
        <a class="brand" href="#main-content">
          <span class="brand-kicker">Portfolio</span>
          <span class="brand-name">${escapeHtml(profile.name)}</span>
        </a>
        <nav class="site-nav">
          <a href="#proof">Proof</a>
          <a href="#fit">Fit</a>
          <a href="#projects">Projects</a>
          <a href="#value">Value</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section class="hero-section" id="main-content">
        <div class="hero-inner">
          <p class="hero-eyebrow">${escapeHtml(profile.role)}</p>
          <h1>${escapeHtml(profile.name)}</h1>
          <p class="hero-tagline">${escapeHtml(profile.headline)}</p>
          <div class="button-row">
            <a class="button button-primary" href="${escapeHtml(paths.resumePdf)}">Download resume</a>
            <a class="button button-secondary" href="${escapeHtml(paths.resumePage)}">Open resume</a>
          </div>
          ${renderExternalLinks(profile.publicLinks ?? [], "hero-links")}
        </div>
      </section>

      <main class="page-shell">
        <section class="section" id="proof">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Proof</p>
              <h2>Fast trust signals for recruiters and hiring teams</h2>
            </div>
            <p class="section-copy">Experience range, domain strengths and the kind of work I have been trusted to ship.</p>
          </div>
          <div class="proof-grid">
            ${(liveSite.proofStats ?? []).map(renderProofStat).join("")}
          </div>
          <div class="trust-strip" aria-label="Recent companies and environments">
            ${(liveSite.trustSignals ?? []).map((item) => `<span class="trust-chip">${escapeHtml(item)}</span>`).join("")}
          </div>
        </section>

        <section class="overview-grid section" id="fit">
          <article class="info-panel">
            <p class="eyebrow">Best-fit roles</p>
            <h2>Where I am most likely to create value quickly</h2>
            ${renderTagList(liveSite.targetRoles ?? [])}
          </article>
          <article class="info-panel">
            <p class="eyebrow">Best-fit teams</p>
            <h2>The environments I am actively optimising for</h2>
            ${renderTagList(liveSite.idealEnvironment ?? [])}
          </article>
          <article class="info-panel">
            <p class="eyebrow">Career priorities</p>
            <h2>What makes a role rewarding and worth building around</h2>
            ${renderTagList(liveSite.careerPriorities ?? [])}
          </article>
        </section>

        <section class="section" id="projects">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Selected work</p>
              <h2>Case studies that best represent my frontend and UX-adjacent strengths</h2>
            </div>
            <p class="section-copy">Selective by design. The stories I would want a hiring team to see first.</p>
          </div>
          <div class="project-grid">
            ${featuredSelection.map((project) => renderProjectCard(project, `#project-${project.slug}`)).join("")}
          </div>
        </section>

        <section class="section" id="value">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Value</p>
              <h2>What I bring to a frontend team beyond implementation alone</h2>
            </div>
            <p class="section-copy">How I think, where I add leverage, why my background is useful in cross-functional teams.</p>
          </div>
          <div class="value-pillar-grid">
            ${(liveSite.valuePillars ?? []).map(renderValuePillar).join("")}
          </div>
        </section>

        <section class="section" id="experience">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Experience</p>
              <h2>Frontend delivery informed by design, accessibility and digital operations</h2>
            </div>
            <p class="section-copy">${escapeHtml(resume.summary[0])}</p>
          </div>
          <div class="timeline">
            ${resume.experience.map(renderExperienceCard).join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Case studies</p>
              <h2>Detailed project stories</h2>
            </div>
            <p class="section-copy">Each story is backed by the same source data used for resume generation.</p>
          </div>
          <div class="case-study-list">
            ${featuredSelection.map(renderProjectSection).join("")}
          </div>
        </section>

        <section class="resume-cta section">
          <div class="resume-cta-card">
            <div>
              <p class="eyebrow">Resume system</p>
              <h2>Live resume and PDF generated from the same source files</h2>
              <p>Update the data once, rebuild, and everything stays aligned.</p>
            </div>
            <div class="button-row">
              <a class="button button-primary" href="${escapeHtml(paths.resumePdf)}">Download PDF</a>
              <a class="button button-secondary" href="${escapeHtml(paths.resumePage)}">Open resume page</a>
            </div>
          </div>
        </section>
      </main>

      ${renderContactSection(profile)}

      <footer class="site-footer">
        <p>Generated from <code>career/</code> and <code>projects/</code>.</p>
      </footer>
    `
  });
}
```

Also update `renderProofStat` to use new class names (the CSS uses `.proof-card` / `.proof-value` / `.proof-label` which are already correct — verify the existing `renderProofStat` function still matches):
```javascript
function renderProofStat(item) {
  return `<article class="proof-card">
    <span class="proof-value">${escapeHtml(item.value)}</span>
    <p class="proof-label">${escapeHtml(item.label)}</p>
  </article>`;
}
```

- [ ] **Step 2: Build and preview**

```bash
npm run build:site
npm run preview
```

Open `http://localhost:4173/live/index.html`. Check:
- Hero is full-width dark, `Lee Barone` in large Fraunces
- Body content sections have warm off-white background
- Contact section is full-width dark at the bottom
- Footer is dark
- Nav links scroll to correct sections

- [ ] **Step 3: Check resume page still works**

Open `http://localhost:4173/live/resume.html`. Should render the resume sheet unchanged.

- [ ] **Step 4: Commit**

```bash
git add templates/site.mjs
git commit -m "design: restructure live page — dark hero, full-bleed contact section"
```

---

## Task 10: Content Audit

**Files:**
- Modify: `career/profile.json`
- Modify: `career/resume.json`
- Review (and update as needed): `projects/*/case-study.md`, `projects/*/project.json`

- [ ] **Step 1: Update profile.json — tools list**

Open `career/profile.json`. The current `tools` array is missing modern items. Replace it with a current, accurate list. At minimum add what's currently true and remove what isn't:

```json
"tools": [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Shopify Liquid",
  "Tailwind CSS",
  "Google Tag Manager",
  "Google Analytics",
  "Adobe Creative Cloud",
  "Craft CMS",
  "HTML email",
  "Git",
  "Node.js"
]
```

Remove any tool you no longer use. Add anything current that's missing. This list appears in `profile.json` — it's distinct from `resume.json` `skillGroups`.

- [ ] **Step 2: Update profile.json — proof stats**

Each proof stat should be specific and defensible. Review each item in `proofStats`. Replace vague stats with specific, verifiable claims. Example:

Current (vague):
```json
{ "value": "10+", "label": "Years across digital design and web delivery" }
```

Better (specific):
```json
{ "value": "10+ yrs", "label": "Web delivery from visual design through to frontend implementation" }
```

Make each stat scan in 2 seconds and answer a real question a recruiter would have.

- [ ] **Step 3: Tighten profile.json headline**

Current headline: `"Frontend developer for product and e-commerce teams that care about UX, accessibility and measurable digital improvement."`

This is good but long for the large hero display. Consider shortening. Example:
```json
"headline": "Frontend developer for teams that care about UX, accessibility and measurable outcomes."
```

Or keep the current if you prefer — just make sure it works at 80-96px display size (count on ~12-16 chars per line at large size).

- [ ] **Step 4: Update resume.json — sharpen experience highlights**

Open `career/resume.json`. Read each `highlights` array per role. For each bullet that is duty-focused ("Responsible for X", "Supported Y"), rewrite it to be outcome-focused ("Reduced X", "Shipped Y", "Improved Z by N").

Current example (duty-focused):
```json
"Supported a portfolio of Shopify stores with ongoing design, theme, branding and merchandising improvements."
```

Better (outcome-focused):
```json
"Delivered ongoing frontend and design improvements across 15 Shopify stores, maintaining UX consistency as the portfolio scaled."
```

Apply this pass to all roles. Don't invent metrics you don't have — stay truthful.

- [ ] **Step 5: Review all 6 case studies**

Open each `projects/*/case-study.md`. For each one, check:
1. Is there real content (> 150 words of actual narrative)?
2. Does it avoid the "Next pass" placeholder sections?

The following projects need checking based on what was visible: `haverford-brands` (has a "Next pass" section — this is placeholder content).

For any thin case study, add a `<!-- TODO: expand -->` marker and write at minimum a 3-section stub:
```markdown
# Overview
[1-2 sentences on what the project was]

# What I did
[3-5 specific things you built or delivered]

# Outcome
[1-2 specific outcomes or what it demonstrated]
```

This is better than a "Next pass" note for a public-facing page.

- [ ] **Step 6: Verify build still works**

```bash
npm run build:site
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add career/profile.json career/resume.json projects/
git commit -m "content: audit profile, resume highlights, and case studies"
```

---

## Task 11: Coolify App Setup

This task is manual — no code changes. Document the steps here for reference.

**Prerequisites:**
- Docker image `ghcr.io/leebaroneau/website:latest` has been pushed by GitHub Actions (Task 6 must have run successfully)
- SSH access to `haverford-droplet` (`ssh haverford-droplet`)

- [ ] **Step 1: Make GHCR image public (or add pull credentials)**

Go to `https://github.com/users/leebaroneau/packages/container/website` → Package settings → Change visibility to **Public**.

This avoids needing registry credentials on the Coolify side.

- [ ] **Step 2: Create the app in Coolify**

In Coolify dashboard:
1. New Resource → Docker Image
2. Image: `ghcr.io/leebaroneau/website:latest`
3. Port: `3000`
4. Domain: your custom domain (e.g. `leebarone.dev` or `leebaroneau.com`)

- [ ] **Step 3: Add environment variables**

In the app's Environment Variables section, add:
```
RESEND_API_KEY=re_your_actual_key
CONTACT_EMAIL=lee@haverford.com.au
RESEND_FROM_EMAIL=hello@yourdomain.com
PORT=3000
```

For `RESEND_FROM_EMAIL`: you must verify the sending domain in Resend first.
1. Go to `resend.com` → Domains → Add Domain
2. Add the DNS records to your domain registrar
3. Wait for verification (usually < 5 min)
4. Use `hello@<verified-domain>` as RESEND_FROM_EMAIL

- [ ] **Step 4: Deploy and verify**

Click Deploy in Coolify. Wait for the deploy to complete. Visit your custom domain:
- `/` — gateway page
- `/live/index.html` — public portfolio
- `/live/resume.html` — resume page
- `/dashboard/index.html` — private dashboard (not linked publicly)

- [ ] **Step 5: Get the deploy webhook URL from Coolify**

In Coolify → app settings → Webhooks, copy the deploy webhook URL.

Go to `https://github.com/leebaroneau/website/settings/secrets/actions` → New repository secret:
- Name: `COOLIFY_DEPLOY_WEBHOOK`
- Value: the webhook URL from Coolify

Push any small commit to `main` to trigger a full end-to-end deploy via GitHub Actions.

- [ ] **Step 6: Verify end-to-end**

After the GitHub Actions workflow completes:
1. Check the Coolify deploy logs — should show a new deploy triggered
2. Visit the live site — should reflect any recent content changes
3. Fill in the contact form — you should receive an email at `lee@haverford.com.au`

---

## Self-Review Notes

- **Spec coverage:** All five streams covered (repo move ✓, infra ✓, contact form ✓, visual ✓, content ✓).
- **No placeholders:** All tasks have complete code. Task 10 content audit has deliberate user-judgment steps (what's currently true for tools) — that's expected, not a placeholder.
- **Type consistency:** `validateContactInput` exported from `server/contact.mjs` and imported in `server/contact.test.mjs` — consistent. `handleContact` exported and imported in `server/index.mjs` — consistent.
- **CSS class consistency:** All CSS classes referenced in the new CSS exist in the template functions (`renderProofStat`, `renderExperienceCard`, etc.). `renderProofStat` updated in Task 9 to use `<span class="proof-value">` (matching CSS) instead of `<p>`.
- **Contact section structure:** `renderContactSection` (Task 7) renders `.contact-section` which is placed outside `.page-shell` in Task 9 — consistent.
