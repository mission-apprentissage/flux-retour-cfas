import { JSONSchema4 } from "json-schema";

export type JSONSchema = JSONSchema4;

export function number<T extends JSONSchema>(custom: T = {} as T) {
  return { bsonType: "number", ...custom };
}

export function numberOrNull(custom = {}) {
  return { bsonType: ["number", "null"], ...custom };
}

export function integer<T extends JSONSchema>(custom: T = {} as T) {
  return { bsonType: "int", ...custom };
}

export function objectId<T extends JSONSchema>(custom: T = {} as T) {
  return { bsonType: "objectId", ...custom };
}
/**
 * Note: this JSON schema type is not well supported by bson-schema-to-typescript
 * that's, why we have overriden the Permissions type
 * @param custom
 * @returns
 */
export function objectIdOrNull<T extends JSONSchema>(custom: T = {} as T) {
  return { bsonType: ["objectId", "null"], ...custom };
}

export function string<T extends JSONSchema>(custom: T = {} as T) {
  return { bsonType: "string", ...custom };
}

export function stringOrNull<T extends JSONSchema>(custom: T = {} as T) {
  return { bsonType: ["string", "null"], ...custom };
}

export function boolean<T extends JSONSchema>(custom: T = {} as T) {
  return { bsonType: "bool", ...custom };
}

export function booleanOrNull(custom = {}) {
  return { bsonType: ["bool", "null"], ...custom };
}

export function date<T extends JSONSchema>(custom: T = {} as T) {
  return { bsonType: "date", ...custom };
}

export function dateOrNull<T extends JSONSchema>(custom: T = {} as T) {
  return { bsonType: ["date", "null"], ...custom };
}

export function arrayOf<T extends JSONSchema>(items: JSONSchema4 | JSONSchema4[], custom: T = {} as T) {
  return {
    bsonType: "array",
    ...custom,
    items,
  };
}

export function arrayOfOrNull<T extends JSONSchema4>(items: ReadonlyArray<T> | T | undefined, custom = {}) {
  return {
    bsonType: ["array", "null"],
    ...custom,
    items,
  };
}

export function array<T extends JSONSchema>(custom: T = {} as T) {
  return {
    bsonType: "array",
    ...custom,
  };
}

export function object<P extends JSONSchema["properties"], T extends JSONSchema>(properties: P, custom: T = {} as T) {
  return {
    bsonType: "object",
    additionalProperties: false,
    ...custom,
    properties,
  };
}
export function objectOrNull<P extends JSONSchema["properties"]>(properties: P, custom = {}) {
  return {
    bsonType: ["object", "null"],
    additionalProperties: false,
    ...custom,
    properties,
  };
}

export function any(custom: { description?: string } = {}) {
  return {
    ...custom,
    bsonType: ["number", "string", "bool", "object", "array", "null"],
    additionalProperties: true,
  };
}
