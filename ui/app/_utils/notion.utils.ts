import { unstable_cache } from "next/cache";
import { NotionAPI } from "notion-client";
import type { ExtendedRecordMap } from "notion-types";

import { sanitizeNotionRecordMap } from "@/common/utils/notionUtils";

const NOTION_REVALIDATE_SECONDS = 1800;

export const getNotionPage = unstable_cache(
  async (pageId: string): Promise<ExtendedRecordMap> => {
    const recordMap = await new NotionAPI().getPage(pageId);
    return sanitizeNotionRecordMap(recordMap);
  },
  ["notion-page"],
  { revalidate: NOTION_REVALIDATE_SECONDS }
);
