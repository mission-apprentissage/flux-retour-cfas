"use client";

import { ReactNode, useState } from "react";

import sharedStyles from "./CollaborationDetail.shared.module.css";

interface CollapsibleDetailProps {
  subtext?: string;
  subtextClassName?: string;
  children: ReactNode;
}

export function CollapsibleDetail({ subtext, subtextClassName, children }: CollapsibleDetailProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <p className={subtextClassName}>
        {subtext && <span>{subtext}</span>}
        {subtext && " · "}
        <button
          type="button"
          className={sharedStyles.detailToggle}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "masquer le détail" : "voir le détail"}
        </button>
      </p>
      {isOpen && children}
    </>
  );
}
