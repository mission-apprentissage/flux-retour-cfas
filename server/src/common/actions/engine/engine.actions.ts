import Joi from "joi";
import { isEqual } from "date-fns";
import { capitalize, cloneDeep, get } from "lodash-es";

import { getCodePostalInfo } from "../../apis/apiTablesCorrespondances.js";
import { ACADEMIES, REGIONS, DEPARTEMENTS } from "../../constants/territoires.js";
import { dateFormatter, dateStringToLuxon, jsDateToLuxon } from "../../utils/formatterUtils.js";
import { telephoneConverter } from "../../validation/utils/frenchTelephoneNumber.js";
import { buildEffectif, findEffectifByQuery, validateEffectifObject } from "../effectifs.actions.js";
import {
  findOrganismeBySiret,
  findOrganismeByUai,
  findOrganismeByUaiAndSiret,
} from "../organismes/organismes.actions.js";
import { mapFiabilizedOrganismeUaiSiretCouple } from "./engine.organismes.utils.js";
import { Effectif } from "@/common/model/@types/Effectif.js";
import { ObjectId } from "mongodb";

/**
 * Méthode de construction d'un nouveau tableau d'historique de statut
 * a partir d'un nouveau couple statut / date_metier
 * Va append au tableau un nouvel élément si nécessaire
 * @param {*} historique_statut_apprenant_existant
 * @param {*} updated_statut_apprenant
 * @param {*} updated_date_metier_mise_a_jour_statut
 * @returns
 */
export const buildNewHistoriqueStatutApprenant = (
  historique_statut_apprenant_existant: Effectif["apprenant"]["historique_statut"],
  updated_statut_apprenant: Effectif["apprenant"]["historique_statut"][0]["valeur_statut"],
  updated_date_metier_mise_a_jour_statut: Date
) => {
  if (!updated_statut_apprenant) return historique_statut_apprenant_existant;

  let newHistoriqueStatutApprenant = historique_statut_apprenant_existant;

  // Vérification si le nouveau statut existe déja dans l'historique actuel
  const statutExistsInHistorique = historique_statut_apprenant_existant.find((historiqueItem) => {
    return (
      historiqueItem.valeur_statut === updated_statut_apprenant &&
      isEqual(new Date(historiqueItem.date_statut), new Date(updated_date_metier_mise_a_jour_statut))
    );
  });

  // Si le statut n'existe pas déja on l'ajoute
  if (!statutExistsInHistorique) {
    const newHistoriqueElement = {
      valeur_statut: updated_statut_apprenant,
      date_statut: new Date(updated_date_metier_mise_a_jour_statut),
      date_reception: new Date(),
    };

    // add new element to historique
    const historique = historique_statut_apprenant_existant.slice();
    historique.push(newHistoriqueElement);

    // sort historique chronologically
    const historiqueSorted = historique.sort((a, b) => {
      return a.date_statut.getTime() - b.date_statut.getTime();
    });

    // find new element index in sorted historique to remove subsequent ones
    const newElementIndex = historiqueSorted.findIndex((el) => el.date_statut === newHistoriqueElement.date_statut);
    newHistoriqueStatutApprenant = historiqueSorted.slice(0, newElementIndex + 1);
  }

  return newHistoriqueStatutApprenant;
};

/**
 * Fonction de remplissage d'un effectif à créer ou à mettre à jour
 * Contrôle si l'effectif en entrée existe déja en base
 * Va créer un effectif structuré avec les erreurs éventuelles de modèle
 * @param {*} effectifData
 * @param {*} [options]
 */
export const hydrateEffectif = async (effectifData: Effectif & { organisme_id: ObjectId }, options?: any) => {
  const queryKeys = options?.queryKeys ?? ["formation.cfd", "annee_scolaire", "apprenant.nom", "apprenant.prenom"];
  const checkIfExist = options?.checkIfExist ?? false;

  let {
    annee_scolaire,
    source,
    id_erp_apprenant,
    apprenant: { nom, prenom },
    formation: { cfd },
  } = await Joi.object({
    organisme_id: Joi.any().required(),
    annee_scolaire: Joi.string().required(),
    source: Joi.string().required(),
    id_erp_apprenant: Joi.string().required(),
    apprenant: Joi.object({
      nom: Joi.string().allow("").required(),
      prenom: Joi.string().allow("").required(),
    }).unknown(),
    formation: Joi.object({
      cfd: Joi.string().allow("").required(),
    }).unknown(),
  })
    .unknown()
    .validateAsync(effectifData, { abortEarly: false });

  let convertedEffectif = cloneDeep(effectifData);

  const dateConverter = (date) => {
    // TODO If more than year 4000 error
    if (date instanceof Date) return jsDateToLuxon(date).toISO();
    else {
      const date_ISO = dateStringToLuxon(dateFormatter(date)).toISO();
      return date_ISO ?? date;
    }
  };

  if (effectifData.apprenant.date_de_naissance) {
    convertedEffectif.apprenant.date_de_naissance = dateConverter(effectifData.apprenant.date_de_naissance);
  }

  if (effectifData.apprenant.contrats?.length) {
    for (const [key, contrat] of effectifData.apprenant.contrats.entries()) {
      if (contrat.date_debut) {
        convertedEffectif.apprenant.contrats[key].date_debut = dateConverter(contrat.date_debut);
      }
      if (contrat.date_fin) {
        convertedEffectif.apprenant.contrats[key].date_fin = dateConverter(contrat.date_fin);
      }
      if (contrat.date_rupture) {
        convertedEffectif.apprenant.contrats[key].date_rupture = dateConverter(contrat.date_rupture);
      }
    }
  }

  if (effectifData.apprenant.historique_statut?.length) {
    for (const [key, contrat] of effectifData.apprenant.historique_statut.entries()) {
      if (contrat.date_statut) {
        convertedEffectif.apprenant.historique_statut[key].date_statut = dateConverter(contrat.date_statut);
      }
    }
  }

  if (effectifData?.formation?.date_debut_formation) {
    convertedEffectif.formation.date_debut_formation = dateConverter(effectifData.formation.date_debut_formation);
  }
  if (effectifData?.formation?.date_fin_formation) {
    convertedEffectif.formation.date_fin_formation = dateConverter(effectifData.formation.date_fin_formation);
  }
  if (effectifData?.formation?.date_obtention_diplome) {
    convertedEffectif.formation.date_obtention_diplome = dateConverter(effectifData.formation.date_obtention_diplome);
  }

  const repetitionVoieConverter = (repetition_voie) => {
    const fullRep = { Bis: "B", Ter: "T", Quater: "Q", ["Quinquiès"]: "C" };
    return fullRep[capitalize(repetition_voie)] ?? repetition_voie;
  };
  if (effectifData.apprenant.adresse?.repetition_voie) {
    convertedEffectif.apprenant.adresse.repetition_voie = repetitionVoieConverter(
      effectifData.apprenant.adresse.repetition_voie.trim()
    );
  }
  // TODO other repetition_voie

  /**
   * Fonction de remplissage des données de l'adresse depuis un code_postal / code_insee via appel aux TCO
   * @param {*} codePostalOrCodeInsee
   */
  const fillConvertedEffectifAdresseData = async (codePostalOrCodeInsee) => {
    const cpInfo = await getCodePostalInfo(codePostalOrCodeInsee);
    const adresseInfo = cpInfo?.result;
    if (adresseInfo?.code_postal) {
      convertedEffectif.apprenant.adresse.code_postal = adresseInfo.code_postal;
    }

    if (adresseInfo?.code_commune_insee) {
      convertedEffectif.apprenant.adresse.code_insee = adresseInfo.code_commune_insee;
    }

    if (adresseInfo?.commune) {
      convertedEffectif.apprenant.adresse.commune = adresseInfo.commune;
    }

    // Lookup département code in reference list
    if (adresseInfo?.num_departement && DEPARTEMENTS.map(({ code }) => code).includes(adresseInfo.num_departement)) {
      convertedEffectif.apprenant.adresse.departement = adresseInfo.num_departement;
    }

    // Lookup academie code in reference list
    if (
      adresseInfo?.num_academie &&
      Object.values(ACADEMIES)
        .map(({ code }) => `${code}`)
        .includes(`${adresseInfo.num_academie}`)
    ) {
      convertedEffectif.apprenant.adresse.academie = `${adresseInfo.num_academie}`;
    }

    // Lookup région code in reference list
    if (
      adresseInfo?.num_region &&
      Object.values(REGIONS)
        .map(({ code }) => code)
        .includes(adresseInfo.num_region)
    ) {
      convertedEffectif.apprenant.adresse.region = adresseInfo.num_region;
    }
  };

  if (effectifData.apprenant.adresse?.code_insee) {
    await fillConvertedEffectifAdresseData(effectifData.apprenant.adresse?.code_insee);
  } else if (effectifData.apprenant.adresse?.code_postal) {
    await fillConvertedEffectifAdresseData(effectifData.apprenant.adresse?.code_postal);
  }

  if (effectifData.apprenant.telephone) {
    convertedEffectif.apprenant.telephone = telephoneConverter(effectifData.apprenant.telephone);
  }
  if (effectifData.apprenant.representant_legal?.telephone) {
    convertedEffectif.apprenant.representant_legal.telephone = telephoneConverter(
      effectifData.apprenant.representant_legal.telephone
    );
  }

  const effectif = buildEffectif(
    {
      organisme_id: effectifData.organisme_id,
      annee_scolaire,
      source,
      id_erp_apprenant,
      ...convertedEffectif,
      apprenant: {
        nom,
        prenom,
        ...convertedEffectif.apprenant,
      },
      formation: {
        cfd,
        ...convertedEffectif.formation,
      },
    },
    false
  );

  const validatedEffectif = validateEffectifObject(effectif);

  let found: any = null;
  if (checkIfExist) {
    // Recherche de l'effectif via sa clé d'unicité
    const query = queryKeys.reduce((acc, item) => ({ ...acc, [item]: get(effectif, item) }), {});
    found = await findEffectifByQuery(query);
  }

  return { effectif: validatedEffectif, found };
};

/**
 * Fonction de remplissage et contrôle des données d'un organisme
 * Contrôle si l'organisme passe la fiabilisation
 * Contrôle si l'organisme existe déja
 * Si nécessaire va renvoyer un organisme fiabilisé à créer
 * ?? Pas besoin d'update car le runEngine ne va que créer / contrôler l'existant
 * ?? -> La MAJ d'un organisme ne doit pas se faire via l'API / migration ???
 */
export const resolveOrganisme = async ({ uai, siret }: { uai?: string | undefined; siret?: string | undefined }) => {
  let error: string | null = null;

  // Applique le mapping de fiabilisation
  const { cleanUai, cleanSiret } = await mapFiabilizedOrganismeUaiSiretCouple({
    uai,
    siret,
  });

  // Si pas de siret après fiabilisation -> erreur
  if (!cleanSiret) error = `Impossible de créer l'organisme d'uai ${uai} avec un SIRET vide`;

  // Applique les règles de rejection si pas dans la db
  const organismeFoundWithUaiSiret = await findOrganismeByUaiAndSiret(cleanUai, cleanSiret);

  if (!organismeFoundWithUaiSiret) {
    if (cleanSiret) {
      const organismeFoundWithSiret = await findOrganismeBySiret(cleanSiret);
      // Si pour le couple uai-siret IN on trouve le SIRET mais un UAI différent -> erreur
      if (organismeFoundWithSiret?._id)
        error = `L'organisme ayant le SIRET ${siret} existe déja en base avec un UAI différent : ${organismeFoundWithSiret.uai}`;
    }
    if (cleanUai) {
      const organismeFoundWithUai = await findOrganismeByUai(cleanUai);
      // Si pour le couple uai-siret IN on trouve l'UAI mais un SIRET différent -> erreur
      if (organismeFoundWithUai?._id)
        error = `L'organisme ayant l'UAI ${uai} existe déja en base avec un SIRET différent : ${organismeFoundWithUai.siret}`;
    }
  }

  return {
    organisme: organismeFoundWithUaiSiret || { _id: undefined, uai: cleanUai, siret: cleanSiret },
    error: error,
  };
};
