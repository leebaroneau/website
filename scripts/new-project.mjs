import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const projectsDir = path.join(rootDir, "projects");

function readOption(name) {
  const args = process.argv.slice(2);
  const index = args.indexOf(`--${name}`);
  if (index === -1) {
    return null;
  }
  return args[index + 1] ?? null;
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const name = readOption("name");
  const client = readOption("client") ?? name ?? "Client name";
  const role = readOption("role") ?? "Frontend Developer";
  const featured = readOption("featured") === "true";

  if (!name) {
    console.error('Usage: npm run project:new -- --name "Project Name"');
    process.exitCode = 1;
    return;
  }

  const slug = slugify(name);
  const projectDir = path.join(projectsDir, slug);

  try {
    await fs.access(projectDir);
    console.error(`Project already exists: ${slug}`);
    process.exitCode = 1;
    return;
  } catch {
    // Expected when creating a new folder.
  }

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const sortKey = Number(`${year}${month}`);

  await fs.mkdir(path.join(projectDir, "assets"), { recursive: true });
  await fs.mkdir(path.join(projectDir, "repos"), { recursive: true });

  const projectData = {
    name,
    client,
    role,
    periodLabel: year,
    summary: "Add a one-line summary of the project and why it matters.",
    skills: [
      "HTML",
      "CSS",
      "JavaScript"
    ],
    deliverables: [
      "Case study"
    ],
    links: [],
    featured,
    public: true,
    sortKey,
    repo: {
      localPath: `repos/${slug}`,
      remoteUrl: ""
    }
  };

  const caseStudy = `# Context

Describe the client, product or team context.

# Challenge

Describe the problem clearly.

# What I owned

- Add the specific responsibilities you drove

# Outcomes

- Add metrics, wins or qualitative impact
`;

  await Promise.all([
    fs.writeFile(path.join(projectDir, "project.json"), `${JSON.stringify(projectData, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(projectDir, "case-study.md"), caseStudy, "utf8"),
    fs.writeFile(path.join(projectDir, "assets", ".gitkeep"), "", "utf8"),
    fs.writeFile(path.join(projectDir, "repos", ".gitkeep"), "", "utf8")
  ]);

  console.log(`Created project scaffold: projects/${slug}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

