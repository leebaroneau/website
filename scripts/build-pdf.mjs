import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const resumeHtmlPath = path.join(distDir, "live", "resume.html");

async function main() {
  const profile = JSON.parse(await fs.readFile(path.join(rootDir, "career", "profile.json"), "utf8"));
  const outputPdfPath = path.join(distDir, "downloads", profile.resumeFileName);

  await fs.access(resumeHtmlPath);

  let browser;

  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    console.error("Chromium is not installed for Playwright.");
    console.error("Run: npx playwright install chromium");
    throw error;
  }

  try {
    const page = await browser.newPage();
    await page.goto(`file://${resumeHtmlPath}`, { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });
    await page.waitForFunction(() => document.fonts.status === "loaded");

    await page.pdf({
      path: outputPdfPath,
      format: "A4",
      printBackground: true,
      scale: 0.92,
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm"
      }
    });

    console.log(`Generated PDF at ${outputPdfPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
