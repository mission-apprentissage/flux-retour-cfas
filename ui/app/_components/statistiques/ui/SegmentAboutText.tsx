import styles from "./SegmentAboutText.module.css";

interface SegmentAboutTextProps {
  variant: "rupture" | "collab";
}

export function SegmentAboutText({ variant }: SegmentAboutTextProps) {
  return (
    <div className={styles.about}>
      <p className={styles.title}>À propos de ces chiffres :</p>
      {variant === "rupture" ? (
        <p className={styles.text}>
          Ces chiffres couvrent uniquement les dossiers de jeunes en situation de rupture. À partir de septembre 2026,
          le Tableau de bord de l&apos;apprentissage permet aux CFA de solliciter des collaborations pour des jeunes sur
          de la prévention de rupture. Ces dossiers ne sont pas inclus dans ces données chiffrées, seuls sont
          représentés ici les dossiers de rupture identifiés (sources : DECA, les ERP des CFA connectés et le déclaratif
          des CFA lors de collaborations sollicitées pour ce motif). Ces chiffres reflètent l&apos;état actuel des
          dossiers, classés par date de transmission à la Mission Locale : les compteurs d&apos;une période passée
          décrivent la situation d&apos;aujourd&apos;hui des dossiers transmis pendant cette période, et non leur
          situation à cette date.
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
