# Lee Barone Career System

This repo is a single source of truth for career assets:

- `career/` holds public resume data plus private job-search material.
- `1_projects/` holds case studies plus optional local repo clones for each project.
- `dist/live/` is the public-facing portfolio and resume site.
- `dist/dashboard/` is the private application dashboard.
- `dist/downloads/` holds generated resume files.
- `docs/` documents how the system is organized.

## Commands

```bash
npm install
npx playwright install chromium
npm run build
```

Optional:

```bash
npm run preview
npm run project:new -- --name "Project Name"
```

## Structure

```text
career/
  dashboard.json
  live-site/
  cover-letters/
  applications/
  profile.json
  resume.json
  job-search/
  notes/
  source-files/
1_projects/
  _template/
  <project-slug>/
scripts/
templates/
styles/
dist/
docs/
```

## Ownership Model

- Public site source of truth: `career/profile.json`, `career/resume.json`, `1_projects/<slug>/project.json`, `1_projects/<slug>/case-study.md`
- Private operating layer: `career/dashboard.json`, `career/job-search/`, `career/cover-letters/`, `career/applications/`
- Archive/research inputs: source PDF, old Notion pages, drafts and historical notes

See [docs/content-architecture.md](/Users/leebaroneau/Documents/GitHub/Lee Barone/docs/content-architecture.md).

## Workflow

1. Update `career/profile.json` and `career/resume.json` when your headline, skills, roles, or links change.
2. Use `career/cover-letters/` and `career/applications/` for private application material.
3. Add or update projects inside `1_projects/<slug>/`.
4. Put any private or local repo clones inside `1_projects/<slug>/repos/`.
5. Run `npm run build` to regenerate:
   - `dist/index.html`
   - `dist/live/index.html`
   - `dist/live/resume.html`
   - `dist/dashboard/index.html`
   - `dist/downloads/lee-barone-resume.pdf`

## Notes

- `1_projects/**/repos/` is git-ignored so you can clone private codebases without polluting this repo.
- The public site intentionally uses a broad location instead of a street address and only uses `publicLinks`.
- The current seed content originally came from the attached resume plus the supplied Notion pages, but Notion is now treated as reference material only, not as part of the live site.
