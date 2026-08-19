import { unstable_cache } from "next/cache";
import { NotionAPI } from "notion-client";
import type { ExtendedRecordMap } from "notion-types";

import { sanitizeNotionRecordMap } from "@/common/utils/notionUtils";

const NOTION_REVALIDATE_SECONDS = 1800;

export function getNotionPageTitle(recordMap: ExtendedRecordMap | null): string | null {
  if (!recordMap) {
    return null;
  }

  const rootKey = Object.keys(recordMap.block)[0];
  const title = recordMap.block[rootKey]?.value?.properties?.title;

  if (!Array.isArray(title)) {
    return null;
  }

  const text = title
    .map((segment) => segment[0])
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

export const getNotionPage = unstable_cache(
  async (pageId: string): Promise<ExtendedRecordMap> => {
    const recordMap = await new NotionAPI().getPage(pageId);
    return sanitizeNotionRecordMap(recordMap);
  },
  ["notion-page"],
  { revalidate: NOTION_REVALIDATE_SECONDS }
);
