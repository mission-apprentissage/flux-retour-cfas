"use client";

import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { IOrganisme, IEffecifMissionLocale, IEffectifOrganismeFormation } from "shared";

import { formatDate } from "@/app/_utils/date.utils";

import { MOTIF_LABELS } from "../shared/constants";
import styles from "../shared/ui/Feedback.module.css";
import { ProblematiquesJeune } from "../shared/ui/ProblematiquesJeune";

type EffectifWithContacts = (IEffecifMissionLocale["effectif"] | IEffectifOrganismeFormation["effectif"]) & {
  organisme?: {
    contacts_from_referentiel?: IOrganisme["contacts_from_referentiel"];
  };
  contacts_tdb?: Array<{
    email?: string;
    telephone?: string;
    nom?: string;
    prenom?: string;
    fonction?: string;
  }>;
};

interface CfaFeedbackProps {
  organismeData: {
    rupture?: boolean | null;
    acc_conjoint?: boolean | null;
    motif?: string[] | null;
    commentaires?: string | null;
    reponse_at?: Date | null;
  };
  transmittedAt?: Date | null;
  visibility: "ORGANISME_FORMATION" | "MISSION_LOCALE" | "ADMINISTRATEUR";
  effectif?: EffectifWithContacts;
}

export function CfaFeedback({ organismeData, transmittedAt, visibility, effectif }: CfaFeedbackProps) {
  const missionLocaleLayout = () => {
    return <ProblematiquesJeune organismeData={organismeData} effectif={effectif} showContacts={true} />;
  };

  const organismeFormationLayout = () => {
    return (
      <>
        {transmittedAt && organismeData.rupture && organismeData.acc_conjoint && (
          <h3 className="fr-mb-0" style={{ fontSize: "20px" }}>
            Dossier partagé à la Mission Locale le {formatDate(organismeData.reponse_at)}
          </h3>
        )}

        <div className={styles.feedbackContainer}>
          <p className="fr-mb-1v fr-mt-3v">
            <b>Ce jeune est-il toujours en rupture de contrat d&apos;apprentissage ?</b>
          </p>
          <Tag>{organismeData.rupture ? "Oui" : "Non"}</Tag>

          {organismeData.rupture && (
            <>
              <p className="fr-mb-1v fr-mt-3v">
                <b>Souhaitez-vous démarrer un accompagnement conjoint avec la Mission Locale ?</b>
              </p>
              <Tag>{organismeData.acc_conjoint ? "Oui" : "Non"}</Tag>

              {organismeData.acc_conjoint && organismeData.motif && organismeData.motif.length > 0 && (
                <>
                  <p className="fr-mb-1v fr-mt-3v">
                    <b>Pour quelle(s) problématique(s) ?</b>
                  </p>
                  <div className={styles.feedbackSituationContainer}>
                    {organismeData.motif.map((motif, index) => (
                      <Tag key={index}>{MOTIF_LABELS[motif] || motif}</Tag>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {organismeData.commentaires && (
            <>
              <p className="fr-mb-1v fr-mt-3v">
                <b>Commentaires</b>
              </p>
              <p className={styles.feedbackText}>{organismeData.commentaires}</p>
            </>
          )}
        </div>
      </>
    );
  };

  switch (visibility) {
    case "ADMINISTRATEUR":
    case "ORGANISME_FORMATION":
      return organismeFormationLayout();
    case "MISSION_LOCALE":
      return missionLocaleLayout();
    default:
      return null;
  }
}
