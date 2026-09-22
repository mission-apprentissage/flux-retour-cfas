"use client";

import { CollaborationsAdminSection } from "./CollaborationsAdminSection";
import { CollaborationsCfaSection } from "./CollaborationsCfaSection";
import { DeploymentSection } from "./DeploymentSection";

interface DeploymentPanelProps {
  isAdmin?: boolean;
}

export function DeploymentPanel({ isAdmin = false }: DeploymentPanelProps) {
  return (
    <div>
      <DeploymentSection isAdmin={isAdmin} />
      {isAdmin ? <CollaborationsAdminSection /> : <CollaborationsCfaSection />}
    </div>
  );
}
