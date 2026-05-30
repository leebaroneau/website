import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import {
  renderDashboardPage,
  renderGatewayPage,
  renderLiveHomePage,
  renderResumePage
} from "../templates/site.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const careerDir = path.join(rootDir, "career");
const projectsDir = path.join(rootDir, "projects");
const distDir = path.join(rootDir, "dist");
const distAssetsDir = path.join(distDir, "assets");
const distDownloadsDir = path.join(distDir, "downloads");
const distLiveDir = path.join(distDir, "live");
const distDashboardDir = path.join(distDir, "dashboard");

marked.setOptions({
  gfm: true,
  breaks: true
});

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function extractTitleAndBody(markdown, fallbackTitle) {
  const trimmed = markdown.trim();
  const lines = trimmed.split(/\r?\n/);

  if (lines[0]?.startsWith("# ")) {
    return {
      title: lines[0].replace(/^#\s+/, "").trim(),
      body: lines.slice(1).join("\n").trim()
    };
  }

  return {
    title: fallbackTitle,
    body: trimmed
  };
}

function humanizeSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function loadMarkdownCollection(directory) {
  if (!(await fileExists(directory))) {
    return [];
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });
  const docs = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const filePath = path.join(directory, entry.name);
    const markdown = await fs.readFile(filePath, "utf8");
    const slug = entry.name.replace(/\.md$/, "");
    const { title, body } = extractTitleAndBody(markdown, humanizeSlug(slug));

    docs.push({
      slug,
      title,
      sourcePath: normalizePath(path.relative(rootDir, filePath)),
      html: marked.parse(body || markdown)
    });
  }

  return docs.sort((left, right) => left.slug.localeCompare(right.slug));
}

async function loadProjects() {
  const entries = await fs.readdir(projectsDir, { withFileTypes: true });
  const projects = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) {
      continue;
    }

    const projectDir = path.join(projectsDir, entry.name);
    const projectPath = path.join(projectDir, "project.json");
    const caseStudyPath = path.join(projectDir, "case-study.md");

    if (!(await fileExists(projectPath))) {
      continue;
    }

    const project = await readJson(projectPath);
    const caseStudyMarkdown = (await fileExists(caseStudyPath))
      ? await fs.readFile(caseStudyPath, "utf8")
      : "";

    projects.push({
      slug: entry.name,
      sourcePath: normalizePath(path.relative(rootDir, projectPath)),
      ...project,
      caseStudyHtml: marked.parse(caseStudyMarkdown)
    });
  }

  return projects.sort((left, right) => {
    const leftSort = left.sortKey ?? 0;
    const rightSort = right.sortKey ?? 0;
    return rightSort - leftSort;
  });
}

function orderProjects(projects, prioritySlugs = []) {
  const projectMap = new Map(projects.map((project) => [project.slug, project]));
  const ordered = [];
  const seen = new Set();

  for (const slug of prioritySlugs) {
    const project = projectMap.get(slug);
    if (project) {
      ordered.push(project);
      seen.add(slug);
    }
  }

  for (const project of projects) {
    if (!seen.has(project.slug)) {
      ordered.push(project);
    }
  }

  return ordered;
}

async function main() {
  const [profile, resume, dashboard, projects, jobSearchNotes, coverLetters, applicationDocs] = await Promise.all([
    readJson(path.join(careerDir, "profile.json")),
    readJson(path.join(careerDir, "resume.json")),
    readJson(path.join(careerDir, "dashboard.json")),
    loadProjects(),
    loadMarkdownCollection(path.join(careerDir, "job-search")),
    loadMarkdownCollection(path.join(careerDir, "cover-letters")),
    loadMarkdownCollection(path.join(careerDir, "applications"))
  ]);

  const featuredProjects = resume.featuredProjects
    .map((slug) => projects.find((project) => project.slug === slug && project.public !== false))
    .filter(Boolean);

  const orderedDashboardProjects = orderProjects(projects, dashboard.priorityProjects);

  await Promise.all([
    fs.mkdir(distAssetsDir, { recursive: true }),
    fs.mkdir(distDownloadsDir, { recursive: true }),
    fs.mkdir(distLiveDir, { recursive: true }),
    fs.mkdir(distDashboardDir, { recursive: true })
  ]);

  await Promise.all([
    fs.rm(path.join(distDir, "resume.html"), { force: true }),
    fs.rm(path.join(distDir, "dashboard.html"), { force: true })
  ]);

  await Promise.all([
    fs.copyFile(path.join(rootDir, "styles", "site.css"), path.join(distAssetsDir, "site.css")),
    fs.copyFile(path.join(rootDir, "styles", "print.css"), path.join(distAssetsDir, "print.css"))
  ]);

  const sourceResumePath = path.join(careerDir, "source-files", profile.sourceResumeFileName);
  if (await fileExists(sourceResumePath)) {
    await fs.copyFile(sourceResumePath, path.join(distDownloadsDir, profile.sourceResumeFileName));
  }

  const generatedOn = new Date().toISOString();
  const gatewayPaths = {
    assetPrefix: "./assets",
    liveHome: "./live/index.html",
    dashboardHome: "./dashboard/index.html"
  };
  const livePaths = {
    assetPrefix: "../assets",
    liveHome: "./index.html",
    resumePage: "./resume.html",
    resumePdf: `../downloads/${profile.resumeFileName}`
  };
  const dashboardPaths = {
    assetPrefix: "../assets",
    gateway: "../index.html",
    liveHome: "../live/index.html",
    liveResume: "../live/resume.html",
    resumePdf: `../downloads/${profile.resumeFileName}`,
    sourcePdf: `../downloads/${profile.sourceResumeFileName}`
  };

  const baseContext = {
    generatedOn,
    profile,
    resume,
    dashboard
  };

  await Promise.all([
    fs.writeFile(
      path.join(distDir, "index.html"),
      renderGatewayPage({
        ...baseContext,
        projects,
        paths: gatewayPaths
      }),
      "utf8"
    ),
    fs.writeFile(
      path.join(distLiveDir, "index.html"),
      renderLiveHomePage({
        ...baseContext,
        featuredProjects,
        paths: livePaths
      }),
      "utf8"
    ),
    fs.writeFile(
      path.join(distLiveDir, "resume.html"),
      renderResumePage({
        ...baseContext,
        featuredProjects,
        paths: livePaths
      }),
      "utf8"
    ),
    fs.writeFile(
      path.join(distDashboardDir, "index.html"),
      renderDashboardPage({
        ...baseContext,
        projects: orderedDashboardProjects,
        jobSearchNotes,
        coverLetters,
        applicationDocs,
        paths: dashboardPaths
      }),
      "utf8"
    )
  ]);

  console.log(`Built workspace with ${projects.length} project entries.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
