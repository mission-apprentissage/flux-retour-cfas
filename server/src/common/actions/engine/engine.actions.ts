import { isEqual } from "date-fns";
import { cloneDeep, get } from "lodash-es";
import { DEPARTEMENTS_BY_CODE, ACADEMIES_BY_CODE, REGIONS_BY_CODE } from "shared";
import { PartialDeep } from "type-fest";

import { findEffectifByQuery } from "@/common/actions/effectifs.actions";
import { getCodePostalInfo } from "@/common/apis/apiTablesCorrespondances";
import logger from "@/common/logger";
import { Effectif } from "@/common/model/@types/Effectif";
import { EffectifsQueue } from "@/common/model/@types/EffectifsQueue";
import { stripEmptyFields } from "@/common/utils/miscUtils";

/**
 * Méthode de construction d'un nouveau tableau d'historique de statut
 * a partir d'un nouveau couple statut / date_metier
 * Va append au tableau un nouvel élément si nécessaire
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
export const completeEffectifAddress = async <T extends Partial<Effectif>>(effectifData: T): Promise<T> => {
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
  if (!adresseInfo || cpInfo.messages.error) {
    logger.warn({ code: codePostalOrCodeInsee, err: cpInfo?.messages.error }, "missing code postal in TCO");
    return effectifData;
  }

  effectifDataWithAddress.apprenant.adresse = stripEmptyFields({
    ...effectifDataWithAddress.apprenant.adresse,
    commune: adresseInfo.commune,
    code_insee: adresseInfo.code_commune_insee,
    code_postal: adresseInfo.code_postal,
    departement: DEPARTEMENTS_BY_CODE[adresseInfo.num_departement] ? (adresseInfo.num_departement as any) : undefined,
    academie: ACADEMIES_BY_CODE[adresseInfo.num_academie?.toString()]
      ? (adresseInfo.num_academie?.toString() as any)
      : undefined,
    region: REGIONS_BY_CODE[adresseInfo.num_region] ? (adresseInfo.num_region as any) : undefined,
  });

  return effectifDataWithAddress;
};

/**
 * Fonction de vérification de la présence d'un effectif via la clé d'unicité
 * id_erp_apprenant : identifiant unique du jeune dans le CFA
 * organisme_id : identifiant de l'organisme de formation en apprentissage
 * formation.cfd : Code formation diplôme de la formation suivie par le jeune
 * annee_scolaire : Année scolaire dans laquelle se trouve le jeune pour cette formation dans cet établissement
 */
export const checkIfEffectifExists = async (
  effectif: Effectif,
  queryKeys = ["id_erp_apprenant", "organisme_id", "formation.cfd", "annee_scolaire"]
) => {
  // Recherche de l'effectif via sa clé d'unicité
  const query = queryKeys.reduce((acc, item) => ({ ...acc, [item]: get(effectif, item) }), {});

  return await findEffectifByQuery(query);
};

/**
 * Création d'un objet effectif depuis les données d'un dossierApprenant.
 * Fonctionne pour l'API v2 et v3.
 */
export const mapEffectifQueueToEffectif = (
  // devrait être le schéma validé
  // dossierApprenant: DossierApprenantSchemaV1V2ZodType | DossierApprenantSchemaV3ZodType
  dossierApprenant: EffectifsQueue
): PartialDeep<Effectif> => {
  const newHistoriqueStatut = {
    valeur_statut: dossierApprenant.statut_apprenant,
    date_statut: new Date(dossierApprenant.date_metier_mise_a_jour_statut),
    date_reception: new Date(),
  };
  const contrats: PartialDeep<Effectif["contrats"]> = [
    stripEmptyFields({
      date_debut: dossierApprenant.contrat_date_debut,
      date_fin: dossierApprenant.contrat_date_fin,
      date_rupture: dossierApprenant.contrat_date_rupture,
      cause_rupture: dossierApprenant.cause_rupture_contrat,
      siret: dossierApprenant.siret_employeur,
    }),
    stripEmptyFields({
      date_debut: dossierApprenant.contrat_date_debut_2,
      date_fin: dossierApprenant.contrat_date_fin_2,
      date_rupture: dossierApprenant.contrat_date_rupture_2,
      cause_rupture: dossierApprenant.cause_rupture_contrat_2,
      siret: dossierApprenant.siret_employeur_2,
    }),
    stripEmptyFields({
      date_debut: dossierApprenant.contrat_date_debut_3,
      date_fin: dossierApprenant.contrat_date_fin_3,
      date_rupture: dossierApprenant.contrat_date_rupture_3,
      cause_rupture: dossierApprenant.cause_rupture_contrat_3,
      siret: dossierApprenant.siret_employeur_3,
    }),
    stripEmptyFields({
      date_debut: dossierApprenant.contrat_date_debut_4,
      date_fin: dossierApprenant.contrat_date_fin_4,
      date_rupture: dossierApprenant.contrat_date_rupture_4,
      cause_rupture: dossierApprenant.cause_rupture_contrat_4,
      siret: dossierApprenant.siret_employeur_4,
    }),
  ].filter((contrat) => contrat.date_debut || contrat.date_fin || contrat.date_rupture);

  return stripEmptyFields<PartialDeep<Effectif>>({
    annee_scolaire: dossierApprenant.annee_scolaire,
    source: dossierApprenant.source,
    source_organisme_id: dossierApprenant.source_organisme_id,
    id_erp_apprenant: dossierApprenant.id_erp_apprenant,
    apprenant: {
      historique_statut: [newHistoriqueStatut],
      ine: dossierApprenant.ine_apprenant,
      nom: dossierApprenant.nom_apprenant,
      prenom: dossierApprenant.prenom_apprenant,
      date_de_naissance: dossierApprenant.date_de_naissance_apprenant,
      code_postal_de_naissance: dossierApprenant.code_postal_de_naissance_apprenant,
      courriel: dossierApprenant.email_contact,
      telephone: dossierApprenant.tel_apprenant,
      adresse: stripEmptyFields({
        code_insee: dossierApprenant.code_commune_insee_apprenant,
        code_postal: dossierApprenant.code_postal_apprenant,
        complete: dossierApprenant.adresse_apprenant,
      }),
      // Optional v3 fields
      ...stripEmptyFields<PartialDeep<Effectif["apprenant"]>>({
        sexe: dossierApprenant.sexe_apprenant,
        rqth: dossierApprenant.rqth_apprenant,
        date_rqth: dossierApprenant.date_rqth_apprenant,
        nir: dossierApprenant.nir_apprenant,
        responsable_mail1: dossierApprenant.responsable_apprenant_mail1,
        responsable_mail2: dossierApprenant.responsable_apprenant_mail2,
      }),
    },
    contrats,
    formation: {
      cfd: dossierApprenant.formation_cfd || dossierApprenant.id_formation,
      rncp: dossierApprenant.formation_rncp,
      libelle_long: dossierApprenant.libelle_long_formation,
      periode: dossierApprenant.periode_formation,
      annee: dossierApprenant.annee_formation,
      ...stripEmptyFields<PartialDeep<NonNullable<Effectif["formation"]>>>({
        obtention_diplome: dossierApprenant.obtention_diplome_formation,
        date_obtention_diplome: dossierApprenant.date_obtention_diplome_formation,
        date_exclusion: dossierApprenant.date_exclusion_formation,
        cause_exclusion: dossierApprenant.cause_exclusion_formation,
        referent_handicap:
          dossierApprenant.email_referent_handicap_formation ||
          dossierApprenant.prenom_referent_handicap_formation ||
          dossierApprenant.email_referent_handicap_formation
            ? stripEmptyFields({
                nom: dossierApprenant.nom_referent_handicap_formation,
                prenom: dossierApprenant.prenom_referent_handicap_formation,
                email: dossierApprenant.email_referent_handicap_formation,
              })
            : undefined,
        date_inscription: dossierApprenant.date_inscription_formation,
        duree_theorique: dossierApprenant.duree_theorique_formation,
        formation_presentielle: dossierApprenant.formation_presentielle,
        date_fin: dossierApprenant.date_fin_formation,
        date_entree: dossierApprenant.date_entree_formation,
      }),
    },
  });
};
