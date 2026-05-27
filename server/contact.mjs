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
  // Implemented in Task 4
}
