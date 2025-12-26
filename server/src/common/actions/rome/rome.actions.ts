import { rncpDb, romeSecteurActivitesDb } from "@/common/model/collections";

export const getRomeSecteurActivitesArborescence = (codeSecteurs?: number[]) => {
  const query = codeSecteurs && codeSecteurs.length ? { code_secteur: { $in: codeSecteurs } } : {};

  return romeSecteurActivitesDb()
    .find(query, { projection: { _id: 1, code_secteur: 1, libelle_secteur: 1 } })
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
