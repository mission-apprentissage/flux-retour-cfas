import { JSONSchema4 } from "json-schema";

export type JSONSchema = JSONSchema4;

export function number(custom = {}) {
  return { bsonType: "number", ...custom };
}

export function numberOrNull(custom = {}) {
  return { bsonType: ["number", "null"], ...custom };
}

export function integer(custom = {}) {
  return { bsonType: "int", ...custom };
}

export function objectId(custom = {}) {
  return { bsonType: "objectId", ...custom };
}
/**
 * Note: this JSON schema type is not well supported by bson-schema-to-typescript
 * that's, why we have overriden the Permissions type
 * @param custom
 * @returns
 */
export function objectIdOrNull(custom = {}) {
  return { bsonType: ["objectId", "null"], ...custom };
}

export function string(custom = {}) {
  return { bsonType: "string", ...custom };
}

export function stringOrNull(custom = {}) {
  return { bsonType: ["string", "null"], ...custom };
}

export function boolean(custom = {}) {
  return { bsonType: "bool", ...custom };
}

export function booleanOrNull(custom = {}) {
  return { bsonType: ["bool", "null"], ...custom };
}

export function date(custom = {}) {
  return { bsonType: "date", ...custom };
}

export function dateOrNull(custom = {}) {
  return { bsonType: ["date", "null"], ...custom };
}

export function arrayOf(items, custom = {}) {
  return {
    bsonType: "array",
    ...custom,
    items,
  };
}

export function arrayOfOrNull(items, custom = {}) {
  return {
    bsonType: ["array", "null"],
    ...custom,
    items,
  };
}

export function array(custom = {}) {
  return {
    bsonType: "array",
    ...custom,
  };
}

export function object(properties, custom = {}) {
  return {
    bsonType: "object",
    additionalProperties: false,
    ...custom,
    properties,
  };
}
export function objectOrNull(properties, custom = {}) {
  return {
    bsonType: ["object", "null"],
    additionalProperties: false,
    ...custom,
    properties,
  };
}

export function any(custom = {}) {
  return {
    ...custom,
    bsonType: ["number", "string", "bool", "object", "array", "null"],
    additionalProperties: true,
  };
}
