const navToggle = document.querySelector(".nav-toggle");
const header = document.querySelector(".site-header");
const year = document.querySelector("#year");
const enquiryForm = document.querySelector("[data-enquiry-form]");
const formStatus = document.querySelector("[data-form-status]");
const submitLabel = document.querySelector("[data-submit-label]");

year.textContent = new Date().getFullYear();

navToggle.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const setHeaderState = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

const setFormStatus = (message, state = "") => {
  formStatus.textContent = message;
  formStatus.className = `form-status ${state}`.trim();
};

enquiryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!enquiryForm.checkValidity()) {
    enquiryForm.reportValidity();
    return;
  }

  const submitButton = enquiryForm.querySelector("button[type='submit']");
  const payload = Object.fromEntries(new FormData(enquiryForm).entries());

  submitButton.disabled = true;
  submitLabel.textContent = "Sending...";
  setFormStatus("Sending your enquiry...");

  try {
    const response = await fetch("/api/enquiries", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      const errors = result.errors ? Object.values(result.errors) : [];
      throw new Error(errors[0] || result.error || "Could not send enquiry.");
    }

    enquiryForm.reset();
    setFormStatus(result.message || "Your enquiry has been received.", "success");
  } catch (error) {
    setFormStatus(
      error.message || "Could not send enquiry. Please call the office directly.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitLabel.textContent = "Send Enquiry";
  }
});