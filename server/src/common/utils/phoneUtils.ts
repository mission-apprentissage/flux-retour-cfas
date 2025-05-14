export function maskTelephone(telephone: string | null | undefined): string | null {
  if (!telephone) {
    return null;
  }

  let maskedTelephone = "";

  if (telephone.length <= 6) {
    const visibleStart = telephone.slice(0, 2);
    const maskedSection = "*".repeat(Math.max(0, telephone.length - 2));
    maskedTelephone = visibleStart + maskedSection;
  } else {
    const visibleStart = telephone.slice(0, 2);
    const visibleEnd = telephone.slice(-4);
    const maskedSectionLength = telephone.length - 6;
    const maskedSection = "*".repeat(maskedSectionLength);
    maskedTelephone = visibleStart + maskedSection + visibleEnd;
  }

  return maskedTelephone.replace(/(.{2})/g, "$1 ").trim();
}
