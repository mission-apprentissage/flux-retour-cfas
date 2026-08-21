"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { SOURCE_APPRENANT, TD_MANUEL_ELEMENT_LINK } from "shared";
import { dossierApprenantSchemaV3Base } from "shared/models/parts/dossierApprenantSchemaV3";
import { z } from "zod";

import { formatPhoneNumber } from "@/app/_utils/phone.utils";

import { ErrorMessages } from "./effectifQueueErrorMessages";
import styles from "./transmissions.module.scss";

const attributes = [
  { label: "Identifant ERP", value: "id_erp_apprenant" },
  { label: "Nom de naissance", value: "nom_apprenant" },
  { label: "Prénom", value: "prenom_apprenant" },
  { label: "Date de naissance", value: "date_de_naissance_apprenant" },
  { label: "Sexe", value: "sexe_apprenant" },
  { label: "Code postal de naissance", value: "code_postal_de_naissance_apprenant" },
  { label: "Courriel", value: "email_contact" },
  { label: "Adresse", value: "adresse_apprenant" },
  { label: "Code postal de résidence", value: "code_postal_apprenant" },
  { label: "INE de l'apprenant", value: "ine_apprenant" },
  { label: "Téléphone", value: "tel_apprenant" },
  { label: "RQTH", value: "rqth_apprenant" },
  { label: "Date de reconnaisance RQTH", value: "date_rqth_apprenant" },
  { label: "Email du responsable 1", value: "responsable_apprenant_mail1" },
  { label: "Email du responsable 2", value: "responsable_apprenant_mail2" },
  { label: "UAI du dernier organisme", value: "dernier_organisme_uai" },
  { label: "Dernière situation", value: "derniere_situation" },
  { label: "Type de CFA", value: "type_cfa" },
  { label: "Date de début de contrat", value: "contrat_date_debut" },
  { label: "Date de fin du contrat", value: "contrat_date_fin" },
  { label: "Date de rupture du contrat", value: "contrat_date_rupture" },
  { label: "Cause de la rupture du contrat", value: "cause_rupture_contrat" },
  { label: "SIRET de l’employeur ", value: "siret_employeur" },
  { label: "Date de début du contrat 2", value: "contrat_date_debut_2" },
  { label: "Date de fin du contrat 2", value: "contrat_date_fin_2" },
  { label: "Date de rupture du contrat 2", value: "contrat_date_rupture_2" },
  { label: "Cause de rupture du contrat 2", value: "cause_rupture_contrat_2" },
  { label: "SIRET de l’employeur 2", value: "siret_employeur_2" },
  { label: "Date de début du contrat 3", value: "contrat_date_debut_3" },
  { label: "Date de fin du contrat 3", value: "contrat_date_fin_3" },
  { label: "Date de rupture du contrat 3", value: "contrat_date_rupture_3" },
  { label: "Cause de rupture du contrat 3", value: "cause_rupture_contrat_3" },
  { label: "SIRET de l’employeur 3", value: "siret_employeur_3" },
  { label: "Date de début du contrat 4", value: "contrat_date_debut_4" },
  { label: "Date de fin du contrat 4", value: "contrat_date_fin_4" },
  { label: "Date de rupture du contrat 4", value: "contrat_date_rupture_4" },
  { label: "Cause de rupture du contrat 4", value: "cause_rupture_contrat_4" },
  { label: "SIRET de l’employeur 4", value: "siret_employeur_4" },
  { label: "Année scolaire", value: "annee_scolaire" },
  { label: "Année de la formation", value: "annee_formation" },
  { label: "Code RNCP", value: "formation_rncp" },
  { label: "Code CFD de la formation", value: "formation_cfd" },
  { label: "Date inscription dans la formation", value: "date_inscription_formation" },
  { label: "Date d'entrée dans la formation", value: "date_entree_formation" },
  { label: "Date de fin de la formation", value: "date_fin_formation" },
  { label: "Durée théorique de la formation ( années )", value: "duree_theorique_formation" },
  { label: "Durée théorique de la formation ( mois )", value: "duree_theorique_formation_mois" },
  { label: "Libellé court formation", value: "libelle_court_formation" },
  { label: "Diplôme de la formation obtenu", value: "obtention_diplome_formation" },
  { label: "Date d’obtention du diplôme", value: "date_obtention_diplome_formation" },
  { label: "Date d’exclusion de la formation", value: "date_exclusion_formation" },
  { label: "Cause d’exclusion de la formation", value: "cause_exclusion_formation" },
  { label: "Formation présentielle", value: "formation_presentielle" },
  { label: "Nom du référent handicap de la formation", value: "nom_referent_handicap_formation" },
  { label: "Prénom du référent handicap de la formation", value: "prenom_referent_handicap_formation" },
  { label: "Courriel du référent handicap de la formation", value: "email_referent_handicap_formation" },
  { label: "UAI de l'établissement responsable", value: "etablissement_responsable_uai" },
  { label: "SIRET de l'établissement responsable", value: "etablissement_responsable_siret" },
  { label: "UAI de l'établissement formateur", value: "etablissement_formateur_uai" },
  { label: "SIRET de l'établissement formateur", value: "etablissement_formateur_siret" },
  { label: "UAI de l'établissement du lieu de formation", value: "etablissement_lieu_de_formation_uai" },
  { label: "SIRET de l'établissement du lieu de formation", value: "etablissement_lieu_de_formation_siret" },
  { label: "Adresse de l'établissement du lieu de formation", value: "etablissement_lieu_de_formation_adresse" },
  {
    label: "Code postal de l'établissement du lieu de formation",
    value: "etablissement_lieu_de_formation_code_postal",
  },
];

const buildValidationError = (validation_errors: Array<{ message: string; path: string[] }>) => {
  return (validation_errors ?? []).reduce((acc, { message, path }) => {
    return {
      ...acc,
      ...path.reduce((acc2, pathValue) => {
        const key = `${message}:${pathValue}`;
        const specialMessage = ErrorMessages[key];
        const errorMessage = specialMessage || message;
        return {
          ...acc2,
          [pathValue]: acc2[pathValue] ? [...acc2[pathValue], errorMessage] : [errorMessage],
        };
      }, {}),
    };
  }, {});
};

const RequiredMark = ({ value }: { value: string }) =>
  !(dossierApprenantSchemaV3Base.shape[value] instanceof z.ZodOptional) ? (
    <span role="presentation" aria-hidden="true" className={styles.requiredMark}>
      *
    </span>
  ) : null;

export function EffectifQueueItemDetail({ effectifQueueItem }: { effectifQueueItem: any }) {
  const validationErrorFormated = buildValidationError(effectifQueueItem.validation_errors);
  const hasValidationErrors = Boolean(effectifQueueItem.validation_errors?.length);

  return (
    <div>
      {hasValidationErrors && effectifQueueItem.source !== SOURCE_APPRENANT.FICHIER && (
        <p className={styles.detailNotice}>
          <i className={fr.cx("fr-icon-info-fill", "fr-icon--sm")} aria-hidden="true" /> Veuillez corriger ces données
          directement dans votre ERP pour qu’elles soient correctement transmises.
        </p>
      )}

      {hasValidationErrors && effectifQueueItem.source === SOURCE_APPRENANT.FICHIER && (
        <p className={styles.detailNotice}>
          <i className={fr.cx("fr-icon-info-fill", "fr-icon--sm")} aria-hidden="true" /> Veuillez prendre connaissance
          des erreurs. Si des questions persistent, veuillez{" "}
          <a href={TD_MANUEL_ELEMENT_LINK} target="_blank" rel="noopener noreferrer" className="fr-link">
            nous contacter
          </a>
        </p>
      )}

      {effectifQueueItem.error ? (
        <p className={styles.detailError}>
          <i className={fr.cx("fr-icon-warning-fill", "fr-icon--sm")} aria-hidden="true" /> Une erreur s&apos;est
          produite lors de la transmission des effectifs. Aucune action de votre part n&apos;est nécessaire. Si le
          problème persiste dans vos prochains rapports, veuillez nous contacter.
        </p>
      ) : null}

      <table className={styles.detailTable}>
        <tbody>
          {attributes.map((rowItem, index) => (
            <tr key={index}>
              <td className={styles.detailLabel}>
                {rowItem.label}
                <RequiredMark value={rowItem.value} />
              </td>
              <td className={styles.detailField}>
                {rowItem.value} <RequiredMark value={rowItem.value} />
              </td>
              <td className={styles.detailValue}>
                {validationErrorFormated[rowItem.value] ? (
                  <i
                    className={`${fr.cx("fr-icon-warning-fill", "fr-icon--sm")} ${styles.detailWarningIcon}`}
                    aria-hidden="true"
                  />
                ) : null}
                {rowItem.value === "tel_apprenant"
                  ? formatPhoneNumber(effectifQueueItem[rowItem.value]) || "-"
                  : effectifQueueItem[rowItem.value]}
                {validationErrorFormated[rowItem.value] ? (
                  <ul className={styles.detailErrorList}>
                    {validationErrorFormated[rowItem.value].map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
