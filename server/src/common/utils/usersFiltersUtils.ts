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

export const analyzeSearchTerm = (searchTerm: string): "user" | "org" | "mixed" | "email-exact" => {
  const trimmed = searchTerm.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const isCompleteEmail = emailRegex.test(trimmed);

  if (isCompleteEmail) return "email-exact";

  const isSiret = /^\d{14}$/.test(trimmed);
  const isUAI = /^\d{7}[A-Za-z]$/.test(trimmed);
  const hasOrgKeywords = /\b(CFA|mission\s+locale|ARML|organisme|centre|formation)\b/i.test(trimmed);

  if (isSiret || isUAI) return "org";
  if (hasOrgKeywords) return "org";

  const isPartialEmail = /@/.test(trimmed);
  const hasUserKeywords = /\b(monsieur|madame|directeur|directrice|responsable)\b/i.test(trimmed);

  if (isPartialEmail || hasUserKeywords) return "user";

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
    { email: { $regex: escapedTerm, $options: "i" } },
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
