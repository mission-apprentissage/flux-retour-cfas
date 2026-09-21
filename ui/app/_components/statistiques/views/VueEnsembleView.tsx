"use client";

import { CollaborationSegmentPanel } from "../sections/CollaborationSegmentPanel";
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
      iconId: "fr-icon-file-text-line",
      content: <RupturesSegmentPanel national isPublic={isPublic} />,
    },
    {
      id: "deploiement",
      label: "Suivi déploiement",
      iconId: "fr-icon-line-chart-line",
      content: <DeploymentPanel isAdmin={isAdmin} />,
    },
    {
      id: "collaborations",
      label: "Suivi collaborations",
      iconId: "fr-icon-team-line",
      content: <CollaborationSegmentPanel national isPublic={isPublic} cfaInvites={isAdmin} />,
    },
  ];

  if (isAdmin) {
    tabs.push({
      id: "whatsapp",
      label: "Messages WhatsApp",
      iconId: "fr-icon-chat-3-line",
      content: <WhatsAppPanel />,
    });
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
