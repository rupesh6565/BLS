export const MATTER_TYPES = Object.freeze([
  "Civil Matter",
  "Criminal Matter",
  "Property Matter",
  "Family Matter",
  "Documentation",
  "Other",
]);

const PHONE_PATTERN = /^[+\d() .-]{7,30}$/;

function compactText(value, maxLength) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanMessage(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, 1500);
}

export function validateEnquiry(input = {}) {
  const errors = {};
  const data = {
    name: compactText(input.name, 120),
    phone: compactText(input.phone, 40),
    matter: compactText(input.matter, 80),
    message: cleanMessage(input.message),
  };

  const honeypot = compactText(input.company, 120);
  if (honeypot) {
    errors.form = "Submission could not be accepted.";
  }

  if (data.name.length < 2) {
    errors.name = "Please enter your full name.";
  }

  if (!PHONE_PATTERN.test(data.phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (!MATTER_TYPES.includes(data.matter)) {
    errors.matter = "Please choose a matter type.";
  }

  if (data.message.length < 10) {
    errors.message = "Please add a short summary of your matter.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    data,
    errors,
  };
}