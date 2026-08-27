import { rncpDb, romeSecteurActivitesDb } from "@/common/model/collections";

export const getRomeByRncp = async (rncp?: string | null) => {
  if (!rncp) {
    return [];
  }
  const data = await rncpDb().find({ rncp }).next();
  return data ? data.romes : [];
};

export const getSecteurActivitesByCodeRome = async (codes: Array<string>) => {
  const data = await romeSecteurActivitesDb()
    .find({ "romes.code_rome": { $in: codes } }, { projection: { _id: 0, code_secteur: 1, libelle_secteur: 1 } })
    .toArray();
  return data;
};

export const getSecteurActivitesByCode = async (code: number) => {
  const data = await romeSecteurActivitesDb().findOne(
    { code_secteur: code },
    { projection: { _id: 0, libelle_secteur: 1 } }
  );
  return data;
};
