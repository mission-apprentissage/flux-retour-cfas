"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useState } from "react";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import styles from "./televersement.module.scss";

export function InfoBetaPanel() {
  const [show, setShow] = useState(false);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const handleToggle = () => {
    setShow(!show);
    trackPlausibleEvent("televersement_clic_excel_conseils");
  };

  return (
    <Alert
      severity="info"
      title="Quelques conseils sur le remplissage du fichier Excel :"
      description={
        <>
          <button
            type="button"
            className={`fr-link ${styles.collapseToggle}`}
            onClick={handleToggle}
            aria-expanded={show}
          >
            <i
              className={`${show ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"} fr-icon--sm`}
              aria-hidden="true"
            />{" "}
            Voir les détails
          </button>
          {show && (
            <ul>
              <li>Vérifiez que tous vos apprentis soient bien présents dans le fichier.</li>
              <li>
                Pour téléverser vos effectifs, vous avez 2 options : remplir directement le modèle Excel (téléchargeable
                ci-dessus) avec vos effectifs, ou créer un fichier personnalisé, en{" "}
                <strong>conservant les mêmes en-têtes de colonne</strong> que le fichier-modèle.
              </li>
              <li>
                Nous nous basons sur les dates de contrat, de rupture, de formation et d’exclusion pour déterminer le
                statut d’un effectif. Veuillez <strong>remplir les colonnes associées à ces évènements</strong>.
              </li>
              <li>
                Actuellement, il n&apos;est pas possible de téléverser deux fichiers en même temps, mais nous y
                travaillons.
              </li>
              <li>
                Si votre établissement ne comptabilise <strong>aucun effectif</strong> en apprentissage à la date du
                jour, il n’est pas nécessaire d’ajouter un fichier.
              </li>
              <li>
                Si vous n&apos;avez pas accès à Excel ou si vous ne l&apos;utilisez pas, vous pouvez utiliser un{" "}
                <a
                  href="https://www.zamzar.com/fr/convert/numbers-to-xls/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fr-link"
                >
                  convertisseur en ligne
                </a>{" "}
                . Pour les utilisateurs de Numbers (ou autre logiciel), vous avez la possibilité d’exporter le fichier
                au format .xls (Fichier &gt; Exporter vers &gt; Excel)
              </li>
              <li>
                Le téléversement régulier de vos effectifs au tableau de bord ne vous dispense pas de répondre à
                l&apos;enquête annuelle SIFA sur la{" "}
                <a href="https://sifa.depp.education.fr" target="_blank" rel="noopener noreferrer" className="fr-link">
                  plateforme officielle SIFA
                </a>
                .
              </li>
            </ul>
          )}
        </>
      }
      className="fr-mb-3w"
    />
  );
}
