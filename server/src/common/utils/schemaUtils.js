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
        base: Joi.alternatives(
          Joi.string().regex(/^[0-9a-fA-F]{24}$/),
          Joi.object().keys({
            id: Joi.any(),
            // _bsontype: Joi.allow("ObjectId"), // Cannot assign to read only property '_bsontype' of object '[object Object]'
          })
        ),
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
