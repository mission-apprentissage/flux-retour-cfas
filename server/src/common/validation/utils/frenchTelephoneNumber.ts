export const telephoneConverter = (telephone: string | null) => {
  if (!telephone) return telephone;
  let phone = String(telephone)
    .trim()
    .replaceAll("-", "")
    .replaceAll(".", "")
    .replaceAll(" ", "")
    .replaceAll("(+)", "+");

  if (phone.length === 9) {
    return `+33${phone}`;
  }

  if (phone.length === 10 && phone[0] === "0") {
    return `+33${phone.substr(1, 9)}`;
  }

  // Gestion des téléphones au format 033xxxxxxxxx
  if (phone.length === 12 && phone[0] === "0") {
    return `+33${phone.substr(3, 12)}`;
  }

  return phone;
};
