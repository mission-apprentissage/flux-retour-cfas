export default function parseExcelBoolean(input) {
  if (input === null) return null;
  if (typeof input === "boolean") return input;
  if (typeof input === "number") return input === 1;
  if (typeof input === "string") {
    if (input === "1") return true;
    if (input === "0") return false;
    if (input.trim().toLowerCase() === "oui") return true;
    if (input.trim().toLowerCase() === "non") return false;
    if (input.trim().toLowerCase() === "vrai") return true;
    if (input.trim().toLowerCase() === "faux") return true;
  }
  return null;
}
