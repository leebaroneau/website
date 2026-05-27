function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMonthYear(value) {
  if (!value) {
    return "Present";
  }

  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-AU", {
    month: "short",
    year: "numeric"
  });
}

function formatRange(item) {
  if (item.periodLabel) {
    return item.periodLabel;
  }

  return `${formatMonthYear(item.start)} - ${item.end ? formatMonthYear(item.end) : "Present"}`;
}

function renderExternalLinks(links = [], className = "link-list") {
  if (!links.length) {
    return "";
  }

  const items = links
    .map(
      (link) =>
        `<a class="pill-link" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`
    )
    .join("");

  return `<div class="${className}">${items}</div>`;
}

function renderTagList(items = [], className = "tag-list") {
  if (!items.length) {
    return "";
  }

  return `<div class="${className}">${items
    .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
    .join("")}</div>`;
}

function documentShell({ title, description, bodyClass, assetPrefix, content }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="stylesheet" href="${escapeHtml(assetPrefix)}/site.css">
    <link rel="stylesheet" href="${escapeHtml(assetPrefix)}/print.css">
  </head>
  <body class="${escapeHtml(bodyClass)}">
    ${content}
  </body>
</html>
`;
}

function renderExperienceCard(item) {
  return `<article class="timeline-card">
    <div class="timeline-meta">
      <span class="timeline-period">${escapeHtml(formatRange(item))}</span>
      <span class="timeline-location">${escapeHtml(item.location ?? "")}</span>
    </div>
    <div class="timeline-content">
      <h3>${escapeHtml(item.role)}</h3>
      <p class="timeline-company">${escapeHtml(item.company)}</p>
      <p>${escapeHtml(item.overview)}</p>
      <ul class="bullet-list">
        ${item.highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("")}
      </ul>
    </div>
  </article>`;
}

function renderResumeExperienceCard(item) {
  return `<article class="resume-role-card">
    <div class="resume-role-row">
      <div>
        <h3>${escapeHtml(item.role)}</h3>
        <p class="timeline-company">${escapeHtml(item.company)}${item.location ? ` · ${escapeHtml(item.location)}` : ""}</p>
      </div>
      <p class="timeline-period">${escapeHtml(formatRange(item))}</p>
    </div>
    <p class="resume-overview">${escapeHtml(item.overview)}</p>
    <ul class="bullet-list compact-list">
      ${item.highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("")}
    </ul>
  </article>`;
}

function renderProjectCard(project, href) {
  return `<article class="project-card">
    <div class="project-card-top">
      <p class="project-period">${escapeHtml(formatRange(project))}</p>
      <h3>${escapeHtml(project.name)}</h3>
      <p class="project-role">${escapeHtml(project.role)}${project.client ? ` for ${escapeHtml(project.client)}` : ""}</p>
      <p>${escapeHtml(project.summary)}</p>
    </div>
    ${renderTagList(project.skills)}
    ${renderExternalLinks(project.links)}
    <a class="project-anchor" href="${escapeHtml(href)}">Read case study</a>
  </article>`;
}

function renderProjectSection(project) {
  return `<article class="case-study" id="project-${escapeHtml(project.slug)}">
    <div class="case-study-header">
      <div>
        <p class="eyebrow">Case study</p>
        <h3>${escapeHtml(project.name)}</h3>
        <p class="project-role">${escapeHtml(project.role)}${project.client ? ` for ${escapeHtml(project.client)}` : ""}</p>
      </div>
      <div class="case-study-side">
        <div>
          <p class="meta-label">Period</p>
          <p>${escapeHtml(formatRange(project))}</p>
        </div>
        <div>
          <p class="meta-label">Deliverables</p>
          <p>${escapeHtml(project.deliverables.join(" · "))}</p>
        </div>
      </div>
    </div>
    ${renderTagList(project.skills)}
    ${renderExternalLinks(project.links)}
    <div class="case-study-body">${project.caseStudyHtml}</div>
  </article>`;
}

function renderSkillGroups(skillGroups = []) {
  return skillGroups
    .map(
      (group) => `<article class="skill-group">
        <h3>${escapeHtml(group.name)}</h3>
        ${renderTagList(group.items, "tag-list compact")}
      </article>`
    )
    .join("");
}

function renderEducation(education = []) {
  return education
    .map(
      (item) => `<article class="education-item">
        <p class="meta-label">${escapeHtml(item.year)}</p>
        <h3>${escapeHtml(item.course)}</h3>
        <p>${escapeHtml(item.institution)}</p>
      </article>`
    )
    .join("");
}

function renderCompactProject(project) {
  return `<article class="compact-project">
    <h3>${escapeHtml(project.name)}</h3>
    <p>${escapeHtml(project.summary)}</p>
  </article>`;
}

function renderProofStat(item) {
  return `<article class="proof-card">
    <span class="proof-value">${escapeHtml(item.value)}</span>
    <p class="proof-label">${escapeHtml(item.label)}</p>
  </article>`;
}

function renderValuePillar(item) {
  return `<article class="value-pillar-card">
    <p class="eyebrow">Why this matters</p>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.copy)}</p>
    ${renderTagList(item.tags, "tag-list compact")}
  </article>`;
}

function renderDocCard(doc) {
  return `<article class="doc-card">
    <div class="doc-card-header">
      <div>
        <p class="eyebrow">Internal note</p>
        <h3>${escapeHtml(doc.title)}</h3>
      </div>
      <span class="file-chip">${escapeHtml(doc.sourcePath)}</span>
    </div>
    <div class="doc-card-body">${doc.html}</div>
  </article>`;
}

function renderQuickLinkCard(item) {
  const body = item.href
    ? `<a class="button button-secondary" href="${escapeHtml(item.href)}"${item.external ? ' target="_blank" rel="noreferrer"' : ""}>Open</a>`
    : `<span class="file-chip">${escapeHtml(item.meta ?? "")}</span>`;

  return `<article class="quick-link-card">
    <p class="eyebrow">${escapeHtml(item.kicker)}</p>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.copy)}</p>
    ${body}
  </article>`;
}

function renderStatusBadges(project) {
  const badges = [];

  if (project.featured) {
    badges.push("Featured on live site");
  }

  if (project.public) {
    badges.push("Public-safe");
  }

  if (project.status) {
    badges.push(project.status);
  }

  return badges.length ? renderTagList(badges, "tag-list compact") : "";
}

function renderDashboardProjectCard(project, paths) {
  return `<article class="dashboard-project-card" id="dashboard-project-${escapeHtml(project.slug)}">
    <div class="dashboard-project-header">
      <div>
        <p class="project-period">${escapeHtml(formatRange(project))}</p>
        <h3>${escapeHtml(project.name)}</h3>
        <p class="project-role">${escapeHtml(project.role)}${project.client ? ` for ${escapeHtml(project.client)}` : ""}</p>
      </div>
      <div class="dashboard-project-actions">
        <a class="button button-secondary" href="${escapeHtml(paths.liveHome)}#project-${escapeHtml(project.slug)}">Live case study</a>
      </div>
    </div>
    <p>${escapeHtml(project.summary)}</p>
    ${renderStatusBadges(project)}
    ${renderTagList(project.skills)}
    <div class="project-meta-grid">
      <div class="project-meta-card">
        <p class="meta-label">Best for roles</p>
        <p>${escapeHtml((project.bestForRoles ?? []).join(" · "))}</p>
      </div>
      <div class="project-meta-card">
        <p class="meta-label">Story angles</p>
        <p>${escapeHtml((project.storyAngles ?? []).join(" · "))}</p>
      </div>
      <div class="project-meta-card">
        <p class="meta-label">Deliverables</p>
        <p>${escapeHtml((project.deliverables ?? []).join(" · "))}</p>
      </div>
      <div class="project-meta-card">
        <p class="meta-label">Local repo folder</p>
        <p><code>${escapeHtml(`projects/${project.slug}/${project.repo?.localPath ?? "repos/"}`)}</code></p>
      </div>
    </div>
    <div class="dashboard-note-block">
      <p class="meta-label">Interview highlights</p>
      <ul class="bullet-list compact-list">
        ${(project.interviewHighlights ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
    ${renderExternalLinks(project.links)}
  </article>`;
}

function renderSurfaceCard(item) {
  return `<article class="surface-card">
    <p class="eyebrow">${escapeHtml(item.kicker)}</p>
    <h2>${escapeHtml(item.title)}</h2>
    <p>${escapeHtml(item.copy)}</p>
    <div class="button-row">
      <a class="button button-primary" href="${escapeHtml(item.href)}">${escapeHtml(item.cta)}</a>
    </div>
  </article>`;
}

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
    .then(function(res) {
      return res.json().catch(function() {
        throw new Error('Server error. Please try again.');
      }).then(function(json) {
        if (!res.ok) throw new Error(json.error || 'Something went wrong.');
        return json;
      });
    })
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

export function renderGatewayPage({ profile, resume, projects, dashboard, paths }) {
  const surfaces = [
    {
      kicker: "Public surface",
      title: "Live portfolio site",
      copy: "A curated public-facing site with your current resume, selected case studies and downloadable PDF.",
      href: paths.liveHome,
      cta: "Open live site"
    },
    {
      kicker: "Private surface",
      title: "Job-search dashboard",
      copy: "Internal workspace for application prep, project talking points, cover-letter templates and search notes.",
      href: paths.dashboardHome,
      cta: "Open dashboard"
    }
  ];

  return documentShell({
    title: `${profile.name} - Career Workspace`,
    description: "Public portfolio and private job-search dashboard.",
    bodyClass: "gateway-page",
    assetPrefix: paths.assetPrefix,
    content: `
      <main class="page-shell gateway-shell">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">Career workspace</p>
            <h1>One repo. Two surfaces. Clear separation between public and private career material.</h1>
            <p>The live site is for recruiters and hiring teams. The dashboard is for preparing applications, matching the right projects to the right roles, and keeping tailored material close at hand.</p>
            <div class="button-row">
              <a class="button button-primary" href="${escapeHtml(paths.liveHome)}">Open live site</a>
              <a class="button button-secondary" href="${escapeHtml(paths.dashboardHome)}">Open dashboard</a>
            </div>
          </div>
          <aside class="hero-panel">
            <p class="meta-label">At a glance</p>
            <h2>${escapeHtml(profile.name)}</h2>
            <p>${escapeHtml(resume.summary[0])}</p>
            <div class="detail-stack">
              <div>
                <span class="detail-label">Featured case studies</span>
                <strong>${resume.featuredProjects.length}</strong>
              </div>
              <div>
                <span class="detail-label">Project folders</span>
                <strong>${projects.length}</strong>
              </div>
              <div>
                <span class="detail-label">Private dashboard docs</span>
                <strong>${dashboard.quickActions.length}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section class="gateway-grid section">
          ${surfaces.map(renderSurfaceCard).join("")}
        </section>
      </main>
    `
  });
}

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

export function renderResumePage({ profile, resume, featuredProjects, paths }) {
  return documentShell({
    title: `${profile.name} - Resume`,
    description: `${profile.name} resume`,
    bodyClass: "resume-page",
    assetPrefix: paths.assetPrefix,
    content: `
      <main class="resume-shell">
        <div class="resume-toolbar screen-only">
          <a class="button button-secondary" href="${escapeHtml(paths.liveHome)}">Back to live site</a>
          <a class="button button-primary" href="${escapeHtml(paths.resumePdf)}">Download PDF</a>
        </div>

        <article class="resume-sheet">
          <header class="resume-header">
            <div class="resume-intro">
              <p class="eyebrow">Resume</p>
              <h1>${escapeHtml(profile.name)}</h1>
              <p class="resume-title">${escapeHtml(profile.role)}</p>
              ${resume.summary.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
            </div>
            <div class="resume-contact">
              <a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a>
              <a href="tel:${escapeHtml(profile.phone.replace(/\s+/g, ""))}">${escapeHtml(profile.phone)}</a>
              <span>${escapeHtml(profile.location)}</span>
              ${(profile.publicLinks ?? [])
                .map(
                  (link) =>
                    `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`
                )
                .join("")}
            </div>
          </header>

          <section class="resume-section">
            <div class="section-heading compact">
              <div>
                <p class="eyebrow">Experience</p>
                <h2>Recent roles</h2>
              </div>
            </div>
            <div class="resume-experience">
              ${resume.experience.map(renderResumeExperienceCard).join("")}
            </div>
          </section>

          <section class="resume-grid">
            <div class="resume-section">
              <p class="eyebrow">Skills</p>
              <h2>Core strengths</h2>
              ${renderSkillGroups(resume.skillGroups)}
            </div>
            <div class="resume-section">
              <p class="eyebrow">Education</p>
              <h2>Formal study</h2>
              ${renderEducation(resume.education)}
            </div>
          </section>

          <section class="resume-section">
            <p class="eyebrow">Selected projects</p>
            <h2>Portfolio highlights</h2>
            <div class="compact-projects">
              ${featuredProjects.slice(0, 4).map(renderCompactProject).join("")}
            </div>
          </section>
        </article>
      </main>
    `
  });
}

export function renderDashboardPage({
  generatedOn,
  profile,
  dashboard,
  projects,
  jobSearchNotes,
  coverLetters,
  applicationDocs,
  paths
}) {
  const quickLinks = [
    {
      kicker: "Resume",
      title: "Latest PDF",
      copy: "Use this when sending an application directly.",
      href: paths.resumePdf
    },
    {
      kicker: "Portfolio",
      title: "Public live site",
      copy: "Curated public-facing portfolio and case-study surface.",
      href: paths.liveHome
    },
    {
      kicker: "Resume page",
      title: "Public web resume",
      copy: "Useful when a recruiter wants a quick browser-based version.",
      href: paths.liveResume
    },
    {
      kicker: "Source file",
      title: "Original resume PDF",
      copy: "The imported source PDF stored in the repo.",
      href: paths.sourcePdf
    },
    {
      kicker: "Applications",
      title: "Application workspace",
      copy: "Create company-specific folders under the applications directory.",
      meta: "career/applications/"
    },
    {
      kicker: "Project repos",
      title: "Local code snapshots",
      copy: "Clone or copy relevant repos into each project's private repos folder.",
      meta: "projects/<slug>/repos/"
    }
  ];

  return documentShell({
    title: `${profile.name} - Private Job Search Dashboard`,
    description: dashboard.intro,
    bodyClass: "dashboard-page",
    assetPrefix: paths.assetPrefix,
    content: `
      <header class="site-header">
        <a class="brand" href="#top">
          <span class="brand-kicker">Private dashboard</span>
          <span class="brand-name">${escapeHtml(profile.name)}</span>
        </a>
        <nav class="site-nav">
          <a href="#kit">Application kit</a>
          <a href="#notes">Search notes</a>
          <a href="#projects">Project library</a>
          <a href="#letters">Cover letters</a>
        </nav>
      </header>

      <main class="page-shell" id="top">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(dashboard.title)}</p>
            <h1>${escapeHtml(dashboard.intro)}</h1>
            <p>This page is the internal layer of the career system. Use it to match the right project story to the right role, pull the right cover-letter base, and keep search materials organised without pushing that context onto the public site.</p>
            <div class="button-row">
              <a class="button button-primary" href="${escapeHtml(paths.liveHome)}">Open live site</a>
              <a class="button button-secondary" href="${escapeHtml(paths.gateway)}">Back to workspace home</a>
            </div>
            ${renderExternalLinks(profile.privateLinks ?? [], "hero-links")}
          </div>

          <aside class="hero-panel">
            <p class="meta-label">Immediate use</p>
            <h2>Application prep checklist</h2>
            <ul class="bullet-list compact-list">
              ${dashboard.quickActions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
            <div class="detail-stack">
              <div>
                <span class="detail-label">Priority projects</span>
                <strong>${dashboard.priorityProjects.length}</strong>
              </div>
              <div>
                <span class="detail-label">Cover-letter bases</span>
                <strong>${coverLetters.length}</strong>
              </div>
              <div>
                <span class="detail-label">Generated</span>
                <strong>${escapeHtml(new Date(generatedOn).toLocaleDateString("en-AU"))}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section class="section" id="kit">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Application kit</p>
              <h2>Fast access to the material you reach for most often</h2>
            </div>
            <p class="section-copy">This is the operational layer: resume, source files, application folders and links back to the public-facing portfolio.</p>
          </div>
          <div class="dashboard-grid">
            ${quickLinks.map(renderQuickLinkCard).join("")}
          </div>
        </section>

        <section class="section" id="notes">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Search notes</p>
              <h2>Role criteria, channels and workflows</h2>
            </div>
            <p class="section-copy">These notes stay private because they are for decision-making, outreach planning and application execution.</p>
          </div>
          <div class="doc-grid">
            ${jobSearchNotes.map(renderDocCard).join("")}
            ${applicationDocs.map(renderDocCard).join("")}
          </div>
        </section>

        <section class="section" id="projects">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Project library</p>
              <h2>All projects, plus the angles they support in interviews and applications</h2>
            </div>
            <p class="section-copy">The live site is curated. This dashboard is not. Use this library to pick the strongest supporting evidence for each role.</p>
          </div>
          <div class="dashboard-project-list">
            ${projects.map((project) => renderDashboardProjectCard(project, paths)).join("")}
          </div>
        </section>

        <section class="section" id="letters">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Cover letters</p>
              <h2>Base templates to adapt per role</h2>
            </div>
            <p class="section-copy">These are starting points. Copy the closest template into a company folder under <code>career/applications/</code> and tailor it from there.</p>
          </div>
          <div class="doc-grid">
            ${coverLetters.map(renderDocCard).join("")}
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <p>Private surface generated for job-search operations and interview prep.</p>
      </footer>
    `
  });
}
