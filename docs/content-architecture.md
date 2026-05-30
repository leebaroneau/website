# Content Architecture

This repo should not rely on Notion for the public site.

## Principle

The live site should be fully owned by this repo.

That means:

- Public copy lives in local files
- Public project stories live in local files
- Public assets live in this repo
- The site can be rebuilt without opening Notion

## Recommended model

### 1. Public source of truth

Use these as the only inputs for the live site:

- `career/profile.json`
- `career/resume.json`
- `1_projects/<slug>/project.json`
- `1_projects/<slug>/case-study.md`
- `1_projects/<slug>/assets/`

This is the layer recruiters and hiring managers should experience.

### 2. Private operating system

Use these for your own search process:

- `career/dashboard.json`
- `career/job-search/`
- `career/cover-letters/`
- `career/applications/`
- `1_projects/<slug>/repos/`

This is the layer for tailoring, planning, outreach and interview prep.

### 3. Research and archive inputs

Use these only as raw material:

- attached resume source PDF
- old Notion pages
- recruiter notes
- historical exports and drafts

These should inform the public copy, but never be required by the public site.

## Best organization for this repo

The current structure is already close. The important change is conceptual:

- `career/` = identity, resume, private job-search ops
- `1_projects/` = proof library and project source material
- `dist/live/` = public output
- `dist/dashboard/` = private output
- `docs/` = system documentation

## Good rule of thumb

If a file is needed for a public page to render, it should live in this repo and be understandable without opening Notion.

If a file exists mainly to help you think, draft or search, it belongs in the private layer.

If a file is just historical source material, treat it as archive input, not runtime dependency.

## Practical next steps

1. Keep Notion links off the live site.
2. Treat Notion as import/reference material only.
3. Move any final project writeups into `1_projects/<slug>/case-study.md`.
4. Save screenshots and exports into `1_projects/<slug>/assets/`.
5. Keep role-specific tailoring inside `career/applications/`.

