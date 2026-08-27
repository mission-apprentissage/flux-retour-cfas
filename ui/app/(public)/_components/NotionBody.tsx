"use client";

import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import Link from "next/link";
import type { ExtendedRecordMap } from "notion-types";
import { NotionRenderer } from "react-notion-x";

import "react-notion-x/src/styles.css";

export function NotionBody({ recordMap }: { recordMap: ExtendedRecordMap }) {
  const { isDark } = useIsDark();

  return (
    <NotionRenderer
      recordMap={recordMap}
      disableHeader
      fullPage
      darkMode={isDark}
      previewImages={false}
      mapPageUrl={(pageId) => (pageId ? `/docs/${pageId}` : "#")}
      components={{ nextLink: Link }}
    />
  );
}
