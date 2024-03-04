import { Primitive, RawCreateParams, ZodEnum, ZodType, ZodTypeAny } from "zod";

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

export function zodEnumFromArray<K extends string>(array: K[]): ZodEnum<[K, ...K[]]> {
  const [firstKey, ...otherKeys] = array;
  return zodOpenApi.enum([firstKey, ...otherKeys]);
}

export function zodLiteralUnion<K extends Primitive>(list: readonly K[], params?: RawCreateParams): ZodType<K> {
  if (list.length < 2) throw new Error("zodLiteralUnion: you must provide at least 2 values");
  const [firstValue, secondValue, ...otherValues] = list.map((e) => zodOpenApi.literal(e)) as ZodTypeAny[];
  return zodOpenApi.union([firstValue, secondValue, ...otherValues], params);
}
