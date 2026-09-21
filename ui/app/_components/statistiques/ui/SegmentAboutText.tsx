import styles from "./SegmentAboutText.module.css";

interface SegmentAboutTextProps {
  variant: "rupture" | "collab";
}

export function SegmentAboutText({ variant }: SegmentAboutTextProps) {
  return (
    <div className={styles.about}>
      <p className={styles.title}>
        <i className="fr-icon-information-line fr-icon--sm" aria-hidden="true" />À propos de ces chiffres
      </p>
      {variant === "rupture" ? (
        <p className={styles.text}>
          Ces indicateurs portent sur les jeunes identifiés en rupture de contrat d&apos;apprentissage et transmis aux
          Missions Locales, y compris les collaborations engagées par les CFA pour un jeune déjà en rupture. Les
          collaborations de prévention, pour des jeunes encore en contrat, sont exclues. Ces chiffres reflètent
          l&apos;état actuel des dossiers, classés par date de transmission à la Mission Locale : les compteurs
          d&apos;une période passée décrivent la situation d&apos;aujourd&apos;hui des dossiers transmis pendant cette
          période, et non leur situation à cette date.
        </p>
      ) : (
        <p className={styles.text}>
          Ces chiffres couvrent uniquement les dossiers de jeunes envoyés manuellement sur l&apos;initiative de CFA
          connectés au Tableau de bord aux Missions Locales via la fonctionnalité de collaboration, qu&apos;il
          s&apos;agisse d&apos;une rupture, d&apos;un abandon ou d&apos;une prévention de rupture. Un jeune en rupture
          envoyé par son CFA est donc aussi compté dans le suivi des ruptures. Ces chiffres reflètent l&apos;état actuel
          des dossiers, classés par date d&apos;envoi de la collaboration : les compteurs d&apos;une période passée
          décrivent la situation d&apos;aujourd&apos;hui des dossiers envoyés pendant cette période. La table «
          Déploiement aux CFA » de l&apos;onglet Suivi déploiement compte, elle, les collaborations depuis le 1er
          janvier 2026 à la date de réponse du CFA : ses totaux peuvent différer de ceux affichés ici.
        </p>
      )}
    </div>
  );
}
