"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";

import { AccompagnementConjointSection } from "../sections/AccompagnementConjointSection";
import { DeploymentPanel } from "../sections/DeploymentPanel";
import { RupturesSegmentPanel } from "../sections/RupturesSegmentPanel";
import { WhatsAppPanel } from "../sections/WhatsAppPanel";
import commonStyles from "../ui/common.module.css";
import { StatsTabs, type StatsTab } from "../ui/StatsTabs";

interface VueEnsembleViewProps {
  isAdmin?: boolean;
  isPublic?: boolean;
}

export function VueEnsembleView({ isAdmin = false, isPublic = false }: VueEnsembleViewProps) {
  const tabs: StatsTab[] = [
    {
      id: "ruptures",
      label: "Suivi ruptures",
      content: <RupturesSegmentPanel national isPublic={isPublic} />,
    },
    {
      id: "deploiement",
      label: "Suivi déploiement",
      content: <DeploymentPanel isAdmin={isAdmin} showDetailColumn={isAdmin} />,
    },
    {
      id: "collaborations",
      label: "Suivi collaborations",
      content: isPublic ? (
        <Alert
          severity="info"
          small
          description="Le suivi des collaborations entre CFA et Missions Locales arrive prochainement."
        />
      ) : (
        <AccompagnementConjointSection national />
      ),
    },
  ];

  if (isAdmin) {
    tabs.push({ id: "whatsapp", label: "Messages WhatsApp", content: <WhatsAppPanel /> });
  }

  return (
    <div>
      <div className={commonStyles.headerContainer}>
        <div className={commonStyles.logoContainer}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 30H17.5V52.5H7.5V30ZM42.5 20H52.5V52.5H42.5V20ZM25 5H35V52.5H25V5Z" fill="#6A6AF4" />
          </svg>
        </div>
        <h2 className={commonStyles.headerTitle}>Vue d&apos;ensemble</h2>
      </div>

      <StatsTabs tabs={tabs} />
    </div>
  );
}
