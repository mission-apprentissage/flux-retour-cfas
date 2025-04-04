export function maskTelephone(telephone: string | null | undefined): string | null {
  if (!telephone) {
    return null;
  }
  if (telephone.length <= 6) {
    // Si le numéro est trop court, on masque tout sauf les 2 premiers chiffres
    const visibleStart = telephone.slice(0, 2);
    const maskedSection = "*".repeat(Math.max(0, telephone.length - 2));
    return visibleStart + maskedSection;
  }

  // Découpe standard : 2 chiffres, puis 4 chiffres à la fin
  const visibleStart = telephone.slice(0, 2);
  const visibleEnd = telephone.slice(-4);
  const maskedSectionLength = telephone.length - 2 - 4;
  const maskedSection = "*".repeat(Math.max(0, maskedSectionLength));
  return visibleStart + maskedSection + visibleEnd;
}
