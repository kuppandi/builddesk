/* ============================================================
   EDIT THESE FOUR LINES ONCE YOU HAVE THE ACCOUNTS — nothing else.
   ============================================================ */
const CONFIG = {
  UPI_ID:        "",   // e.g. abhi@okhdfcbank  — blank = pay-by-request
  UPI_NAME:      "Abhi",
  PAYPAL:        "",   // e.g. abhi100 -> https://paypal.me/abhi100
  CONTACT_EMAIL: ""    // blank = form falls back to copy-able brief
};
/* ============================================================ */

const PRICES = {
  quick:  { inr: 1499, usd: 19,  label: "Quick Fix" },
  build:  { inr: 3499, usd: 39,  label: "Full Build" },
  sprint: { inr: 7499, usd: 89,  label: "Automation Sprint" }
};

const pad = n => String(n).padStart(2, "0");
const today = new Date();
const DUE = new Date(today.getTime() + 86400000);
const dueText = `by ${DUE.getDate()}/${DUE.getMonth() + 1}, ${pad(DUE.getHours() + 1)}:00 IST`;

function openPay(tier, method) {
  const p = PRICES[tier];
  const panel = document.getElementById("pay-panel");
  if (method === "upi" && !CONFIG.UPI_ID) {
    panel.innerHTML = `<div class="paybox">
      <div class="paybox-h">₹${p.inr} — ${p.label}</div>
      <p>Send the brief below and I'll reply with a UPI ID or QR within the hour.
         Nothing is payable until I've confirmed I can do the job.</p>
      <a class="btn primary" href="#brief">Send the brief →</a></div>`;
  } else if (method === "upi") {
    const link = `upi://pay?pa=${encodeURIComponent(CONFIG.UPI_ID)}&pn=${encodeURIComponent(CONFIG.UPI_NAME)}`
      + `&am=${p.inr}&cu=INR&tn=${encodeURIComponent("BuildDesk " + p.label)}`;
    document.getElementById("pay-panel").innerHTML =
      `<div class="paybox">
         <div class="paybox-h">Pay ₹${p.inr} — ${p.label}</div>
         <p>Scan or open in any UPI app:</p>
         <a class="btn primary" href="${link}">Open UPI app → ₹${p.inr}</a>
         <p class="mono small">UPI ID: <b>${CONFIG.UPI_ID}</b> · Amount: ₹${p.inr} · Note: BuildDesk ${p.label}</p>
         <p class="small muted">After paying, send me the brief below and I start immediately.</p>
       </div>`;
  } else if (!CONFIG.PAYPAL) {
    panel.innerHTML = `<div class="paybox">
      <div class="paybox-h">$${p.usd} USD — ${p.label}</div>
      <p>Send the brief below and I'll reply with a PayPal invoice or link within the hour.
         Nothing is payable until I've confirmed I can do the job.</p>
      <a class="btn primary" href="#brief">Send the brief →</a></div>`;
  } else {
    const link = `https://paypal.me/${CONFIG.PAYPAL}/${p.usd}USD`;
    document.getElementById("pay-panel").innerHTML =
      `<div class="paybox">
         <div class="paybox-h">Pay $${p.usd} USD — ${p.label}</div>
         <p>International payments via PayPal:</p>
         <a class="btn primary" href="${link}" target="_blank" rel="noopener">Pay $${p.usd} on PayPal →</a>
         <p class="small muted">After paying, send me the brief below and I start immediately.</p>
       </div>`;
  }
  document.getElementById("pay-panel").scrollIntoView({ behavior: "smooth", block: "center" });
}

function sendBrief(e) {
  e.preventDefault();
  const f = e.target;
  const body = [
    "TIER: " + f.tier.value,
    "",
    "WHAT I NEED DONE:",
    f.task.value,
    "",
    "TOOLS / STACK: " + (f.stack.value || "open"),
    "DEADLINE: " + (f.deadline.value || "24h is fine"),
    "LINK / FILES: " + (f.link.value || "will send"),
    "",
    "PAID VIA: " + (f.paid.value || "not yet"),
    "",
    "— sent from builddesk"
  ].join("\n");
  const status = document.getElementById("brief-status");
  if (!CONFIG.CONTACT_EMAIL) {
    // No inbox wired yet: show the brief so it can be copy-pasted into any DM.
    const box = document.getElementById("brief-out");
    box.textContent = body;
    box.style.display = "block";
    status.textContent = "Copy this and paste it into a DM — or send it once the email is wired.";
    return;
  }
  const href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent("BuildDesk brief — " + f.tier.value)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
  status.textContent = "Opening your mail app… if nothing happens, copy the brief manually.";
}
