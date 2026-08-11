"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PageHeader } from "@/app/_components/page-header/PageHeader";
import { PAGES } from "@/app/_utils/routes.utils";

import styles from "./televersement.module.scss";

export function TeleversementValide({ organismeId, isMine }: { organismeId: string; isMine: boolean }) {
  return (
    <div>
      <PageHeader title="Import des effectifs" />
      <div className={styles.successPanel}>
        <div className={styles.successTitleRow}>
          <i className="fr-icon-checkbox-circle-fill" aria-hidden="true" />
          <span className={styles.successTitle}>
            Votre fichier a été accepté : consultez le rapport de transmission.
          </span>
        </div>
        <div className={styles.successWarning}>
          <i className="fr-icon-warning-fill fr-icon--sm" aria-hidden="true" />
          <div>
            <p className="fr-mb-0">
              <b>Attention : </b>le contrôle a été réalisé sur le format des données de votre fichier, mais pas sur
              l’exactitude du contenu.
            </p>
            <p>
              Veuillez consulter le{" "}
              <DsfrLink href={PAGES.static.transmissions.getPath()} arrow="none">
                rapport de transmission
              </DsfrLink>{" "}
              pour identifier et réparer les erreurs potentielles.
            </p>
          </div>
        </div>
        <p>
          Vos effectifs sont en attente d&apos;affichage sur votre espace et seront disponibles dans quelques minutes,
          le temps que le traitement soit effectué.
        </p>
        <p className="fr-mb-0">
          <b>Information : </b>Transmettez vos effectifs au tableau de bord une fois par mois, de préférence entre le 1
          et le 5 du mois. Cela permet de garantir la fraîcheur des données. Pour chaque nouveau téléversement, vos
          données seront mises à jour ou complétées.
        </p>
      </div>
      <div className={styles.successActions}>
        <Button priority="secondary" linkProps={{ href: PAGES.static.transmissions.getPath() }}>
          Voir le rapport de transmission
        </Button>
        <Button
          linkProps={{
            href: isMine
              ? PAGES.static.effectifs.getPath()
              : PAGES.dynamic.organismeEffectifs({ organismeId }).getPath(),
          }}
        >
          Voir mes effectifs
        </Button>
      </div>
      <div className={styles.successAside}>
        <div>
          <p className={styles.successAsideTitle}>Pourquoi consulter vos effectifs ?</p>
          <p className="fr-mb-1w">Sur la page “Mes effectifs”, vous avez la possibilité de : </p>
          <ul>
            <li>voir si tous vos effectifs en apprentissage ont bien été pris en compte et s’affichent</li>
            <li>comprendre d’éventuelles erreurs et de les corriger</li>
            <li>téléverser un nouveau fichier mis à jour</li>
          </ul>
        </div>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/televersement-manuel-success.svg" alt="" />
        </div>
      </div>
    </div>
  );
}
