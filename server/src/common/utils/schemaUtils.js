import logger from "../logger.js";
import Joi from "joi";
import Enjoi from "enjoi";

export function schemaValidation(entity, schema, extensions = []) {
  let schemaDesc = JSON.parse(JSON.stringify(schema).replaceAll("bsonType", "type"));

  const ext = extensions.map(({ name, ...extension }) => {
    schemaDesc.properties[name].type = name;
    return {
      type: name,
      ...extension,
    };
  });

  const schemaTmp = Enjoi.schema(schemaDesc, {
    extensions: [
      {
        type: "objectId",
        base: Joi.string(), // TODO
      },
      {
        type: "int",
        base: Joi.number(),
      },
      ...ext,
    ],
  });

  const { error, value } = schemaTmp.validate(entity);

  if (error) {
    logger.error(error);
    throw new Error(`schema not valid : ${error}`);
  }

  return value;
}
