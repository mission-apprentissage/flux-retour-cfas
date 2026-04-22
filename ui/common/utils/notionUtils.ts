import { ExtendedRecordMap } from "notion-types";

export function sanitizeNotionRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  const block: ExtendedRecordMap["block"] = {};

  for (const key of Object.keys(recordMap.block)) {
    const entry = recordMap.block[key] as any;
    const inner = entry?.value?.role !== undefined ? entry.value : entry;
    const value = inner?.value;

    if (!value || !value.type || inner?.role === "none") {
      continue;
    }

    const cleanValue = { ...value, id: value.id ?? key };
    if (Array.isArray(value.content)) {
      cleanValue.content = value.content.filter(
        (contentId: unknown): contentId is string => typeof contentId === "string" && contentId.length > 0
      );
    }

    block[key] = { role: inner.role ?? "reader", value: cleanValue };
  }

  return { ...recordMap, block };
}
