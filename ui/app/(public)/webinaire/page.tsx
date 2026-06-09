import { fr } from "@codegouvfr/react-dsfr";

import { PAGES } from "@/app/_utils/routes.utils";

import styles from "./page.module.scss";

export const metadata = PAGES.static.webinaire.getMetadata();

export default function WebinairePage() {
  return (
    <main id="webinaire-content" className={fr.cx("fr-container", "fr-py-6w")}>
      <div className={styles.iframeWrapper}>
        <iframe
          title="Formulaire d'inscription au webinaire"
          src="https://d1388be6.sibforms.com/v2/serve/MUIFAH5WyAvVkYoO4yqiWQwxU5sReIK-2tNpPQgfg9VapYv8XD6rYpFyKweKDrmTr4FmSIPMtSTU6PecC34-6LLwbNFlOW4Tctgekb2i23BW8WINLpHJDepmS9yj8fJkHiTW0cgR8cYwrwpRRUdcOjbCnvfAajbuY5Zj2Rh5L5xLu1A74rCtsWgI1guLVyjIC2mn3fYBV8eRuGpu"
          allowFullScreen
          className={styles.iframe}
        />
      </div>
    </main>
  );
}
