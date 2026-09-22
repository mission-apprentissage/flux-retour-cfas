"use client";

import { CollaborationSegmentPanel } from "../../sections/CollaborationSegmentPanel";

import styles from "./MLSuiviTraitementTab.module.css";

interface MLCollaborationsTabProps {
  mlId: string;
}

export function MLCollaborationsTab({ mlId }: MLCollaborationsTabProps) {
  return (
    <div className={styles.container}>
      <CollaborationSegmentPanel mlId={mlId} />
    </div>
  );
}
