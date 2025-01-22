import { isEqual } from "date-fns";
import { cloneDeep } from "lodash-es";
import { Collection } from "mongodb";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import { PartialDeep } from "type-fest";

import { getCommune } from "@/common/apis/apiAlternance/apiAlternance";
import { stripEmptyFields } from "@/common/utils/miscUtils";

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

/**
 * Fonction de remplissage des données de l'adresse depuis un code_postal / code_insee via appel aux TCO
 */
export const completeEffectifAddress = async <T extends { apprenant: Partial<IEffectif["apprenant"]> }>(
  effectifData: T
): Promise<T> => {
  if (!effectifData.apprenant?.adresse) {
    return effectifData;
  }
  const codePostalOrCodeInsee =
    effectifData.apprenant?.adresse?.code_insee || effectifData.apprenant?.adresse?.code_postal;

  if (!codePostalOrCodeInsee) {
    return effectifData;
  }
  const effectifDataWithAddress = cloneDeep(effectifData);

  const communeInfo = await getCommune({
    codeInsee: effectifData.apprenant?.adresse?.code_insee,
    codePostal: effectifData.apprenant?.adresse?.code_postal,
  });
  if (!communeInfo) {
    return effectifData;
  }

  effectifDataWithAddress.apprenant.adresse = stripEmptyFields({
    ...effectifDataWithAddress.apprenant.adresse,
    commune: communeInfo.nom,
    code_insee: communeInfo.code.insee,
    code_postal: communeInfo.code.postaux[0],
    departement: communeInfo.departement.codeInsee,
    academie: communeInfo.academie.code,
    region: communeInfo.region.codeInsee,
  });

  return effectifDataWithAddress;
};

export const checkIfEffectifExists = async <E extends IEffectif | IEffectifDECA>(
  effectif: Pick<E, "id_erp_apprenant" | "organisme_id" | "annee_scolaire" | "formation">,
  db: Collection<any>
): Promise<E | null> => {
  const effectifs = await db
    .find({
      id_erp_apprenant: effectif.id_erp_apprenant,
      organisme_id: effectif.organisme_id,
      annee_scolaire: effectif.annee_scolaire,
    })
    .toArray();

  const newCfd = effectif.formation?.cfd ?? null;
  const newRncp = effectif.formation?.rncp ?? null;

  const macthingEffectifs = effectifs.filter((eff) => {
    const currentCfd = eff.formation?.cfd ?? null;
    const currentRncp = eff.formation?.rncp ?? null;

    // Si le CFD est null, on considère qu'on met à jour l'effectif
    const isSameCfd = currentCfd === newCfd || currentCfd === null || newCfd === null;
    const isSameRncp = currentRncp === newRncp || currentRncp === null || newRncp === null;

    return isSameCfd && isSameRncp;
  });

  if (macthingEffectifs.length === 0) {
    return null;
  }

  return macthingEffectifs[0];
};

/**
 * Création d'un objet effectif depuis les données d'un dossierApprenant.
 * Fonctionne pour l'API v2 et v3.
 */
export const mapEffectifQueueToEffectif = (
  // devrait être le schéma validé
  // dossierApprenant: DossierApprenantSchemaV1V2ZodType | DossierApprenantSchemaV3ZodType
  dossierApprenant: IEffectifQueue
): PartialDeep<IEffectif> => {
  // Ne pas remplir l'historique statut en cas de v3
  const { statut_apprenant, date_metier_mise_a_jour_statut } = dossierApprenant;
  const historiqueStatut =
    statut_apprenant && date_metier_mise_a_jour_statut
      ? [
          {
            valeur_statut: dossierApprenant.statut_apprenant,
            date_statut: new Date(dossierApprenant.date_metier_mise_a_jour_statut),
            date_reception: new Date(),
          },
        ]
      : [];
  const contrats: PartialDeep<IEffectif["contrats"]> = [
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

  return stripEmptyFields<PartialDeep<IEffectif>>({
    annee_scolaire: dossierApprenant.annee_scolaire,
    source: dossierApprenant.source,
    source_organisme_id: dossierApprenant.source_organisme_id,
    id_erp_apprenant: dossierApprenant.id_erp_apprenant,
    apprenant: {
      historique_statut: historiqueStatut,
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
      ...stripEmptyFields<PartialDeep<IEffectif["apprenant"]>>({
        sexe: dossierApprenant.sexe_apprenant,
        rqth: dossierApprenant.rqth_apprenant,
        date_rqth: dossierApprenant.date_rqth_apprenant,
        has_nir: dossierApprenant.has_nir,
        responsable_mail1: dossierApprenant.responsable_apprenant_mail1,
        responsable_mail2: dossierApprenant.responsable_apprenant_mail2,
        derniere_situation: dossierApprenant.derniere_situation,
        dernier_organisme_uai: dossierApprenant.dernier_organisme_uai?.toString(),
        type_cfa: dossierApprenant.type_cfa,
      }),
    },
    contrats,
    formation: {
      cfd: dossierApprenant.formation_cfd || dossierApprenant.id_formation,
      rncp: dossierApprenant.formation_rncp,
      libelle_long: dossierApprenant.libelle_long_formation,
      periode: dossierApprenant.periode_formation,
      annee: dossierApprenant.annee_formation,
      ...stripEmptyFields<PartialDeep<NonNullable<IEffectif["formation"]>>>({
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
        // Les ERPs (ou les anciens fichiers de téléversement) peuvent continuer à utiliser duree_theorique_formation
        // qui est l'ancien champ en années (contrairement à duree_theorique_formation_mois qui est en mois).
        // On assure donc une rétrocompatibilité discrète en convertissant le champ en mois si besoin et
        // en mettant dans le bon champ.
        duree_theorique_mois: dossierApprenant.duree_theorique_formation_mois
          ? dossierApprenant.duree_theorique_formation_mois
          : dossierApprenant.duree_theorique_formation
            ? dossierApprenant.duree_theorique_formation * 12
            : undefined,
        formation_presentielle: dossierApprenant.formation_presentielle,
        date_fin: dossierApprenant.date_fin_formation,
        date_entree: dossierApprenant.date_entree_formation,
      }),
    },
  });
};
