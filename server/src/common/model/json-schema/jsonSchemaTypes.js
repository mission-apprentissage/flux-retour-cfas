function number(custom = {}) {
  return { bsonType: "number", ...custom };
}
function integer(custom = {}) {
  return { bsonType: "int", ...custom };
}
function integerOrNull(custom = {}) {
  return { bsonType: ["int", "null"], ...custom };
}
function objectId(custom = {}) {
  return { bsonType: "objectId", ...custom };
}
function string(custom = {}) {
  return { bsonType: "string", ...custom };
}
function stringOrNull(custom = {}) {
  return { bsonType: ["string", "null"], ...custom };
}
function boolean(custom = {}) {
  return { bsonType: "bool", ...custom };
}
function date(custom = {}) {
  return { bsonType: "date", ...custom };
}
function dateOrNull(custom = {}) {
  return { bsonType: ["date", "null"], ...custom };
}

function arrayOf(items, custom = {}) {
  return {
    bsonType: "array",
    ...custom,
    items,
  };
}

function arrayOfOrNull(items, custom = {}) {
  return {
    bsonType: ["array", "null"],
    ...custom,
    items,
  };
}

function array(custom = {}) {
  return {
    bsonType: "array",
    ...custom,
  };
}

function object(properties, custom = {}) {
  return {
    bsonType: "object",
    additionalProperties: false,
    ...custom,
    properties,
  };
}

function objectOrNull(properties, custom = {}) {
  return {
    bsonType: ["object", "null"],
    additionalProperties: false,
    ...custom,
    properties,
  };
}

function any(custom = {}) {
  return {
    ...custom,
  };
}

module.exports = {
  any,
  number,
  integer,
  integerOrNull,
  objectId,
  string,
  stringOrNull,
  date,
  dateOrNull,
  boolean,
  arrayOf,
  arrayOfOrNull,
  array,
  object,
  objectOrNull,
};
