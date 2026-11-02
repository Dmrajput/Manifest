require("dotenv").config();
const { createVisionUploadPlan, removeVisionObject, r2Configured } = require("../src/services/storageService");

async function main() {
  console.log("r2Configured", r2Configured());
  const plan = await createVisionUploadPlan("smoke-user", { contentType: "image/jpeg" });
  console.log({
    mode: plan.mode,
    provider: plan.provider,
    bucket: plan.bucket,
    path: plan.path,
    public_url: plan.public_url,
    hasUploadUrl: Boolean(plan.upload_url),
  });

  // Minimal JPEG
  const buf = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z",
    "base64"
  );

  const upload = await fetch(plan.upload_url, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: buf,
  });
  console.log("upload", upload.status, await upload.text().catch(() => ""));

  const get = await fetch(plan.public_url);
  console.log("public_get", get.status);

  if (upload.ok) {
    console.log("delete", await removeVisionObject(plan.path));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
