import { ObjectId } from "mongodb";

import { getCfdInfo } from "@/common/apis/apiTablesCorrespondances";
import { formationsDb } from "@/common/model/collections";

import { isValidCFD } from "../constants/validations";

/**
 * Checks if formation with given CFD exists
 * @param {string} cfd
 * @return {Promise<boolean>} Does it exist
 */
export const existsFormation = async (cfd) => {
  const count = await formationsDb().countDocuments({ cfd });
  return count !== 0;
};

/**
 * Returns formation if found with given CFD
 * @param {string} cfd
 * @return {Promise<Object | null>} Found formation
 */
export const getFormationWithCfd = async (cfd: string, projection: any = {}) => {
  return formationsDb().findOne({ cfd }, { projection });
};

export const getFormationWithRNCP = async (rncp: string, projection = {}) => {
  const normalizedRncp = rncp.toUpperCase().startsWith("RNCP") ? rncp.toUpperCase() : `RNCP${rncp}`;

  return formationsDb().findOne({ rncps: { $in: [normalizedRncp] } }, { projection });
};

/**
 * Méthode de récupération d'une formation depuis un id
 */
export const findFormationById = async (id: string | ObjectId, projection = {}) => {
  return formationsDb().findOne({ _id: new ObjectId(id) }, { projection });
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
