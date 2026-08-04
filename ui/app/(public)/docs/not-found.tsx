import { fr } from "@codegouvfr/react-dsfr";

import { PAGES } from "@/app/_utils/routes.utils";

import styles from "./not-found.module.scss";

export default function DocsNotFound() {
  return (
    <main id="docs-not-found-content" className={fr.cx("fr-container", "fr-py-12w")}>
      <div className={styles.card}>
        <h1 className={fr.cx("fr-h3")}>Page non trouvée</h1>
        <p className={fr.cx("fr-text--lg")}>La page que vous recherchez n’existe pas ou a été déplacée.</p>
        <a
          href={PAGES.static.home.getPath()}
          className={fr.cx("fr-link", "fr-icon-arrow-left-line", "fr-link--icon-left")}
        >
          Retourner à la page d’accueil
        </a>
      </div>
    </main>
  );
}
