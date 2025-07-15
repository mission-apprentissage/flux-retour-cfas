import { UsersFiltersParams } from "../validation/usersFiltersSchema";

export const parseStringToArray = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

export const buildTextSearchQuery = (searchTerm: string) => {
  if (searchTerm.length < 2) {
    return [];
  }

  return [{ $text: { $search: searchTerm, $language: "french" } }];
};

export const buildFiltersFromQuery = (queryParams: UsersFiltersParams) => {
  const { q, account_status, type_utilisateur, reseaux, departements, regions } = queryParams;
  const query: any = {};
  const organizationFilters: any = {};

  if (q && q.trim()) {
    const textSearchQuery = buildTextSearchQuery(q.trim());
    if (textSearchQuery.length > 0) {
      query.$or = textSearchQuery;
    }
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
