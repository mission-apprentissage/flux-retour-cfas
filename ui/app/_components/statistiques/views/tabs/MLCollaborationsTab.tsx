"use client";

import { AccompagnementConjointSection } from "../../sections/AccompagnementConjointSection";

import styles from "./MLSuiviTraitementTab.module.css";

interface MLCollaborationsTabProps {
  mlId: string;
}

export function MLCollaborationsTab({ mlId }: MLCollaborationsTabProps) {
  return (
    <div className={styles.container}>
      <AccompagnementConjointSection mlId={mlId} compact />
    </div>
  );
}
