import { NotionAPI } from "notion-client";
import { ExtendedRecordMap } from "notion-types";

const notion = new NotionAPI();

export function getNotionPage(pageId: string): Promise<ExtendedRecordMap> {
  return notion.getPage(pageId);
}
