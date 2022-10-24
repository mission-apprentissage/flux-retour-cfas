const Joi = require("joi");
const { parse } = require("date-fns");

const schema = Joi.string()
  .regex(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/) // make sure the passed date contains at least YYYY-MM-DD
  .custom((val, helpers) => {
    const { value, error } = Joi.date().iso().validate(val);
    return error ? helpers.error("string.isoDate") : value;
  });

const parseFormattedDate = (value) => (value ? parse(value, dateFormat, new Date()) : null);
const dateFormat = "dd/MM/yyyy";
const XLSX_DateNF_Format = 'dd"/"mm"/"yyyy';

module.exports = {
  schema,
  parseFormattedDate,
  dateFormat,
  XLSX_DateNF_Format,
};
