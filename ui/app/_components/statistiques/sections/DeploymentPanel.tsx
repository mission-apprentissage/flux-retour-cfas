"use client";

import { CollaborationsAdminSection } from "./CollaborationsAdminSection";
import { CollaborationsCfaSection } from "./CollaborationsCfaSection";
import { DeploymentSection } from "./DeploymentSection";

interface DeploymentPanelProps {
  isAdmin?: boolean;
  withMissionLocales?: boolean;
}

export function DeploymentPanel({ isAdmin = false, withMissionLocales = true }: DeploymentPanelProps) {
  return (
    <div>
      {withMissionLocales && <DeploymentSection isAdmin={isAdmin} />}
      {isAdmin ? <CollaborationsAdminSection /> : <CollaborationsCfaSection />}
    </div>
  );
}
