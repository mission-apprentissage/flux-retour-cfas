import { fr } from "@codegouvfr/react-dsfr";

import { PAGES } from "@/app/_utils/routes.utils";

import styles from "./page.module.scss";

export const metadata = PAGES.static.accessibilite.getMetadata();

const CONTACT_EMAIL = "tableau-de-bord@apprentissage.beta.gouv.fr";
const LINKEDIN_URL = "https://www.linkedin.com/company/mission-apprentissage/";

export default function AccessibilitePage() {
  return (
    <main className={fr.cx("fr-container", "fr-py-6w")}>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-9")}>
          <h1 className={styles.title}>Déclaration d’accessibilité</h1>

          <p>Établie le 22 novembre 2023.</p>
          <p>
            Ministère du Travail, du Plein emploi et de l’Insertion s’engage à rendre son service accessible,
            conformément à l’article 47 de la loi n°2005-102 du 11 février 2005.
          </p>
          <p>
            Cette déclaration d’accessibilité s’applique à <strong>Tableau de bord de l’apprentissage</strong> (
            https://cfas.apprentissage.beta.gouv.fr).
          </p>

          <h2 className={styles.sectionTitle}>État de conformité</h2>
          <p>
            <strong>Tableau de bord de l’apprentissage</strong> est <strong>non conforme</strong> avec le{" "}
            <abbr title="Référentiel général d’amélioration de l’accessibilité">RGAA</abbr>. Le site n’a encore pas été
            audité.
          </p>

          <h2 className={styles.sectionTitle}>Contenus non accessibles</h2>

          <h2 className={styles.sectionTitle}>Amélioration et contact</h2>
          <p>
            Si vous n’arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter le responsable de
            Tableau de bord de l’apprentissage pour être orienté vers une alternative accessible ou obtenir le contenu
            sous une autre forme.
          </p>
          <ul>
            <li>
              E-mail&nbsp;:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className={`${fr.cx("fr-link")} ${styles.contactLink}`}>
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              LinkedIn&nbsp;:{" "}
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Mission apprentissage sur LinkedIn - nouvelle fenêtre"
                className={fr.cx("fr-link", "fr-link--icon-right", "fr-icon-external-link-line")}
              >
                {LINKEDIN_URL}
              </a>
            </li>
          </ul>
          <p>Nous essayons de répondre dans les 2 jours ouvrés.</p>

          <h2 className={styles.sectionTitle}>Voie de recours</h2>
          <p>
            Cette procédure est à utiliser dans le cas suivant&nbsp;: vous avez signalé au responsable du site internet
            un défaut d’accessibilité qui vous empêche d’accéder à un contenu ou à un des services du portail et vous
            n’avez pas obtenu de réponse satisfaisante.
          </p>
          <p>Vous pouvez&nbsp;:</p>
          <ul>
            <li>
              Écrire un message au{" "}
              <a
                href="https://formulaire.defenseurdesdroits.fr/"
                target="_blank"
                rel="noopener noreferrer"
                title="Défenseur des droits - nouvelle fenêtre"
                className={fr.cx("fr-link", "fr-link--icon-right", "fr-icon-external-link-line")}
              >
                Défenseur des droits
              </a>
            </li>
            <li>
              Contacter{" "}
              <a
                href="https://www.defenseurdesdroits.fr/saisir/delegues"
                target="_blank"
                rel="noopener noreferrer"
                title="Délégués du Défenseur des droits - nouvelle fenêtre"
                className={fr.cx("fr-link", "fr-link--icon-right", "fr-icon-external-link-line")}
              >
                le délégué du Défenseur des droits dans votre région
              </a>
            </li>
            <li>
              Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre)&nbsp;:
              <br />
              Défenseur des droits
              <br />
              Libre réponse 71120 75342 Paris CEDEX 07
            </li>
          </ul>
          <p>
            Cette déclaration d’accessibilité a été créé le 22 novembre 2023 grâce au{" "}
            <a
              href="https://betagouv.github.io/a11y-generateur-declaration/#create"
              target="_blank"
              rel="noopener noreferrer"
              title="Générateur de Déclaration d’Accessibilité de BetaGouv - nouvelle fenêtre"
              className={fr.cx("fr-link", "fr-link--icon-right", "fr-icon-external-link-line")}
            >
              Générateur de Déclaration d’Accessibilité de BetaGouv
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
