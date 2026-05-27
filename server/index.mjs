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
