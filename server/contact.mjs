import { Resend } from "resend";

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
