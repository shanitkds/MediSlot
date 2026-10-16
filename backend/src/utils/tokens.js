const crypto = require("crypto");
const env = require("../config/env");
const { hashToken, randomToken } = require("./hash");

function createOpaqueToken() {
  const raw = randomToken(32);
  return { raw, hash: hashToken(raw) };
}

function createAccessToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      userId: user?._id || user?.id,
      email: user?.email,
      exp: Math.floor(Date.now() / 1000) + (env.JWT_ACCESS_TTL_MINUTES || 15) * 60,
    })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", env.COOKIE_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function verifyAccessToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", env.COOKIE_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  if (signature !== expectedSig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp && data.exp * 1000 < Date.now()) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

module.exports = {
  createOpaqueToken,
  createAccessToken,
  verifyAccessToken,
  addHours,
  addMinutes,
};
