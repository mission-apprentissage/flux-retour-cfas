import { ZodEnum } from "zod";

import { zodOpenApi } from "../models/zodOpenApi";

// https://github.com/colinhacks/zod/discussions/839#discussioncomment-4335236
export function zodEnumFromObjKeys<K extends string>(obj: Record<K, any>): ZodEnum<[K, ...K[]]> {
  const [firstKey, ...otherKeys] = Object.keys(obj) as K[];
  return zodOpenApi.enum([firstKey, ...otherKeys]);
}

export function zodEnumFromObjValues<K extends string>(obj: Record<any, K>): ZodEnum<[K, ...K[]]> {
  const [firstKey, ...otherKeys] = Object.values(obj) as K[];
  return zodOpenApi.enum([firstKey, ...otherKeys]);
}
