import crypto from "crypto";

export function generateKey(size = 32, format = "base64") {
  const buffer = crypto.randomBytes(size);
  // @ts-expect-error
  return buffer.toString(format);
}
