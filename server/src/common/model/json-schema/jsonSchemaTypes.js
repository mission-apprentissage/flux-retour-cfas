function number(custom = {}) {
  return { bsonType: "number", ...custom };
}
function integer(custom = {}) {
  return { bsonType: "int", ...custom };
}
function objectId(custom = {}) {
  return { bsonType: "objectId", ...custom };
}
function string(custom = {}) {
  return { bsonType: "string", ...custom };
}
function boolean(custom = {}) {
  return { bsonType: "bool", ...custom };
}
function date(custom = {}) {
  return { bsonType: "date", ...custom };
}

function arrayOf(items, custom = {}) {
  return {
    bsonType: "array",
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

module.exports = {
  number,
  integer,
  objectId,
  string,
  date,
  boolean,
  arrayOf,
  array,
  object,
};
