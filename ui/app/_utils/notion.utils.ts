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

// Mêmes motifs que notion-client : un identifiant refusé ici l'est aussi par son API.
const NOTION_PAGE_ID_PATTERNS = [/\b[\da-f]{32}\b/, /\b[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}\b/];

export const isNotionPageId = (id: string): boolean =>
  NOTION_PAGE_ID_PATTERNS.some((pattern) => pattern.test(id.split("?")[0]));

export const getNotionPage = unstable_cache(
  async (pageId: string): Promise<ExtendedRecordMap> => new NotionAPI().getPage(pageId),
  ["notion-page"],
  { revalidate: NOTION_REVALIDATE_SECONDS }
);
