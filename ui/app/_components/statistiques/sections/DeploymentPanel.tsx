"use client";

import { CollaborationsAdminSection } from "./CollaborationsAdminSection";
import { CollaborationsCfaSection } from "./CollaborationsCfaSection";
import { DeploymentSection } from "./DeploymentSection";

interface DeploymentPanelProps {
  isAdmin?: boolean;
  showDetailColumn?: boolean;
}

export function DeploymentPanel({ isAdmin = false, showDetailColumn = false }: DeploymentPanelProps) {
  return (
    <div>
      <DeploymentSection showDetailColumn={showDetailColumn} isAdmin={isAdmin} />
      {isAdmin ? <CollaborationsAdminSection /> : <CollaborationsCfaSection />}
    </div>
  );
}
