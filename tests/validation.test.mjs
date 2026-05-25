import assert from "node:assert/strict";
import test from "node:test";
import { validateEnquiry } from "../lib/validation.js";

test("accepts a complete enquiry", () => {
  const result = validateEnquiry({
    name: "Amit Sharma",
    phone: "+91 98765 43210",
    matter: "Civil Matter",
    message: "I need advice about a pending civil notice.",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.name, "Amit Sharma");
});

test("rejects short and invalid submissions", () => {
  const result = validateEnquiry({
    name: "A",
    phone: "abc",
    matter: "Unknown",
    message: "short",
  });

  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    "matter",
    "message",
    "name",
    "phone",
  ]);
});

test("rejects honeypot submissions", () => {
  const result = validateEnquiry({
    name: "Amit Sharma",
    phone: "+91 98765 43210",
    matter: "Other",
    message: "I need a consultation appointment.",
    company: "spam",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.form, "Submission could not be accepted.");
});