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

const requiredEnv = ["RESEND_API_KEY", "CONTACT_EMAIL", "RESEND_FROM_EMAIL"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
