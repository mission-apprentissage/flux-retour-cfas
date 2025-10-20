import { rncpDb, romeSecteurActivitesDb } from "@/common/model/collections";

export const getRomeSecteurActivitesArborescence = () => {
  return romeSecteurActivitesDb()
    .find({}, { projection: { _id: 1, code_secteur: 1, libelle_secteur: 1 } })
    .toArray();
};

export const getRomesByCodeSecteur = async (codeSecteur: number): Promise<string[]> => {
  const secteur = await romeSecteurActivitesDb().findOne({ code_secteur: codeSecteur });
  if (!secteur) {
    return [];
  }
  return secteur.romes.map((r) => r.code_rome);
};

export const getRomeByRncp = async (rncp?: string | null) => {
  if (!rncp) {
    return [];
  }
  const data = await rncpDb().find({ rncp }).next();
  return data ? data.romes : [];
};
