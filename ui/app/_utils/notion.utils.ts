import { unstable_cache } from "next/cache";
import { NotionAPI } from "notion-client";
import type { ExtendedRecordMap } from "notion-types";

const NOTION_REVALIDATE_SECONDS = 1800;

export function getNotionPageTitle(recordMap: ExtendedRecordMap | null): string | null {
  if (!recordMap) {
    return null;
  }

  const rootKey = Object.keys(recordMap.block)[0];
  // notion-client renvoie parfois la valeur doublement encapsulée ({ role, value: { role, value } }).
  const inner = recordMap.block[rootKey]?.value;
  const block = inner && "value" in inner ? inner.value : inner;
  const title = block?.properties?.title;

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
  async (pageId: string): Promise<ExtendedRecordMap> => new NotionAPI().getPage(pageId),
  ["notion-page"],
  { revalidate: NOTION_REVALIDATE_SECONDS }
);
