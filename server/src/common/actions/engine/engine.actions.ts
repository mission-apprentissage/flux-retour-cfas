import { isEqual } from "date-fns";
import { cloneDeep, get } from "lodash-es";
import { PartialDeep } from "type-fest";

import { findEffectifByQuery } from "@/common/actions/effectifs.actions";
import {
  createOrganisme,
  findOrganismeBySiret,
  findOrganismeByUai,
  findOrganismeByUaiAndSiret,
  structureOrganisme,
} from "@/common/actions/organismes/organismes.actions";
import { getCodePostalInfo } from "@/common/apis/apiTablesCorrespondances";
import { DEPARTEMENTS_BY_CODE, ACADEMIES_BY_CODE, REGIONS_BY_CODE } from "@/common/constants/territoires";
import { Organisme } from "@/common/model/@types";
import { Effectif } from "@/common/model/@types/Effectif";
import { EffectifsQueue } from "@/common/model/@types/EffectifsQueue";
import { stripEmptyFields } from "@/common/utils/miscUtils";

import { mapFiabilizedOrganismeUaiSiretCouple } from "./engine.organismes.utils";

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

  // Vérification si le nouveau statut existe déjà dans l'historique actuel
  const statutExistsInHistorique = historique_statut_apprenant_existant.find((historiqueItem) => {
    return (
      historiqueItem.valeur_statut === updated_statut_apprenant &&
      isEqual(new Date(historiqueItem.date_statut), new Date(updated_date_metier_mise_a_jour_statut))
    );
  });

  // Si le statut n'existe pas déjà on l'ajoute
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
 * Fonction de remplissage des données de l'adresse depuis un code_postal / code_insee via appel aux TCO
 */
export const completeEffectifAddress = async <T extends Partial<Effectif>>(effectifData: T) => {
  if (!effectifData.apprenant?.adresse) {
    return effectifData;
  }
  const codePostalOrCodeInsee =
    effectifData.apprenant?.adresse?.code_insee || effectifData.apprenant?.adresse?.code_postal;

  if (!codePostalOrCodeInsee) {
    return effectifData;
  }
  const effectifDataWithAddress: T & { apprenant: Effectif["apprenant"] } = cloneDeep(effectifData);

  const cpInfo = await getCodePostalInfo(codePostalOrCodeInsee);
  const adresseInfo = cpInfo?.result;
  // TODO FIXME cpInfo.messages.error is NOT handle (example fail code 2B734)
  if (!adresseInfo) {
    return effectifData;
  }

  effectifDataWithAddress.apprenant.adresse = {
    ...effectifDataWithAddress.apprenant.adresse,
    commune: adresseInfo.commune,
    code_insee: adresseInfo.code_commune_insee,
    code_postal: adresseInfo.code_postal,
    departement: DEPARTEMENTS_BY_CODE[adresseInfo.num_departement] ? (adresseInfo.num_departement as any) : undefined,
    academie: ACADEMIES_BY_CODE[adresseInfo.num_academie?.toString()]
      ? (adresseInfo.num_academie?.toString() as any)
      : undefined,
    region: REGIONS_BY_CODE[adresseInfo.num_region] ? (adresseInfo.num_region as any) : undefined,
  };

  return effectifDataWithAddress;
};

export const checkIfEffectifExists = async (
  effectif: Effectif,
  queryKeys = ["formation.cfd", "annee_scolaire", "apprenant.nom", "apprenant.prenom"]
) => {
  // Recherche de l'effectif via sa clé d'unicité
  const query = queryKeys.reduce((acc, item) => ({ ...acc, [item]: get(effectif, item) }), {});
  return await findEffectifByQuery(query);
};

/**
 * Création d'un objet effectif depuis les données d'un dossierApprenant
 */
export const mapEffectifQueueToEffectif = (dossiersApprenant: EffectifsQueue): PartialDeep<Effectif> => {
  const {
    annee_scolaire,
    source,
    id_erp_apprenant,
    id_formation: cfd,
    formation_rncp: rncp,
    libelle_long_formation: libelle_long,
    periode_formation: periode,
    annee_formation: annee,
    code_commune_insee_apprenant,
    contrat_date_debut,
    contrat_date_fin,
    contrat_date_rupture,
    statut_apprenant,
    date_metier_mise_a_jour_statut,
    nom_apprenant: nom,
    prenom_apprenant: prenom,
    ine_apprenant: ine,
    date_de_naissance_apprenant: date_de_naissance,
    email_contact: courriel,
    tel_apprenant: telephone,
  } = dossiersApprenant;

  return stripEmptyFields({
    annee_scolaire,
    source,
    id_erp_apprenant,
    apprenant: {
      historique_statut: [
        {
          valeur_statut: statut_apprenant,
          date_statut: new Date(date_metier_mise_a_jour_statut),
          date_reception: new Date(),
        },
      ] as Effectif["apprenant"]["historique_statut"],
      ine,
      nom,
      prenom,
      date_de_naissance,
      courriel,
      telephone,
      adresse: { code_insee: code_commune_insee_apprenant },
    },
    // Construction d'une liste de contrat avec un seul élément matchant les 3 dates si nécessaire
    contrats:
      contrat_date_debut || contrat_date_fin || contrat_date_rupture
        ? [
            stripEmptyFields({
              date_debut: contrat_date_debut,
              date_fin: contrat_date_fin,
              date_rupture: contrat_date_rupture,
            }),
          ]
        : [],
    formation: {
      cfd,
      rncp,
      libelle_long,
      periode,
      annee,
    },
  });
};

/**
 * Création d'un objet organisme depuis les données d'un dossierApprenant
 */
export const mapEffectifQueueToOrganisme = (
  dossiersApprenant: EffectifsQueue
): Pick<Partial<Organisme>, "nom" | "uai" | "siret"> => {
  return {
    uai: dossiersApprenant.uai_etablissement,
    siret: dossiersApprenant.siret_etablissement,
    nom: dossiersApprenant.nom_etablissement,
  };
};

/**
 * Fonction de remplissage et contrôle des données d'un organisme
 * Contrôle si l'organisme passe la fiabilisation
 * Contrôle si l'organisme existe déja
 * Si nécessaire va renvoyer un organisme fiabilisé à créer
 * ?? Pas besoin d'update car le runEngine ne va que créer / contrôler l'existant
 * ?? -> La MAJ d'un organisme ne doit pas se faire via l'API / migration ???
 */
export const findOrCreateOrganisme = async (organisme: ReturnType<typeof mapEffectifQueueToOrganisme>) => {
  const { uai, siret } = organisme;

  // Applique le mapping de fiabilisation
  const { cleanUai, cleanSiret } = await mapFiabilizedOrganismeUaiSiretCouple({
    uai,
    siret,
  });

  // Si pas de siret après fiabilisation -> erreur
  if (!cleanSiret) {
    throw new Error("Impossible de créer l'organisme d'uai ${uai} avec un SIRET vide");
  }

  // Applique les règles de rejection si pas dans la db
  const organismeFoundWithUaiSiret = await findOrganismeByUaiAndSiret(cleanUai, cleanSiret);

  if (organismeFoundWithUaiSiret) {
    return organismeFoundWithUaiSiret;
  }

  if (cleanSiret) {
    const organismeFoundWithSiret = await findOrganismeBySiret(cleanSiret);
    // Si pour le couple uai-siret IN on trouve le SIRET mais un UAI différent -> erreur
    if (organismeFoundWithSiret?._id)
      throw new Error(
        `L'organisme ayant le SIRET ${siret} existe déja en base avec un UAI différent : ${organismeFoundWithSiret.uai} (reçu ${uai})`
      );
  }
  if (cleanUai) {
    const organismeFoundWithUai = await findOrganismeByUai(cleanUai);
    // Si pour le couple uai-siret IN on trouve l'UAI mais un SIRET différent -> erreur
    if (organismeFoundWithUai?._id)
      throw new Error(
        `L'organisme ayant l'UAI ${uai} existe déja en base avec un SIRET différent : ${organismeFoundWithUai.siret} (reçu ${siret})`
      );
  }

  // nouvelle organisme, on va récupérer les données avec l'API entreprise
  const organismeData = await structureOrganisme({
    ...organisme,
    ...(cleanUai ? { uai: cleanUai } : {}),
    ...(cleanSiret ? { siret: cleanSiret } : {}),
  });
  const newOrganisme = await createOrganisme(organismeData as Organisme);

  return newOrganisme;
};
