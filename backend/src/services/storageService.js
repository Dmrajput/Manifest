const { randomUUID } = require("crypto");
const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getSupabaseAdmin } = require("../config/supabase");

const MAX_BYTES = Number(process.env.VISION_MAX_BYTES) || 5 * 1024 * 1024;
const PROFILE_MAX_BYTES = Number(process.env.PROFILE_MAX_BYTES) || 512 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const VISION_KEY_PREFIX = (process.env.R2_VISION_PREFIX || process.env.AWS_VISION_PREFIX || "vision").replace(
  /^\/+|\/+$/g,
  ""
);
const PROFILE_KEY_PREFIX = (process.env.R2_PROFILE_PREFIX || "profile").replace(/^\/+|\/+$/g, "");
const PRESIGN_EXPIRES_SECONDS = Number(process.env.R2_UPLOAD_URL_EXPIRES || process.env.AWS_UPLOAD_URL_EXPIRES) || 60 * 10;

/** Legacy Supabase bucket name (fallback when R2 is not configured). */
const VISION_BUCKET = process.env.SUPABASE_VISION_BUCKET || process.env.R2_BUCKET_NAME || "vision-boards";

function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      !String(process.env.R2_ACCESS_KEY_ID).startsWith("your_")
  );
}

function getR2Bucket() {
  return process.env.R2_BUCKET_NAME || "";
}

function getR2Endpoint() {
  const accountId = process.env.R2_ACCOUNT_ID;
  return process.env.R2_S3_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
}

function getR2PublicBase() {
  const configured = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  if (configured && !configured.includes("yourdomain")) return configured;
  return "";
}

let s3Client;
function getR2Client() {
  if (!r2Configured()) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: getR2Endpoint(),
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      // Avoid AWS SDK v3 optional checksum headers that can break R2 presigns.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return s3Client;
}

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
  if (r2Configured()) {
    return `${VISION_KEY_PREFIX}/${authProviderId}/${randomUUID()}.${ext}`;
  }
  return `${authProviderId}/${randomUUID()}.${ext}`;
}

function publicObjectUrl(path) {
  if (r2Configured()) {
    const base = getR2PublicBase();
    if (base) return `${base}/${path}`;
    // Fallback to S3 API host (not ideal for public reads; prefer R2_PUBLIC_URL / r2.dev).
    return `${getR2Endpoint()}/${getR2Bucket()}/${path}`;
  }
  const supabaseBase = process.env.SUPABASE_URL;
  if (!supabaseBase) return path;
  return `${supabaseBase.replace(/\/$/, "")}/storage/v1/object/public/${VISION_BUCKET}/${path}`;
}

function extractObjectKey(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return null;
  try {
    const url = new URL(pathOrUrl);
    const bucket = getR2Bucket();
    const publicBase = getR2PublicBase();

    if (publicBase && pathOrUrl.startsWith(`${publicBase}/`)) {
      return decodeURIComponent(pathOrUrl.slice(publicBase.length + 1));
    }

    if (url.hostname.endsWith(".r2.dev")) {
      return decodeURIComponent(url.pathname.replace(/^\//, ""));
    }

    if (url.hostname.endsWith(".r2.cloudflarestorage.com")) {
      // path-style: /bucket/key  or virtual-hosted bucket in hostname
      const parts = url.pathname.replace(/^\//, "").split("/");
      if (bucket && parts[0] === bucket) {
        return decodeURIComponent(parts.slice(1).join("/"));
      }
      return decodeURIComponent(parts.join("/"));
    }

    if (bucket && (url.hostname.startsWith(`${bucket}.`) || url.pathname.includes(`/${bucket}/`))) {
      if (url.hostname.startsWith(`${bucket}.`)) {
        return decodeURIComponent(url.pathname.replace(/^\//, ""));
      }
      const marker = `/${bucket}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) return decodeURIComponent(url.pathname.slice(idx + marker.length));
    }

    const supabaseMarker = `/object/public/${VISION_BUCKET}/`;
    const supabaseIdx = url.pathname.indexOf(supabaseMarker);
    if (supabaseIdx >= 0) {
      return decodeURIComponent(url.pathname.slice(supabaseIdx + supabaseMarker.length));
    }
    const signMarker = `/object/sign/${VISION_BUCKET}/`;
    const signIdx = url.pathname.indexOf(signMarker);
    if (signIdx >= 0) {
      return decodeURIComponent(url.pathname.slice(signIdx + signMarker.length).split("?")[0]);
    }
    return null;
  } catch {
    return pathOrUrl;
  }
}

function isOwnedVisionPath(authProviderId, imagePath) {
  if (!imagePath || typeof imagePath !== "string" || !authProviderId) return false;
  const key = extractObjectKey(imagePath) || imagePath;
  const ownedPrefixes = [`${authProviderId}/`, `${VISION_KEY_PREFIX}/${authProviderId}/`];
  if (ownedPrefixes.some((prefix) => key.startsWith(prefix))) return true;
  try {
    const url = new URL(imagePath);
    return ownedPrefixes.some((prefix) => url.pathname.includes(`/${prefix}`));
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

function isOurStorageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return false;
  const bucket = getR2Bucket();
  const publicBase = getR2PublicBase();
  if (publicBase && imagePath.startsWith(publicBase)) return true;
  if (imagePath.includes(".r2.dev/")) return true;
  if (imagePath.includes(".r2.cloudflarestorage.com/")) return true;
  if (bucket && imagePath.includes(bucket)) return true;
  if (imagePath.includes(`/object/public/${VISION_BUCKET}/`) || imagePath.includes(`/object/sign/${VISION_BUCKET}/`)) {
    return true;
  }
  if (imagePath.startsWith(`${VISION_KEY_PREFIX}/`)) return true;
  if (imagePath.startsWith(`${PROFILE_KEY_PREFIX}/`)) return true;
  return false;
}

function assertOwnedVisionPath(authProviderId, imagePath) {
  if (isExternalHttpsUrl(imagePath) && !isOurStorageUrl(imagePath)) {
    return;
  }
  if (!isOwnedVisionPath(authProviderId, imagePath)) {
    const error = new Error("Image path is not owned by the authenticated user");
    error.status = 403;
    error.code = "FORBIDDEN";
    throw error;
  }
}

function buildProfileAvatarPath(authProviderId, contentType) {
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return `${PROFILE_KEY_PREFIX}/${authProviderId}/avatar.${ext}`;
}

function isOwnedProfilePath(authProviderId, imagePath) {
  if (!imagePath || typeof imagePath !== "string" || !authProviderId) return false;
  const key = extractObjectKey(imagePath) || imagePath;
  return key.startsWith(`${PROFILE_KEY_PREFIX}/${authProviderId}/`);
}

function assertOwnedProfilePath(authProviderId, imagePath) {
  if (!imagePath) return;
  if (isExternalHttpsUrl(imagePath) && !isOurStorageUrl(imagePath)) {
    const error = new Error("Avatar must be uploaded through the app");
    error.status = 403;
    error.code = "FORBIDDEN";
    throw error;
  }
  if (!isOwnedProfilePath(authProviderId, imagePath)) {
    const error = new Error("Avatar path is not owned by the authenticated user");
    error.status = 403;
    error.code = "FORBIDDEN";
    throw error;
  }
}

async function createProfileAvatarUploadPlan(authProviderId, { contentType = "image/jpeg" } = {}) {
  assertAllowedMime(contentType);

  if (r2Configured()) {
    const client = getR2Client();
    if (!client) {
      const error = new Error("Cloudflare R2 is not configured");
      error.status = 503;
      error.code = "STORAGE_UNAVAILABLE";
      throw error;
    }
    const path = buildProfileAvatarPath(authProviderId, contentType);
    const command = new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: path,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: PRESIGN_EXPIRES_SECONDS });
    return {
      mode: "s3_presigned",
      provider: "cloudflare_r2",
      bucket: getR2Bucket(),
      region: "auto",
      path,
      upload_url: uploadUrl,
      public_url: publicObjectUrl(path),
      headers: { "Content-Type": contentType },
      max_bytes: PROFILE_MAX_BYTES,
      content_type: contentType,
      expires_in: PRESIGN_EXPIRES_SECONDS,
    };
  }

  const error = new Error("Profile photo storage is not configured");
  error.status = 503;
  error.code = "STORAGE_UNAVAILABLE";
  throw error;
}

async function assertProfileObjectReady(authProviderId, imagePath) {
  if (!r2Configured()) return;
  assertOwnedProfilePath(authProviderId, imagePath);
  const key = extractObjectKey(imagePath) || imagePath;
  if (!key) {
    const error = new Error("Invalid avatar reference");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const client = getR2Client();
  if (!client) return;

  const minBytes = Number(process.env.PROFILE_MIN_OBJECT_BYTES) || 256;
  try {
    const head = await client.send(
      new HeadObjectCommand({
        Bucket: getR2Bucket(),
        Key: key,
      })
    );
    const size = head.ContentLength ?? 0;
    if (size > PROFILE_MAX_BYTES) {
      await client.send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key }));
      const error = new Error(`Profile photo must be under ${Math.round(PROFILE_MAX_BYTES / 1024)} KB`);
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    if (size < minBytes) {
      await client.send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key }));
      const error = new Error("Profile photo upload failed. Try a different image.");
      error.status = 400;
      error.code = "INVALID_UPLOAD";
      throw error;
    }
  } catch (error) {
    if (error.status === 400) throw error;
    const err = new Error("Could not verify profile photo. Try uploading again.");
    err.status = 400;
    err.code = "STORAGE_VERIFY_FAILED";
    throw err;
  }
}

async function removeProfileAvatarIfOwned(authProviderId, avatarUrl) {
  if (!avatarUrl || !authProviderId || !isOwnedProfilePath(authProviderId, avatarUrl)) {
    return { deleted: false, reason: "SKIP" };
  }
  return removeVisionObject(avatarUrl);
}

async function createR2UploadPlan(authProviderId, contentType) {
  const client = getR2Client();
  if (!client) {
    const error = new Error("Cloudflare R2 is not configured");
    error.status = 503;
    error.code = "STORAGE_UNAVAILABLE";
    throw error;
  }

  const path = buildObjectPath(authProviderId, contentType);
  const command = new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: path,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: PRESIGN_EXPIRES_SECONDS });
  return {
    mode: "s3_presigned",
    provider: "cloudflare_r2",
    bucket: getR2Bucket(),
    region: "auto",
    path,
    upload_url: uploadUrl,
    public_url: publicObjectUrl(path),
    headers: {
      "Content-Type": contentType,
    },
    max_bytes: MAX_BYTES,
    content_type: contentType,
    expires_in: PRESIGN_EXPIRES_SECONDS,
  };
}

/**
 * Prefer Cloudflare R2 presigned PUT when configured.
 * Otherwise fall back to Supabase Storage.
 */
async function createVisionUploadPlan(authProviderId, { contentType = "image/jpeg" } = {}) {
  assertAllowedMime(contentType);

  if (r2Configured()) {
    return createR2UploadPlan(authProviderId, contentType);
  }

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
      provider: "supabase",
      bucket: VISION_BUCKET,
      path,
      token: data.token,
      signed_url: data.signedUrl,
      public_url: publicObjectUrl(path),
      max_bytes: MAX_BYTES,
      content_type: contentType,
    };
  }

  return {
    mode: "client",
    provider: "supabase",
    bucket: VISION_BUCKET,
    path,
    public_url: publicObjectUrl(path),
    max_bytes: MAX_BYTES,
    content_type: contentType,
    message:
      "Configure R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME / R2_PUBLIC_URL for Cloudflare uploads.",
  };
}

async function assertVisionObjectReady(authProviderId, imagePath) {
  if (!r2Configured()) return;
  assertOwnedVisionPath(authProviderId, imagePath);
  const key = extractObjectKey(imagePath) || imagePath;
  if (!key) {
    const error = new Error("Invalid image reference");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const client = getR2Client();
  if (!client) return;

  const minBytes = Number(process.env.VISION_MIN_OBJECT_BYTES) || 256;
  try {
    const head = await client.send(
      new HeadObjectCommand({
        Bucket: getR2Bucket(),
        Key: key,
      })
    );
    const size = head.ContentLength ?? 0;
    if (size < minBytes) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: getR2Bucket(),
          Key: key,
        })
      );
      const error = new Error(
        "Uploaded image is empty or corrupted. Remove the photo and upload again from your gallery."
      );
      error.status = 400;
      error.code = "INVALID_UPLOAD";
      throw error;
    }
  } catch (error) {
    if (error.status === 400) throw error;
    const err = new Error("Could not verify uploaded image. Try uploading again.");
    err.status = 400;
    err.code = "STORAGE_VERIFY_FAILED";
    throw err;
  }
}

async function removeVisionObject(pathOrUrl) {
  const key = extractObjectKey(pathOrUrl) || pathOrUrl;
  if (!key) return { deleted: false, reason: "MISSING_PATH" };

  if (r2Configured()) {
    try {
      const client = getR2Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: getR2Bucket(),
          Key: key,
        })
      );
      return { deleted: true, path: key };
    } catch (error) {
      return { deleted: false, reason: error.message || "R2_DELETE_FAILED" };
    }
  }

  const supabase = getSupabaseAdmin();
  if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { deleted: false, reason: "SERVICE_ROLE_UNAVAILABLE" };
  }

  const { error } = await supabase.storage.from(VISION_BUCKET).remove([key]);
  if (error) {
    return { deleted: false, reason: error.message };
  }
  return { deleted: true, path: key };
}

module.exports = {
  VISION_BUCKET,
  MAX_BYTES,
  PROFILE_MAX_BYTES,
  ALLOWED_MIME,
  createVisionUploadPlan,
  createProfileAvatarUploadPlan,
  removeVisionObject,
  removeProfileAvatarIfOwned,
  assertOwnedVisionPath,
  assertOwnedProfilePath,
  assertVisionObjectReady,
  assertProfileObjectReady,
  isOwnedVisionPath,
  isOwnedProfilePath,
  publicObjectUrl,
  buildObjectPath,
  buildProfileAvatarPath,
  r2Configured,
  extractObjectKey,
};
