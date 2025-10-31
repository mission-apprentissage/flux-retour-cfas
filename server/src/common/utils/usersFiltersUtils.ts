import { UsersFiltersParams } from "../validation/usersFiltersSchema";

export const parseStringToArray = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const analyzeSearchTerm = (
  searchTerm: string
): "user" | "org" | "mixed" | "email-exact" | "phone" | "email-domain" => {
  const trimmed = searchTerm.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const isCompleteEmail = emailRegex.test(trimmed);
  if (isCompleteEmail) return "email-exact";

  const emailDomainRegex = /^@[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]+)*$/;
  const isEmailDomain = emailDomainRegex.test(trimmed);
  if (isEmailDomain) return "email-domain";

  const isSiret = /^\d{14}$/.test(trimmed);
  const isUAI = /^\d{7}[A-Za-z]$/.test(trimmed);
  if (isSiret || isUAI) return "org";

  const normalizedForPhone = trimmed.replace(/[\s.\-+()]/g, "");
  const isPhone = /^\d{8,}$/.test(normalizedForPhone);
  if (isPhone) return "phone";

  const words = trimmed.split(/\s+/);

  const hasComposedOrgKeywords = /\b(mission\s+locale|centre\s+de\s+formation)\b/i.test(trimmed);
  if (hasComposedOrgKeywords) return "org";

  const hasSimpleOrgKeywords = /\b(CFA|ARML|organisme|centre|formation)\b/i.test(trimmed);

  const firstWord = words[0];
  const firstWordIsOrgKeyword = /^(CFA|ARML)$/.test(firstWord);
  if (firstWordIsOrgKeyword) return "org";

  const hasProperNoun = words.some((w) => /^[A-ZÀ-Ü][a-zà-ÿ]/.test(w));
  const notAllCaps = !words.every((w) => /^[A-ZÀ-Ü]+$/.test(w));
  const looksLikeFullName =
    words.length >= 2 && words.length <= 3 && words.every((w) => w.length >= 2) && hasProperNoun && notAllCaps;

  if (hasSimpleOrgKeywords && !looksLikeFullName) return "org";

  const hasUserKeywords = /(^|\s)(monsieur|madame|directeur|directrice|responsable|m\.|mme)(\s|$)/i.test(trimmed);
  if (hasUserKeywords) return "user";

  const hasOnlySpecialChars = /^[^a-zA-Z0-9\u00C0-\u017F]{1,3}$/.test(trimmed);
  if (hasOnlySpecialChars) return "mixed";

  const isCompoundName = /^[a-zA-ZÀ-ÿ]+(-[a-zA-ZÀ-ÿ]+)+$/i.test(trimmed);
  if (isCompoundName) return "user";

  const isPartialEmail = /@/.test(trimmed);
  if (isPartialEmail) return "user";

  return "mixed";
};

export const buildTextSearchQueryAfterLookup = (searchTerm: string) => {
  const trimmedTerm = searchTerm.trim();

  if (trimmedTerm.length < 2) {
    return [];
  }

  if (trimmedTerm.length > 100) {
    return [];
  }

  const escapedTerm = escapeRegex(trimmedTerm);

  return [
    { nom: { $regex: escapedTerm, $options: "i" } },
    { prenom: { $regex: escapedTerm, $options: "i" } },
    { nomComplet: { $regex: escapedTerm, $options: "i" } },
    { nomCompletInverse: { $regex: escapedTerm, $options: "i" } },
    { email: { $regex: escapedTerm, $options: "i" } },
    { telephone: { $regex: escapedTerm, $options: "i" } },
    { "organisation.nom": { $regex: escapedTerm, $options: "i" } },
    { "organisation.siret": { $regex: escapedTerm, $options: "i" } },
    { "organisation.uai": { $regex: escapedTerm, $options: "i" } },
    { "organisation.organisme.nom": { $regex: escapedTerm, $options: "i" } },
    { "organisation.organisme.raison_sociale": { $regex: escapedTerm, $options: "i" } },
    { "organisation.organisme.enseigne": { $regex: escapedTerm, $options: "i" } },
    { "organisation.organisme.siret": { $regex: escapedTerm, $options: "i" } },
    { "organisation.organisme.uai": { $regex: escapedTerm, $options: "i" } },
  ];
};

export const buildFiltersFromQuery = (queryParams: UsersFiltersParams) => {
  const { q, account_status, type_utilisateur, reseaux, departements, regions } = queryParams;
  const query: any = {};
  const organizationFilters: any = {};
  const searchTerm = q?.trim();

  if (searchTerm && searchTerm.length >= 2) {
    query._hasTextSearch = true;
    query._searchTerm = searchTerm;
  }

  const statusValues = parseStringToArray(account_status);
  if (statusValues.length > 0) {
    query.account_status = { $in: statusValues };
  }

  const typeValues = parseStringToArray(type_utilisateur);
  const reseauxValues = parseStringToArray(reseaux);
  const departementValues = parseStringToArray(departements);
  const regionValues = parseStringToArray(regions);

  const orgAndFilters: any[] = [];

  if (typeValues.length > 0) {
    orgAndFilters.push({
      "organisation.type": { $in: typeValues },
    });
  }

  if (reseauxValues.length > 0) {
    orgAndFilters.push({
      $or: [
        { "organisation.organisme.reseaux": { $in: reseauxValues } },
        {
          "organisation.type": "TETE_DE_RESEAU",
          "organisation.reseau": { $in: reseauxValues },
        },
      ],
    });
  }

  if (departementValues.length > 0) {
    orgAndFilters.push({
      $or: [
        { "organisation.code_departement": { $in: departementValues } },
        { "organisation.adresse.departement": { $in: departementValues } },
        { "organisation.organisme.adresse.departement": { $in: departementValues } },
      ],
    });
  }

  if (regionValues.length > 0) {
    orgAndFilters.push({
      $or: [
        { "organisation.code_region": { $in: regionValues } },
        { "organisation.adresse.region": { $in: regionValues } },
        { "organisation.organisme.adresse.region": { $in: regionValues } },
        { "organisation.region_list": { $in: regionValues } },
      ],
    });
  }

  if (orgAndFilters.length > 0) {
    if (orgAndFilters.length === 1) {
      Object.assign(organizationFilters, orgAndFilters[0]);
    } else {
      organizationFilters.$and = orgAndFilters;
    }
  }

  if (Object.keys(organizationFilters).length > 0) {
    query._organizationFilters = organizationFilters;
  }

  return query;
};
