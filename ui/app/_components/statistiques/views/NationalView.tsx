"use client";

import Image from "next/image";

import { AccompagnementConjointSection } from "../sections/AccompagnementConjointSection";
import { CouvertureRegionsSection } from "../sections/CouvertureRegionsSection";
import { DossiersTraitesSection } from "../sections/DossiersTraitesSection";
import { IdentificationSuiviSection } from "../sections/IdentificationSuiviSection";
import { RupturantsSection } from "../sections/RupturantsSection";
import { SuiviTraitementSection } from "../sections/SuiviTraitementSection";
import commonStyles from "../ui/common.module.css";

import styles from "./NationalView.module.css";

export function NationalView() {
  return (
    <div>
      <div className={commonStyles.headerContainer}>
        <div className={commonStyles.logoContainer}>
          <Image src="/france.png" alt="France" width={60} height={60} className={styles.franceLogo} />
        </div>
        <h2 className={commonStyles.headerTitle}>National</h2>
      </div>

      <IdentificationSuiviSection />

      <hr />

      <div className={styles.chartsRow}>
        <RupturantsSection />
        <DossiersTraitesSection />
      </div>

      <CouvertureRegionsSection />

      <SuiviTraitementSection />

      <AccompagnementConjointSection />
    </div>
  );
}
