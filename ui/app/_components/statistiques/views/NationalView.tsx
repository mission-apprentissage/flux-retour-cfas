"use client";

import Image from "next/image";

import { AccompagnementConjointSection } from "../sections/AccompagnementConjointSection";
import { CouvertureRegionsSection } from "../sections/CouvertureRegionsSection";
import { IdentificationSuiviSection } from "../sections/IdentificationSuiviSection";
import { SuiviTraitementSection } from "../sections/SuiviTraitementSection";
import commonStyles from "../ui/common.module.css";

import styles from "./NationalView.module.css";

interface NationalViewProps {
  isAdmin?: boolean;
}

export function NationalView({ isAdmin = false }: NationalViewProps = {}) {
  return (
    <div>
      <div className={commonStyles.headerContainer}>
        <div className={commonStyles.logoContainer}>
          <Image src="/france.png" alt="France" width={60} height={60} className={styles.franceLogo} />
        </div>
        <h2 className={commonStyles.headerTitle}>National</h2>
      </div>

      <IdentificationSuiviSection />

      <CouvertureRegionsSection isAdmin={isAdmin} />

      <SuiviTraitementSection />

      <AccompagnementConjointSection />
    </div>
  );
}
