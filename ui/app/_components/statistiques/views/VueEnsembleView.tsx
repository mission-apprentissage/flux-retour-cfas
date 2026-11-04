"use client";

import { CollaborationSegmentPanel } from "../sections/CollaborationSegmentPanel";
import { CollaborationsOverviewSection } from "../sections/CollaborationsOverviewSection";
import { DeploymentOverviewSection } from "../sections/DeploymentOverviewSection";
import { DeploymentPanel } from "../sections/DeploymentPanel";
import { RupturesOverviewSection } from "../sections/RupturesOverviewSection";
import { RupturesSegmentPanel } from "../sections/RupturesSegmentPanel";
import { WhatsAppPanel } from "../sections/WhatsAppPanel";
import { CfaInvitesSansCollabTable } from "../tables/CfaInvitesSansCollabTable";
import commonStyles from "../ui/common.module.css";
import { StatsPageHeader } from "../ui/StatsPageHeader";
import { StatsTabs, type StatsTab } from "../ui/StatsTabs";

interface VueEnsembleViewProps {
  isAdmin?: boolean;
  isPublic?: boolean;
}

const ADMIN_TABS: StatsTab[] = [
  {
    id: "deploiement",
    label: "Déploiement aux CFA",
    iconId: "fr-icon-line-chart-line",
    content: <DeploymentPanel isAdmin withMissionLocales={false} />,
  },
  {
    id: "cfa-invites",
    label: "CFA invités sans collaboration",
    iconId: "fr-icon-team-line",
    content: <CfaInvitesSansCollabTable />,
  },
  {
    id: "whatsapp",
    label: "Messages WhatsApp",
    iconId: "fr-icon-chat-3-line",
    content: <WhatsAppPanel />,
  },
];

const PUBLIC_TABS: StatsTab[] = [
  {
    id: "ruptures",
    label: "Suivi ruptures",
    iconId: "fr-icon-file-text-line",
    content: <RupturesSegmentPanel national isPublic />,
  },
  {
    id: "deploiement",
    label: "Suivi déploiement",
    iconId: "fr-icon-line-chart-line",
    content: <DeploymentPanel />,
  },
  {
    id: "collaborations",
    label: "Suivi collaborations",
    iconId: "fr-icon-team-line",
    content: <CollaborationSegmentPanel national isPublic />,
  },
];

export function VueEnsembleView({ isAdmin = false, isPublic = false }: VueEnsembleViewProps) {
  if (!isPublic) {
    return (
      <div>
        <StatsPageHeader
          title="Vue d'ensemble"
          description="Retrouvez ici les chiffres des indicateurs principaux du déploiement et de l'activité des Missions Locales et des CFA sur le Tableau de bord de l'apprentissage sur le territoire de votre choix."
        />
        <RupturesOverviewSection />
        <DeploymentOverviewSection />
        <CollaborationsOverviewSection />
        {isAdmin && <StatsTabs tabs={ADMIN_TABS} />}
      </div>
    );
  }

  return (
    <div>
      <div className={commonStyles.headerContainer}>
        <div className={commonStyles.logoContainer}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 30H17.5V52.5H7.5V30ZM42.5 20H52.5V52.5H42.5V20ZM25 5H35V52.5H25V5Z" fill="#6A6AF4" />
          </svg>
        </div>
        <h1 className={commonStyles.headerTitle}>Vue d&apos;ensemble</h1>
      </div>

      <StatsTabs tabs={PUBLIC_TABS} />
    </div>
  );
}
