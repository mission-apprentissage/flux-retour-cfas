import { fr } from "@codegouvfr/react-dsfr";
import { CGU_DERNIERE_MISE_A_JOUR, CGU_VERSION } from "shared/constants";

import { PAGES } from "@/app/_utils/routes.utils";

import { CguArticles } from "./CguArticles";
import { CguSideMenu } from "./CguSideMenu";
import styles from "./page.module.scss";

export const metadata = PAGES.static.cgu.getMetadata();

export default function CguPage() {
  return (
    <main className={fr.cx("fr-container", "fr-py-6w")}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
          <CguSideMenu className={styles.sideMenu} />
        </div>

        <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
          <h1 className={styles.title}>Conditions générales d’utilisation du Tableau de bord de l’apprentissage</h1>
          <p className={styles.version}>
            Dernière mise à jour le : {CGU_DERNIERE_MISE_A_JOUR} - {CGU_VERSION}
          </p>
          <p>
            Les présentes conditions générales d’utilisation (dites « CGU ») définissent les conditions d’accès et
            d’utilisation des Services par l’Utilisateur.
          </p>

          <CguArticles />
        </div>
      </div>
    </main>
  );
}
