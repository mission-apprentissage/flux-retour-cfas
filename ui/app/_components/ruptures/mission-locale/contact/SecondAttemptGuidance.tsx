"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import styles from "./SecondAttemptGuidance.module.css";

interface SecondAttemptGuidanceProps {
  onReset: () => void;
  onTraiter: () => void;
}

export function SecondAttemptGuidance({ onReset, onTraiter }: SecondAttemptGuidanceProps) {
  return (
    <div className={styles.container}>
      <div className={styles.messageBox}>
        <h4 className={styles.title}>
          Vous avez essayé de contacter ce jeune à 2 reprises, sans réponse pour le moment...
        </h4>

        <p className={styles.thankYou}>
          L&apos;équipe Tableau de bord vous remercie pour votre suivi engagé sur ce dossier.
        </p>

        <p className={styles.advice}>
          Si vous estimez que ce jeune ne pourra pas être contacté ou ne souhaite pas être accompagné, Nous vous
          conseillons de marquer son dossier comme{" "}
          <Badge severity="success" as="span">
            traité
          </Badge>
          .
        </p>

        <p className={styles.alternative}>
          Sinon, revenez plus tard, son dossier restera dans la liste{" "}
          <span className="fr-badge fr-badge--purple-glycine">
            <i className="fr-icon-phone-fill fr-icon--sm" />
            <span style={{ marginLeft: "5px" }}>À RECONTACTER</span>
          </span>
          .
        </p>

        <div className={styles.illustration}>
          <Image
            src="/images/ml_recontacter_traiter.png"
            alt="Illustration recontacter ou traiter"
            width={512}
            height={165}
          />
        </div>

        <div className={styles.actionSection}>
          <h5 className={styles.actionTitle}>Que souhaitez-vous faire ?</h5>

          <div className={styles.buttonContainer}>
            <Button priority="secondary" onClick={onReset}>
              Revenir plus tard
            </Button>
            <Button onClick={onTraiter}>
              Confirmer, passer en{" "}
              <Badge severity="success" as="span" style={{ marginLeft: "0.5rem" }}>
                traité
              </Badge>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
