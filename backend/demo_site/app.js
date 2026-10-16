/**
 * ShopDemo Client Script
 * 
 * NOTE TO DEVELOPERS & TEST AUDITORS:
 * This application contains a DELIBERATE DEMO DEFECT in email validation
 * to demonstrate BugSentinel AI's autonomous bug detection, verification,
 * and regression testing capabilities.
 * 
 * DEFECT SPECIFICATION:
 * When ENABLE_EMAIL_VALIDATION_DEFECT is true, the form accepts invalid
 * email strings (e.g. "not-an-email") and erroneously reports a successful
 * order placement instead of rejecting the invalid format.
 * 
 * To simulate a bug fix for regression testing, set ENABLE_EMAIL_VALIDATION_DEFECT = false.
 */

// Deliberate defect toggle:
// Set to true for initial detection, or false to verify a bug fix.
window.ENABLE_EMAIL_VALIDATION_DEFECT = true;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkout-form");
  const nameInput = document.getElementById("customer-name");
  const emailInput = document.getElementById("email");
  const addressInput = document.getElementById("address");
  const statusEl = document.getElementById("status");
  const placeOrderBtn = document.getElementById("place-order");

  function setStatus(message, type = "normal") {
    statusEl.textContent = message;
    statusEl.className = "status-box";
    if (type === "success") {
      statusEl.classList.add("status-success");
    } else if (type === "error") {
      statusEl.classList.add("status-error");
    }
  }

  function isValidEmail(email) {
    // Standard RFC-compliant regex
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const address = addressInput.value.trim();

    console.log(`[ShopDemo] Checkout submission attempt: name="${name}", email="${email}", address="${address}"`);

    // Basic required field checks
    if (!name) {
      setStatus("Error: Please provide your full name.", "error");
      nameInput.focus();
      return;
    }

    if (!email) {
      setStatus("Error: Please provide your email address.", "error");
      emailInput.focus();
      return;
    }

    if (!address) {
      setStatus("Error: Please provide your shipping address.", "error");
      addressInput.focus();
      return;
    }

    // Email validation logic
    if (window.ENABLE_EMAIL_VALIDATION_DEFECT) {
      // DELIBERATE DEFECT: Accepts any non-empty string as a valid email
      console.warn("[ShopDemo DEFECT ACTIVE]: Skipping format validation for email:", email);
    } else {
      // Fixed behavior: Rejects invalid emails
      if (!isValidEmail(email)) {
        console.error("[ShopDemo Validation]: Rejected invalid email:", email);
        setStatus("Error: Please enter a valid email address.", "error");
        emailInput.focus();
        return;
      }
    }

    // If we reached here, order is marked as placed
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const successMsg = `Order placed successfully! Order #${orderId} confirmed for ${name} (${email}).`;
    console.log(`[ShopDemo]: ${successMsg}`);
    setStatus(successMsg, "success");
  });
});
