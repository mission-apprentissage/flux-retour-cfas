import { ExtendedRecordMap } from "notion-types";

export function sanitizeNotionRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  const block = { ...recordMap.block };

  for (const key of Object.keys(block)) {
    const entry = block[key];
    const value = entry?.value;

    if (!value) {
      delete block[key];
      continue;
    }

    if (!value.id) {
      block[key] = { ...entry, value: { ...value, id: key } };
      continue;
    }

    if (Array.isArray(value.content)) {
      const cleaned = value.content.filter((id): id is string => typeof id === "string" && id.length > 0);
      if (cleaned.length !== value.content.length) {
        block[key] = { ...entry, value: { ...value, content: cleaned } };
      }
    }
  }

  return { ...recordMap, block };
}
