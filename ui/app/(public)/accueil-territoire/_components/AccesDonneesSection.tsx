import Button from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import styles from "./acces-donnees-section.module.scss";

export function AccesDonneesSection() {
  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <h2 className={styles.title}>Accédez aux données de votre territoire dès maintenant.</h2>
          <p className={styles.subtitle}>
            Demandez à obtenir votre accès de référent territorial et notre équipe validera votre compte sous 24h.
          </p>
          <div className={styles.cta}>
            <Button
              iconId="fr-icon-arrow-right-line"
              iconPosition="right"
              linkProps={{ href: "/auth/inscription/operateur_public" }}
            >
              Demander mon accès
            </Button>
          </div>
        </div>
        <div className={styles.previewWrapper}>
          <Image
            src="/images/home/territoire/dashboard-preview.png"
            alt="Aperçu du tableau de bord territorial"
            width={760}
            height={514}
            sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1024px) calc(100vw - 80px), 760px"
            className={styles.preview}
          />
        </div>
      </div>
    </section>
  );
}
