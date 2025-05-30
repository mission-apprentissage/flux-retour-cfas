import { isEqual } from "date-fns";
import { cloneDeep } from "lodash-es";
import { Collection } from "mongodb";
import { CODES_STATUT_APPRENANT } from "shared/constants";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";

import { getCommune } from "@/common/apis/apiAlternance/apiAlternance";

/**
 * Méthode de construction d'un nouveau tableau d'historique de statut
 * a partir d'un nouveau couple statut / date_metier
 * Va append au tableau un nouvel élément si nécessaire
 */
export const buildNewHistoriqueStatutApprenant = (
  historique_statut_apprenant_existant: IEffectif["apprenant"]["historique_statut"],
  updated_statut_apprenant?: IEffectif["apprenant"]["historique_statut"][0]["valeur_statut"],
  updated_date_metier_mise_a_jour_statut: Date = new Date()
) => {
  if (updated_statut_apprenant == null) return historique_statut_apprenant_existant;

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

export const getAndFormatCommuneFromCode = async (
  insee: string | null | undefined,
  postal: string | null | undefined
) => {
  if (!insee && !postal) {
    return {};
  }
  try {
    const communeInfo = await getCommune({
      codeInsee: insee,
      codePostal: postal,
    });

    return communeInfo
      ? {
          commune: communeInfo.nom,
          code_insee: communeInfo.code.insee,
          code_postal: postal ?? communeInfo.code.postaux[0],
          departement: communeInfo.departement.codeInsee,
          academie: communeInfo.academie.code,
          region: communeInfo.region.codeInsee,
          mission_locale_id: communeInfo.mission_locale?.id,
        }
      : {};
  } catch (e) {
    return {};
  }
};
/**
 * Fonction de remplissage des données de l'adresse depuis un code_postal / code_insee via appel aux TCO
 */
export const completeEffectifAddress = async <T extends { apprenant: Partial<IEffectif["apprenant"]> }>(
  effectifData: T
): Promise<T> => {
  const effectifDataWithAddress = cloneDeep(effectifData);

  effectifDataWithAddress.apprenant.adresse = {
    ...effectifDataWithAddress.apprenant.adresse,
    ...(await getAndFormatCommuneFromCode(
      effectifData.apprenant?.adresse?.code_insee,
      effectifData.apprenant?.adresse?.code_postal
    )),
  };

  effectifDataWithAddress.apprenant.adresse_naissance = {
    ...effectifDataWithAddress.apprenant.adresse_naissance,
    ...(await getAndFormatCommuneFromCode(
      effectifData.apprenant?.adresse_naissance?.code_insee,
      effectifData.apprenant?.adresse_naissance?.code_postal
    )),
  };
  return effectifDataWithAddress;
};

export const checkIfEffectifExists = async <E extends IEffectif | IEffectifDECA>(
  effectif: Pick<E, "id_erp_apprenant" | "organisme_id" | "annee_scolaire">,
  db: Collection<any>
): Promise<E | null> => {
  return db.findOne({
    id_erp_apprenant: effectif.id_erp_apprenant,
    organisme_id: effectif.organisme_id,
    annee_scolaire: effectif.annee_scolaire,
  });
};

const getAbandonDate = (statut_apprenant, date_metier_mise_a_jour_statut, date_exclusion_formation) => {
  if (date_exclusion_formation) {
    return date_exclusion_formation;
  }
  return statut_apprenant !== null &&
    date_metier_mise_a_jour_statut &&
    statut_apprenant === CODES_STATUT_APPRENANT.abandon
    ? date_metier_mise_a_jour_statut
    : null;
};
/**
 * Création d'un objet effectif depuis les données d'un dossierApprenant.
 * Fonctionne pour l'API v2 et v3.
 */
export const mapEffectifQueueToEffectif = (
  dossierApprenant: IDossierApprenantSchemaV3
): Omit<IEffectif, "_id" | "_computed" | "organisme_id"> => {
  // Ne pas remplir l'historique statut en cas de v3
  const { statut_apprenant, date_metier_mise_a_jour_statut, date_exclusion_formation } = dossierApprenant;

  // Temporary fix
  const dateAbandon = getAbandonDate(statut_apprenant, date_metier_mise_a_jour_statut, date_exclusion_formation);

  const historiqueStatut: IEffectif["apprenant"]["historique_statut"] =
    statut_apprenant && date_metier_mise_a_jour_statut
      ? [
          {
            valeur_statut: statut_apprenant,
            date_statut: new Date(date_metier_mise_a_jour_statut),
            date_reception: new Date(),
          },
        ]
      : [];

  const contrats: IEffectif["contrats"] = [
    {
      date_debut: dossierApprenant.contrat_date_debut,
      date_fin: dossierApprenant.contrat_date_fin,
      date_rupture: dossierApprenant.contrat_date_rupture,
      cause_rupture: "cause_rupture_contrat" in dossierApprenant ? dossierApprenant.cause_rupture_contrat : null,
      siret: "siret_employeur" in dossierApprenant ? dossierApprenant.siret_employeur : null,
    },
    {
      date_debut: "contrat_date_debut_2" in dossierApprenant ? dossierApprenant.contrat_date_debut_2 : null,
      date_fin: "contrat_date_fin_2" in dossierApprenant ? dossierApprenant.contrat_date_fin_2 : null,
      date_rupture: "contrat_date_rupture_2" in dossierApprenant ? dossierApprenant.contrat_date_rupture_2 : null,
      cause_rupture: "cause_rupture_contrat_2" in dossierApprenant ? dossierApprenant.cause_rupture_contrat_2 : null,
      siret: "siret_employeur_2" in dossierApprenant ? dossierApprenant.siret_employeur_2 : null,
    },
    {
      date_debut: "contrat_date_debut_3" in dossierApprenant ? dossierApprenant.contrat_date_debut_3 : null,
      date_fin: "contrat_date_fin_3" in dossierApprenant ? dossierApprenant.contrat_date_fin_3 : null,
      date_rupture: "contrat_date_rupture_3" in dossierApprenant ? dossierApprenant.contrat_date_rupture_3 : null,
      cause_rupture: "cause_rupture_contrat_3" in dossierApprenant ? dossierApprenant.cause_rupture_contrat_3 : null,
      siret: "siret_employeur_3" in dossierApprenant ? dossierApprenant.siret_employeur_3 : null,
    },
    {
      date_debut: "contrat_date_debut_4" in dossierApprenant ? dossierApprenant.contrat_date_debut_4 : null,
      date_fin: "contrat_date_fin_4" in dossierApprenant ? dossierApprenant.contrat_date_fin_4 : null,
      date_rupture: "contrat_date_rupture_4" in dossierApprenant ? dossierApprenant.contrat_date_rupture_4 : null,
      cause_rupture: "cause_rupture_contrat_4" in dossierApprenant ? dossierApprenant.cause_rupture_contrat_4 : null,
      siret: "siret_employeur_4" in dossierApprenant ? dossierApprenant.siret_employeur_4 : null,
    },
  ].filter((contrat) => contrat.date_debut || contrat.date_fin || contrat.date_rupture);

  return {
    annee_scolaire: dossierApprenant.annee_scolaire,
    source: dossierApprenant.source,
    source_organisme_id: "source_organisme_id" in dossierApprenant ? dossierApprenant.source_organisme_id : null,
    id_erp_apprenant: dossierApprenant.id_erp_apprenant,
    apprenant: {
      historique_statut: historiqueStatut,
      ine: dossierApprenant.ine_apprenant,
      nom: dossierApprenant.nom_apprenant,
      prenom: dossierApprenant.prenom_apprenant,
      date_de_naissance: dossierApprenant.date_de_naissance_apprenant,
      courriel: dossierApprenant.email_contact,
      telephone: dossierApprenant.tel_apprenant,
      adresse: {
        code_insee: dossierApprenant.code_commune_insee_apprenant,
        code_postal: "code_postal_apprenant" in dossierApprenant ? dossierApprenant.code_postal_apprenant : null,
        complete: "adresse_apprenant" in dossierApprenant ? dossierApprenant.adresse_apprenant : null,
      },
      adresse_naissance: {
        code_insee:
          "code_commune_insee_de_naissance_apprenant" in dossierApprenant
            ? dossierApprenant.code_commune_insee_de_naissance_apprenant
            : null,
        code_postal:
          "code_postal_de_naissance_apprenant" in dossierApprenant
            ? dossierApprenant.code_postal_de_naissance_apprenant
            : null,
      },
      sexe: "sexe_apprenant" in dossierApprenant ? dossierApprenant.sexe_apprenant : null,
      rqth: "rqth_apprenant" in dossierApprenant ? dossierApprenant.rqth_apprenant : null,
      date_rqth: "date_rqth_apprenant" in dossierApprenant ? dossierApprenant.date_rqth_apprenant : null,
      has_nir: "has_nir" in dossierApprenant ? dossierApprenant.has_nir : null,
      responsable_mail1:
        "responsable_apprenant_mail1" in dossierApprenant ? dossierApprenant.responsable_apprenant_mail1 : null,
      responsable_mail2:
        "responsable_apprenant_mail2" in dossierApprenant ? dossierApprenant.responsable_apprenant_mail2 : null,
      derniere_situation:
        "derniere_situation" in dossierApprenant && dossierApprenant.derniere_situation !== 0
          ? dossierApprenant.derniere_situation
          : null,
      dernier_organisme_uai:
        "dernier_organisme_uai" in dossierApprenant ? dossierApprenant.dernier_organisme_uai?.toString() : null,
      type_cfa: "type_cfa" in dossierApprenant ? dossierApprenant.type_cfa : null,
    },
    contrats,
    formation: {
      cfd: "formation_cfd" in dossierApprenant ? dossierApprenant.formation_cfd : null,
      rncp: dossierApprenant.formation_rncp,
      libelle_long: null,
      periode: [],
      annee: dossierApprenant.annee_formation,

      obtention_diplome:
        "obtention_diplome_formation" in dossierApprenant ? dossierApprenant.obtention_diplome_formation : null,
      date_obtention_diplome:
        "date_obtention_diplome_formation" in dossierApprenant
          ? dossierApprenant.date_obtention_diplome_formation
          : null,
      date_exclusion: dateAbandon,
      cause_exclusion:
        "cause_exclusion_formation" in dossierApprenant ? dossierApprenant.cause_exclusion_formation : null,
      referent_handicap:
        ("email_referent_handicap_formation" in dossierApprenant &&
          dossierApprenant.email_referent_handicap_formation) ||
        ("prenom_referent_handicap_formation" in dossierApprenant &&
          dossierApprenant.prenom_referent_handicap_formation) ||
        ("email_referent_handicap_formation" in dossierApprenant && dossierApprenant.email_referent_handicap_formation)
          ? {
              nom: dossierApprenant.nom_referent_handicap_formation,
              prenom: dossierApprenant.prenom_referent_handicap_formation,
              email: dossierApprenant.email_referent_handicap_formation,
            }
          : undefined,
      date_inscription: dossierApprenant.date_inscription_formation,
      // Les ERPs (ou les anciens fichiers de téléversement) peuvent continuer à utiliser duree_theorique_formation
      // qui est l'ancien champ en années (contrairement à duree_theorique_formation_mois qui est en mois).
      // On assure donc une rétrocompatibilité discrète en convertissant le champ en mois si besoin et
      // en mettant dans le bon champ.
      duree_theorique_mois:
        "duree_theorique_formation_mois" in dossierApprenant
          ? dossierApprenant.duree_theorique_formation_mois
          : "duree_theorique_formation" in dossierApprenant && dossierApprenant.duree_theorique_formation
            ? dossierApprenant.duree_theorique_formation * 12
            : undefined,
      formation_presentielle:
        "formation_presentielle" in dossierApprenant ? dossierApprenant.formation_presentielle : null,
      date_fin: dossierApprenant.date_fin_formation,
      date_entree: dossierApprenant.date_entree_formation,
    },
  };
};
