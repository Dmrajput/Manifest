const { randomUUID } = require("crypto");
const { getSupabaseAdmin } = require("../config/supabase");

const VISION_BUCKET = process.env.SUPABASE_VISION_BUCKET || "vision-boards";
const MAX_BYTES = Number(process.env.VISION_MAX_BYTES) || 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function assertAllowedMime(contentType) {
  if (!ALLOWED_MIME.has(contentType)) {
    const error = new Error("Only JPEG, PNG, and WebP images are allowed");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }
}

function buildObjectPath(authProviderId, contentType) {
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return `${authProviderId}/${randomUUID()}.${ext}`;
}

function isOwnedVisionPath(authProviderId, imagePath) {
  if (!imagePath || typeof imagePath !== "string") return false;
  const prefix = `${authProviderId}/`;
  if (imagePath.startsWith(prefix)) return true;
  try {
    const url = new URL(imagePath);
    return (
      url.pathname.includes(`/object/public/${VISION_BUCKET}/${prefix}`) ||
      url.pathname.includes(`/object/sign/${VISION_BUCKET}/${prefix}`)
    );
  } catch {
    return false;
  }
}

function isExternalHttpsUrl(imagePath) {
  try {
    const url = new URL(imagePath);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function assertOwnedVisionPath(authProviderId, imagePath) {
  // Allow external https URLs (templates / Unsplash). Storage object paths must be owned.
  if (isExternalHttpsUrl(imagePath) && !imagePath.includes(`/${VISION_BUCKET}/`)) {
    return;
  }
  if (!isOwnedVisionPath(authProviderId, imagePath)) {
    const error = new Error("Image path is not owned by the authenticated user");
    error.status = 403;
    error.code = "FORBIDDEN";
    throw error;
  }
}

/**
 * Prefer signed upload when service role is configured.
 * Otherwise return a client-upload plan for the user's Supabase session.
 */
async function createVisionUploadPlan(authProviderId, { contentType = "image/jpeg" } = {}) {
  assertAllowedMime(contentType);
  const path = buildObjectPath(authProviderId, contentType);
  const supabase = getSupabaseAdmin();
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && supabase);

  if (hasServiceRole) {
    const { data, error } = await supabase.storage.from(VISION_BUCKET).createSignedUploadUrl(path);
    if (error) {
      const err = new Error(error.message || "Could not create signed upload URL");
      err.status = 502;
      err.code = "STORAGE_ERROR";
      throw err;
    }
    return {
      mode: "signed",
      bucket: VISION_BUCKET,
      path,
      token: data.token,
      signed_url: data.signedUrl,
      max_bytes: MAX_BYTES,
      content_type: contentType,
    };
  }

  return {
    mode: "client",
    bucket: VISION_BUCKET,
    path,
    max_bytes: MAX_BYTES,
    content_type: contentType,
    message:
      "Upload with the user session via supabase.storage.from(bucket).upload(path, file). Create a private 'vision-boards' bucket if missing.",
  };
}

async function removeVisionObject(pathOrUrl) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { deleted: false, reason: "SERVICE_ROLE_UNAVAILABLE" };
  }

  let path = pathOrUrl;
  try {
    const url = new URL(pathOrUrl);
    const marker = `/${VISION_BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx >= 0) path = decodeURIComponent(url.pathname.slice(idx + marker.length));
  } catch {
    // plain path
  }

  const { error } = await supabase.storage.from(VISION_BUCKET).remove([path]);
  if (error) {
    return { deleted: false, reason: error.message };
  }
  return { deleted: true, path };
}

function publicObjectUrl(path) {
  const base = process.env.SUPABASE_URL;
  if (!base) return path;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${VISION_BUCKET}/${path}`;
}

module.exports = {
  VISION_BUCKET,
  MAX_BYTES,
  ALLOWED_MIME,
  createVisionUploadPlan,
  removeVisionObject,
  assertOwnedVisionPath,
  isOwnedVisionPath,
  publicObjectUrl,
  buildObjectPath,
};
