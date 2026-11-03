const path = require("path");
const { privacyPolicy, termsOfService, APP_NAME } = require(path.join(__dirname, "../../../legal/publish.js"));

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sectionsToHtml(sections) {
  return sections
    .map(
      (section) =>
        `<section><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body).replace(/\n\n/g, "</p><p>")}</p></section>`,
    )
    .join("\n");
}

function renderLegalPage(doc) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(doc.title)} — ${escapeHtml(APP_NAME)}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 720px; margin: 0 auto; padding: 24px 20px 48px; background: #faf8ff; }
    h1 { font-size: 1.75rem; color: #5b21b6; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.9rem; margin-bottom: 2rem; }
    h2 { font-size: 1.1rem; margin-top: 1.5rem; color: #4c1d95; }
    p { margin: 0.75rem 0; white-space: pre-wrap; }
    a { color: #7c3aed; }
  </style>
</head>
<body>
  <h1>${escapeHtml(doc.title)}</h1>
  <p class="meta">Last updated: ${escapeHtml(doc.lastUpdated)}</p>
  ${sectionsToHtml(doc.sections)}
  <p class="meta"><a href="/legal/privacy">Privacy Policy</a> · <a href="/legal/terms">Terms of Service</a></p>
</body>
</html>`;
}

function renderPrivacyHtml() {
  return renderLegalPage(privacyPolicy);
}

function renderTermsHtml() {
  return renderLegalPage(termsOfService);
}

function renderPrivacyJson() {
  return privacyPolicy;
}

function renderTermsJson() {
  return termsOfService;
}

module.exports = {
  renderPrivacyHtml,
  renderTermsHtml,
  renderPrivacyJson,
  renderTermsJson,
};
