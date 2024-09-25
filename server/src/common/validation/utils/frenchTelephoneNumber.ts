export const telephoneConverter = (telephone: string | null) => {
  if (telephone === null || telephone === undefined) return "";

  let phone = String(telephone)
    .trim()
    .replace(/[-.()\s]/g, "");

  if (phone.startsWith("033")) {
    phone = `+33${phone.slice(3)}`;
  }

  if (phone.startsWith("06") && phone.length === 10) {
    return phone;
  }

  if (phone.startsWith("+33") && phone.length === 12) {
    return phone;
  }

  if (phone.startsWith("33") && phone.length === 11) {
    return `+${phone}`;
  }

  if (phone.length === 10 && phone.startsWith("0")) {
    return `+33${phone.slice(1)}`;
  }

  return telephone;
};
