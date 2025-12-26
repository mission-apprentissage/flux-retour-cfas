"use client";

import Image from "next/image";

import { AccompagnementConjointSection } from "../sections/AccompagnementConjointSection";
import { CouvertureRegionsSection } from "../sections/CouvertureRegionsSection";
import { IdentificationSuiviSection } from "../sections/IdentificationSuiviSection";
import { SuiviTraitementSection } from "../sections/SuiviTraitementSection";
import { ViewHeader } from "../ui/ViewHeader";

import styles from "./NationalView.module.css";

interface NationalViewProps {
  isAdmin?: boolean;
}

export function NationalView({ isAdmin = false }: NationalViewProps = {}) {
  return (
    <div>
      <ViewHeader
        title="National"
        icon={<Image src="/france.png" alt="France" width={60} height={60} className={styles.franceLogo} />}
      />

      <IdentificationSuiviSection national />

      <CouvertureRegionsSection isAdmin={isAdmin} national />

      <SuiviTraitementSection isAdmin={isAdmin} national />

      <AccompagnementConjointSection national />
    </div>
  );
}
