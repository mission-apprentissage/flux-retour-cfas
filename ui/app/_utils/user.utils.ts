export function getInitials(nom?: string | null, prenom?: string | null): string {
  const p = prenom?.charAt(0)?.toUpperCase() || "";
  const n = nom?.charAt(0)?.toUpperCase() || "";
  return p || n ? `${p}.${n}` : "?";
}

export function getUserDisplayName(user: { prenom?: string | null; nom?: string | null } | null | undefined): string {
  return [user?.prenom, user?.nom].filter(Boolean).join(" ");
}

export function isCurrentUserId(
  userId: string | { toString(): string } | null | undefined,
  currentUserId: string | { toString(): string } | null | undefined
): boolean {
  if (!userId || !currentUserId) return false;
  return String(userId) === String(currentUserId);
}
