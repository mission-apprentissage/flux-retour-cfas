import { UsersFiltersParams } from "../validation/usersFiltersSchema";

export const parseStringToArray = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

export const buildTextSearchQuery = (searchTerm: string) => [
  { nom: { $regex: searchTerm, $options: "i" } },
  { prenom: { $regex: searchTerm, $options: "i" } },
  { email: { $regex: searchTerm, $options: "i" } },
  { fonction: { $regex: searchTerm, $options: "i" } },
];

export const buildFiltersFromQuery = (queryParams: UsersFiltersParams) => {
  const { q, account_status, type_utilisateur, reseaux, departements, regions } = queryParams;
  const query: any = {};
  const organizationFilters: any = {};

  if (q && q.trim()) {
    query.$or = buildTextSearchQuery(q.trim());
  }

  const statusValues = parseStringToArray(account_status);
  if (statusValues.length > 0) {
    query.account_status = { $in: statusValues };
  }

  const typeValues = parseStringToArray(type_utilisateur);
  if (typeValues.length > 0) {
    organizationFilters["organisation.type"] = { $in: typeValues };
  }

  const reseauxValues = parseStringToArray(reseaux);
  if (reseauxValues.length > 0) {
    organizationFilters["organisation.organisme.reseaux"] = { $in: reseauxValues };
  }

  const departementValues = parseStringToArray(departements);
  const regionValues = parseStringToArray(regions);

  const geoFilters: any[] = [];

  if (departementValues.length > 0) {
    geoFilters.push({
      $or: [
        { "organisation.code_departement": { $in: departementValues } },
        { "organisation.adresse.departement": { $in: departementValues } },
        { "organisation.organisme.adresse.departement": { $in: departementValues } },
      ],
    });
  }

  if (regionValues.length > 0) {
    geoFilters.push({
      $or: [
        { "organisation.code_region": { $in: regionValues } },
        { "organisation.adresse.region": { $in: regionValues } },
        { "organisation.organisme.adresse.region": { $in: regionValues } },
      ],
    });
  }

  if (geoFilters.length > 0) {
    if (geoFilters.length === 1) {
      Object.assign(organizationFilters, geoFilters[0]);
    } else {
      organizationFilters.$and = geoFilters;
    }
  }

  if (Object.keys(organizationFilters).length > 0) {
    query._organizationFilters = organizationFilters;
  }

  return query;
};
