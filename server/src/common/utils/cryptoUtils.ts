import crypto from "crypto";

export function generateKey(size = 32) {
  const buffer = crypto.randomBytes(size);
  return base64url(buffer);
}

export function generateHexKey(size = 32): string {
  const buffer = crypto.randomBytes(size);
  return buffer.toString("hex");
}
function base64url(buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
