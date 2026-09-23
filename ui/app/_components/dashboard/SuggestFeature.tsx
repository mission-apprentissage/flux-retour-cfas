"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { AUTRE_AMELIORATION_ELEMENT_LINK } from "shared";

import styles from "./dashboard.module.scss";

export function SuggestFeature() {
  return (
    <section className={styles.suggestFeature}>
      <div>
        <p className={styles.suggestTitle}>Contribuer à l’évolution du Tableau de bord de l’apprentissage</p>
        <p className="fr-mb-2w">
          Le Tableau de bord se veut être l’instrument de votre pilotage - vous voulez voir une fonctionnalité sur votre
          tableau qui n’existe pas encore, écrivez-nous&nbsp;!
        </p>
        <Button
          iconId="fr-icon-mail-line"
          linkProps={{ href: AUTRE_AMELIORATION_ELEMENT_LINK, target: "_blank", rel: "noopener noreferrer" }}
        >
          Nous écrire
        </Button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/teamSolid0.svg" alt="" className={styles.suggestImage} />
    </section>
  );
}
