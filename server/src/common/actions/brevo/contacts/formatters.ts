/**
 * Formateurs des attributs Brevo selon les conventions du MDD.
 * Helpers purs (sans dépendance Mongo) pour rester testables unitairement.
 */

/**
 * Title case avec respect des séparateurs de noms composés (espace, tiret, apostrophe).
 *   "DUPONT" → "Dupont"
 *   "jean-pierre" → "Jean-Pierre"
 *   "d'artagnan" → "D'Artagnan"
 */
export const formatName = (s: string | undefined | null): string | null => {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed
    .toLowerCase()
    .replace(/(^|[\s\-'])(\p{L})/gu, (_m, sep: string, char: string) => sep + char.toUpperCase());
};

/**
 * Normalise la civilité au format MDD (M./Mme). Renvoie la valeur telle quelle
 * si la valeur n'est pas reconnue (ex. "Mx", "Autre").
 */
export const formatCivilite = (s: string | undefined | null): string | null => {
  if (!s) return null;
  const normalized = s.trim().toLowerCase();
  if (normalized === "madame" || normalized === "mme" || normalized === "mme.") return "Mme";
  if (normalized === "monsieur" || normalized === "m." || normalized === "m") return "M.";
  return s.trim();
};

/**
 * Lowercase + trim. Best practice anti-doublon Brevo.
 */
export const formatEmail = (s: string): string => s.trim().toLowerCase();

/**
 * Strip non-digits pour garantir le format 14 chiffres Brevo (safety net,
 * en pratique les SIRETs sont déjà propres en DB).
 */
export const cleanSiret = (s: string | undefined | null): string | null => {
  if (!s) return null;
  const digits = s.replace(/\D/g, "");
  return digits || null;
};

/**
 * Joint un tableau de chaînes avec un séparateur (défaut ", "). Trim + filter
 * des valeurs vides + dédup (ordre de première apparition préservé). Option
 * `lowercase` pour normaliser les ERPs (cf. MDD) ; la dédup se fait après
 * normalisation, donc "Ymag" et "ymag" sont considérés comme doublons.
 */
export const formatJoinedList = (
  arr: string[] | undefined | null,
  opts: { separator?: string; lowercase?: boolean } = {}
): string | null => {
  if (!arr || arr.length === 0) return null;
  const cleaned = arr
    .map((v) => {
      const trimmed = (v ?? "").trim();
      return opts.lowercase ? trimmed.toLowerCase() : trimmed;
    })
    .filter(Boolean);
  if (cleaned.length === 0) return null;
  return [...new Set(cleaned)].join(opts.separator ?? ", ");
};
