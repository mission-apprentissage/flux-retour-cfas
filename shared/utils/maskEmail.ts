/**
 * Masque partiellement un email pour affichage.
 * Conserve les 3 premiers caractères de la partie locale, masque le milieu avec 7 astérisques
 * (nombre fixe, indépendant de la longueur réelle, pour ne pas divulguer la taille), garde le dernier caractère.
 */
export function maskEmail(email: string): string {
  const parts = email.split("@");
  const local = parts[0];
  const domain = parts[1];
  if (!local || !domain) {
    return "***@***";
  }
  if (local.length <= 4) {
    return `${"*".repeat(local.length)}@${domain}`;
  }
  const first = local.slice(0, 3);
  const last = local.slice(-1);
  return `${first}*******${last}@${domain}`;
}
