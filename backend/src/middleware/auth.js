const jwt = require("jsonwebtoken");
const { fail } = require("../utils/response");

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

function requireAuth(req, res, next) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    return fail(res, {
      code: "AUTH_MISCONFIGURED",
      message: "Server auth is not configured",
      status: 500,
    });
  }

  const token = getBearerToken(req);
  if (!token) {
    return fail(res, {
      code: "UNAUTHORIZED",
      message: "Missing or invalid Authorization header",
      status: 401,
    });
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (!payload.sub) {
      return fail(res, {
        code: "UNAUTHORIZED",
        message: "Token missing subject",
        status: 401,
      });
    }

    req.auth = {
      id: payload.sub,
      email: payload.email || null,
      role: payload.role || "authenticated",
      raw: payload,
    };
    return next();
  } catch (error) {
    return fail(res, {
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
      status: 401,
    });
  }
}

module.exports = { requireAuth, getBearerToken };
