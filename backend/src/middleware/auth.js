const jwt = require("jsonwebtoken");
const { fail } = require("../utils/response");
const { getSupabaseAdmin } = require("../config/supabase");

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

function authFromJwtPayload(payload) {
  if (!payload?.sub) return null;
  return {
    id: payload.sub,
    email: payload.email || null,
    role: payload.role || "authenticated",
    raw: payload,
  };
}

function verifyWithSecret(token) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    return authFromJwtPayload(payload);
  } catch {
    return null;
  }
}

async function verifyWithSupabaseApi(token) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  return {
    id: data.user.id,
    email: data.user.email || null,
    role: data.user.role || "authenticated",
    raw: {
      sub: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata || {},
    },
  };
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return fail(res, {
      code: "UNAUTHORIZED",
      message: "Missing or invalid Authorization header",
      status: 401,
    });
  }

  try {
    let auth = verifyWithSecret(token);
    if (!auth) {
      auth = await verifyWithSupabaseApi(token);
    }

    if (!auth) {
      return fail(res, {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token. Check SUPABASE_JWT_SECRET or SUPABASE_URL/ANON_KEY on the API.",
        status: 401,
      });
    }

    req.auth = auth;
    return next();
  } catch (error) {
    return fail(res, {
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
      status: 401,
    });
  }
}

module.exports = { requireAuth, getBearerToken, verifyWithSecret, verifyWithSupabaseApi };
