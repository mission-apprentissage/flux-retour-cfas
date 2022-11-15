export function number(custom = {}) {
  return { bsonType: "number", ...custom };
}

export function integer(custom = {}) {
  return { bsonType: "int", ...custom };
}

export function integerOrNull(custom = {}) {
  return { bsonType: ["int", "null"], ...custom };
}

export function objectId(custom = {}) {
  return { bsonType: "objectId", ...custom };
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
  };
}
