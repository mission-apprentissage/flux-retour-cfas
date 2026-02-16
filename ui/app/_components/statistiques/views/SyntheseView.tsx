"use client";

import { DeploymentSection } from "../sections/DeploymentSection";
import { IdentificationSuiviSection } from "../sections/IdentificationSuiviSection";
import { WhatsAppSection } from "../sections/WhatsAppSection";
import commonStyles from "../ui/common.module.css";

interface SyntheseViewProps {
  showDetailColumn?: boolean;
  isAdmin?: boolean;
}

export function SyntheseView({ showDetailColumn = true, isAdmin = false }: SyntheseViewProps = {}) {
  return (
    <div>
      <div className={commonStyles.headerContainer}>
        <div className={commonStyles.logoContainer}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 30H17.5V52.5H7.5V30ZM42.5 20H52.5V52.5H42.5V20ZM25 5H35V52.5H25V5Z" fill="#6A6AF4" />
          </svg>
        </div>
        <h2 className={commonStyles.headerTitle}>Synthèse</h2>
      </div>

      <IdentificationSuiviSection showCharts={false} />

      <DeploymentSection showDetailColumn={showDetailColumn} isAdmin={isAdmin} />

      {isAdmin && <WhatsAppSection />}
    </div>
  );
}
