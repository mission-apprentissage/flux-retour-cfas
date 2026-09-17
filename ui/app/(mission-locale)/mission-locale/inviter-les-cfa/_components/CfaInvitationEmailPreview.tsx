import Image from "next/image";

import styles from "./CfaInvitationEmailPreview.module.scss";

interface Props {
  nbJeunesRuptureEtablissement: number;
  mlNom: string;
  conseillerPrenom: string;
  conseillerNom: string;
  note: string;
  nbMl: number;
  mlNoms: string[];
}

const ARGUMENTS = [
  "Visualisez vos effectifs en rupture toute l’année",
  "Identifiez et choisissez les situations qui nécessitent une aide d’une Mission Locale",
  "Transmettez un dossier en quelques clics à la bonne Mission Locale",
  "Gagnez du temps, collaborez sur un seul outil",
];

/** Formate les noms de ML façon maquette : « ML1, ML2... +N autres ». */
function formatMlNoms(noms: string[]): string {
  if (noms.length === 0) {
    return "";
  }
  const shown = noms.slice(0, 2);
  const rest = noms.length - shown.length;
  return rest > 0 ? `${shown.join(", ")}... +${rest} autre${rest > 1 ? "s" : ""}` : shown.join(", ");
}

function Cta({ light = false }: { light?: boolean }) {
  return (
    <span className={`${styles.cta} ${light ? styles.ctaLight : ""}`}>
      Commencez à collaborer
      <i className="fr-icon-arrow-right-line fr-icon--sm" aria-hidden="true" />
    </span>
  );
}

/**
 * Reconstruction de l'email côté front (maquette Figma 30194:15885) : ce n'est pas le rendu du
 * template Brevo, les deux dérivent de la même maquette et doivent être modifiés de pair.
 */
export function CfaInvitationEmailPreview({
  nbJeunesRuptureEtablissement,
  mlNom,
  conseillerPrenom,
  conseillerNom,
  note,
  nbMl,
  mlNoms,
}: Props) {
  const mlLabel = mlNom || "votre Mission Locale";
  const conseiller = [conseillerPrenom, conseillerNom].filter(Boolean).join(" ");
  const mlNomsLabel = formatMlNoms(mlNoms);

  return (
    <div className={styles.email} aria-label="Aperçu de l'email envoyé au CFA">
      <p className={styles.preheader}>
        La Mission Locale {mlLabel} vous invite à utiliser le Tableau de bord de l’apprentissage
      </p>
      <header className={styles.header}>
        <Image
          src="/images/mission-locale/email/logo-rf.png"
          alt="République Française"
          width={134}
          height={122}
          className={styles.logoRf}
        />
        <span className={styles.product}>
          Tableau de bord
          <br />
          de l’apprentissage
        </span>
      </header>
      <section className={styles.messageBlock}>
        {/* Chaque destinataire reçoit son propre nom : l'aperçu montre le gabarit. */}
        <p className={styles.hello}>
          Bonjour <span className={styles.accent}>Prénom Nom</span>,
        </p>
        <p className={styles.introLabel}>La Mission Locale</p>
        <p className={styles.introMLName}>{mlLabel}</p>
        <p className={styles.introInvite}>vous invite à utiliser le Tableau de bord de l’apprentissage.</p>
        {note.trim() && (
          <div className={styles.note}>
            <p className={styles.noteBody}>{note}</p>
            <p className={styles.signature}>
              <i className="fr-icon-account-circle-fill" aria-hidden="true" />
              <span>
                {conseiller || "L’équipe de la Mission Locale"}
                <br />
                <span className={styles.signatureSub}>de la Mission Locale {mlLabel}</span>
              </span>
            </p>
            <Cta />
          </div>
        )}
      </section>
      <section className={styles.statsBlock}>
        <div className={styles.stat}>
          <div className={styles.statNumber}>{nbJeunesRuptureEtablissement}</div>
          <div className={styles.statLabel}>jeunes en rupture de contrat dans votre établissement en ce moment*</div>
        </div>
        <Image
          src="/images/mission-locale/email/contrat-rompu.png"
          alt=""
          width={220}
          height={175}
          className={styles.statImg}
        />
      </section>
      <p className={styles.transition}>
        Certaines ruptures sont plus simples à gérer. D’autres nécessitent un accompagnement que vous ne pouvez pas
        toujours porter seul.
      </p>
      <section className={styles.block}>
        <p className={styles.blockTitle}>
          Le Tableau de bord de l’apprentissage vous permet de{" "}
          <span className={styles.accent}>
            collaborer avec les Missions Locales de votre territoire en quelques clics.
          </span>
        </p>
        <ul className={styles.argList}>
          {ARGUMENTS.map((arg) => (
            <li key={arg} className={styles.argItem}>
              <i className="fr-icon-success-fill fr-icon--sm" aria-hidden="true" />
              <span>{arg}</span>
            </li>
          ))}
        </ul>
        <Cta />
        <p className={styles.blockNote}>
          Vous avez déjà un compte sur le Tableau de bord de l’apprentissage. Connectez-vous pour accéder au service de
          collaboration dès maintenant.
        </p>
        <Image
          src="/images/mission-locale/email/compte.png"
          alt=""
          width={459}
          height={261}
          className={styles.compteImg}
        />
      </section>
      <hr className={styles.separator} />
      <section className={`${styles.blockGradient} ${styles.block}`}>
        <Image
          src="/images/mission-locale/email/qualiopi.png"
          alt=""
          width={145}
          height={110}
          className={styles.blockImg}
        />
        <p className={styles.blockTitle}>
          Un levier concret pour vos engagements <span className={styles.accent}>Qualiopi</span>
        </p>
        <p>
          La collaboration avec des acteurs externes comme le réseau des Missions Locales fait partie des attendus du
          référentiel <strong>Qualiopi</strong>.
        </p>
        <ul className={styles.argList}>
          <li className={styles.argItem}>
            <i className="fr-icon-success-fill fr-icon--sm" aria-hidden="true" />
            <span>Formalisez vos actions de collaboration</span>
          </li>
          <li className={styles.argItem}>
            <i className="fr-icon-success-fill fr-icon--sm" aria-hidden="true" />
            <span>Gardez une trace valorisable de cet engagement</span>
          </li>
        </ul>
        <Cta />
      </section>
      <section className={styles.block}>
        <Image src="/images/mission-locale/email/ml.png" alt="" width={100} height={80} className={styles.blockImg} />
        <p className={styles.blockTitle}>
          <span className={styles.accent}>{nbMl}</span> Missions Locales de votre territoire utilisent déjà le service
        </p>
        <p>
          En vous connectant sur la nouvelle version, vous pouvez dès maintenant déclencher des collaborations avec les
          Missions Locales de rattachement de vos jeunes.
        </p>
        {mlNomsLabel && <p className={styles.mlList}>{mlNomsLabel}</p>}
        <Cta />
      </section>
      <section className={styles.block}>
        <p className={styles.blockTitle}>Les Missions locales complètent votre accompagnement</p>
        <p className={styles.blockText}>
          Parfois les dispositifs internes ne suffisent pas sur des ruptures multifactorielles.
        </p>
        <p className={styles.blockText}> Les Missions locales sont un levier pour la lutte contre le décrochage.</p>
        <Image
          src="/images/mission-locale/email/dispositifs.png"
          alt=""
          width={354}
          height={177}
          className={styles.dispositifsImg}
        />
        <Cta />
      </section>
      <section>
        <Image
          src="/images/mission-locale/email/illustration-finale.png"
          alt=""
          width={515}
          height={205}
          className={styles.preFinalImg}
        />
      </section>
      <section className={styles.finalBlock}>
        <p className={styles.finalText}>
          Les Missions locales de votre territoire sont prêtes à accompagner vos apprenants en difficulté.{" "}
        </p>
        <p className={styles.finalTextHook}>Commencez à collaborer sur le Tableau de bord de l’apprentissage.</p>
        <Cta light />
      </section>
      <footer className={styles.footer}>
        <hr className={styles.separator} />
        <p className={styles.footerText}>
          Ce courriel est généré automatiquement, vous ne pouvez pas y répondre directement.
        </p>
        <p className={styles.footerText}>
          Vous avez une question ? Contactez-nous, notre équipe est disponible pour vous répondre à cette adresse :
        </p>
        <a href="mailto:tableaudebord@apprentissage.beta.gouv.fr" className={styles.footerMailTo}>
          tableaudebord@apprentissage.beta.gouv.fr
        </a>
        <hr className={styles.separator} />
        <p className={styles.footerText}>
          <strong>
            Ce service est développé par l’équipe du Tableau de bord de l’apprentissage conformément aux missions
            d’intérêt public du Ministère du Travail.
          </strong>
        </p>
        <hr className={styles.separator} />
        <p className={styles.footerText}>Vous ne souhaitez plus recevoir ce genre de courrier ?</p>
        <span className={styles.unsubscribeLink}>
          Demander à ne plus recevoir ces courriels de la part de l’outil professionnel Tableau de Bord de
          l’apprentissage.
        </span>
      </footer>
    </div>
  );
}
