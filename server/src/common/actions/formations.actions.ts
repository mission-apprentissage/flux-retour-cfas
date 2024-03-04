import { ObjectId } from "mongodb";
import { isValidCFD } from "shared/constants/validations";
import { IEffectif } from "shared/models/data/effectifs.model";

import { getCfdInfo } from "@/common/apis/apiTablesCorrespondances";
import { formationsDb } from "@/common/model/collections";

/**
 * Checks if formation with given CFD exists
 * @param {string} cfd
 * @return {Promise<boolean>} Does it exist
 */
const existsFormation = async (cfd) => {
  const count = await formationsDb().countDocuments({ cfd });
  return count !== 0;
};

export async function getFormationCfd(effectif: IEffectif): Promise<string | null> {
  if (effectif.formation?.cfd) {
    const formation = await formationsDb().findOne({ cfd: effectif.formation.cfd });
    if (formation) {
      return formation.cfd;
    }
  }

  if (effectif.formation?.rncp) {
    const normalizedRncp = effectif.formation.rncp.toUpperCase().startsWith("RNCP")
      ? effectif.formation.rncp.toUpperCase()
      : `RNCP${effectif.formation.rncp}`;
    const formation = await formationsDb().findOne({ rncps: { $in: [normalizedRncp] } });
    if (formation) {
      return formation.cfd;
    }
  }

  return effectif.formation?.cfd ?? null;
}

/**
 * Returns formation if found with given CFD
 * @param {string} cfd
 * @return {Promise<Object | null>} Found formation
 */
export const getFormationWithCfd = async (cfd: string, projection: any = {}) => {
  return formationsDb().findOne({ cfd }, { projection });
};

/**
 * Méthode d'extraction du niveau depuis le libelle de la formation
 */
export const getNiveauFormationFromLibelle = (niveauFormationLibelle?: string | null) => {
  if (niveauFormationLibelle == null || niveauFormationLibelle === "") return null;

  const niveau = niveauFormationLibelle.split(" ")[0];
  return isNaN(parseInt(niveau, 10)) ? null : niveau;
};

/**
 * Création d'une formation à partir du cfd / durée & année optionnelles provenant du catalogue
 * Va faire un appel API aux TCO puis à LBA pour remplir les données de la formation
 * @param {Object} formation - Formation à créer
 * @param {string} formation.cfd - CFD de la formation
 * @param {string|null} [formation.duree] - Durée théorique de la formation issue du catalogue si fournie
 * @param {string|null} [formation.annee] - Année de la formation issue du catalogue si fournie
 * @returns {Promise<ObjectId>} Id de la formation crée en base
 */
export const createFormation = async ({
  cfd,
  duree = null,
  annee = null,
}: {
  cfd: string;
  duree?: string | null;
  annee?: string | null;
}) => {
  if (!isValidCFD(cfd)) {
    throw Error("Invalid CFD");
  }

  const alreadyExists = await existsFormation(cfd);
  if (alreadyExists) {
    throw new Error(`A Formation with CFD ${cfd} already exists`);
  }

  // Call TCO Api
  const formationInfo = await getCfdInfo(cfd);

  // Libelle
  const libelleFormationBuilt = formationInfo?.intitule_long || "";

  const { insertedId } = await formationsDb().insertOne({
    _id: new ObjectId(),
    cfd,
    cfd_start_date: formationInfo?.date_ouverture ? new Date(formationInfo?.date_ouverture) : null, // timestamp format is returned by TCO
    cfd_end_date: formationInfo?.date_fermeture ? new Date(formationInfo?.date_fermeture) : null, // timestamp format is returned by TCO
    rncps: formationInfo?.rncps?.map((item) => item.code_rncp) || [], // Returned by TCO
    libelle: libelleFormationBuilt,
    niveau: getNiveauFormationFromLibelle(formationInfo?.niveau),
    niveau_libelle: formationInfo?.niveau,
    metiers: [],
    duree,
    annee,
    created_at: new Date(),
    updated_at: null,
  });

  return insertedId;
};
