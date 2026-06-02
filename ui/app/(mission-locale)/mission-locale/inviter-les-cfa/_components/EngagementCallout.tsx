import styles from "../InviterCfa.module.scss";

export function EngagementCallout() {
  return (
    <div className={styles.callout}>
      <p className={styles.calloutTitle}>Merci pour votre engagement&nbsp;! 🎉</p>
      <p className={styles.calloutText}>
        Les Missions Locales sont les meilleures ambassadrices de la collaboration entre les CFA et le service public à
        l’insertion. Toute l’équipe du service vous remercie pour votre engagement.
      </p>
    </div>
  );
}
