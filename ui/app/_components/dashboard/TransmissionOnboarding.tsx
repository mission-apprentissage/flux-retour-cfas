"use client";

import { CRISP_FAQ } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";

import styles from "./dashboard.module.scss";

export function TransmissionOnboarding() {
  return (
    <>
      <hr className={styles.separator} />
      <h2 className={styles.sectionTitle}>En transmettant les données de votre organisme au tableau de bord...</h2>

      <div className={styles.onboardingStep}>
        <p className={styles.onboardingNumber}>1</p>
        <div>
          <p>
            Vous permettez aux acteurs publics de piloter les politiques publiques en ayant une meilleure vision de la
            situation de l’apprentissage au national et sur les territoires.
          </p>
          <DsfrLink href={CRISP_FAQ} external>
            Consultez la FAQ du tableau de bord
          </DsfrLink>
        </div>
      </div>

      <div className={styles.onboardingStep}>
        <p className={styles.onboardingNumber}>2</p>
        <div>
          <p>
            Vous contribuez à l’identification des jeunes en difficulté afin qu’ils soient accompagnés au meilleur
            moment.
          </p>
          <DsfrLink
            href="https://mission-apprentissage.notion.site/Guide-des-donn-es-57bc2515bac34cee9359e517a504df20"
            external
          >
            Consultez la liste des données collectées
          </DsfrLink>
        </div>
      </div>

      <div className={styles.onboardingStep}>
        <p className={styles.onboardingNumber}>3</p>
        <div>
          <p>
            Vous pouvez produire facilement des statistiques afin de répondre à des enquêtes (comme SIFA). Vos données
            peuvent être consultées <strong>exclusivement</strong> par votre organisme et les administrations publiques
            dans le cadre de la{" "}
            <DsfrLink href="/politique-de-confidentialite" arrow="none">
              politique de l’apprentissage
            </DsfrLink>
            .
          </p>
        </div>
      </div>
    </>
  );
}
