const express = require("express");
const {
  renderPrivacyHtml,
  renderTermsHtml,
  renderPrivacyJson,
  renderTermsJson,
} = require("../legal/html");

const router = express.Router();

router.get("/privacy", (_req, res) => {
  res.type("html").send(renderPrivacyHtml());
});

router.get("/terms", (_req, res) => {
  res.type("html").send(renderTermsHtml());
});

router.get("/privacy.json", (_req, res) => {
  res.json(renderPrivacyJson());
});

router.get("/terms.json", (_req, res) => {
  res.json(renderTermsJson());
});

module.exports = router;
