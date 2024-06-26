const parseExcelBoolean = (input: any): boolean | null => {
  if (input === null) return null;
  if (typeof input === "boolean") return input;
  if (typeof input === "number") return input === 1;
  if (typeof input === "string") {
    const normalizedInput = input.trim().toLowerCase();
    if (normalizedInput === "1" || normalizedInput === "oui" || normalizedInput === "vrai") return true;
    if (normalizedInput === "0" || normalizedInput === "non" || normalizedInput === "faux") return false;
  }
  return null;
};

export default parseExcelBoolean;
