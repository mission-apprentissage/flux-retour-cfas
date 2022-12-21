import logger from "../logger.js";
import Joi from "joi";
import Enjoi from "enjoi";

const applySchemaValidation = (entity, schema, extensions = [], abortEarly = true) => {
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

  const { error, value } = schemaTmp.validate(entity, { abortEarly });
  return { error, value };
};

export function schemaValidation(entity, schema, extensions = []) {
  const { error, value } = applySchemaValidation(entity, schema, extensions);

  if (error) {
    logger.error(error);
    throw new Error(`schema not valid : ${error}`);
  }

  return value;
}

/**
 * Méthode de construction des erreurs de validation schema
 * @param {*} entity
 * @param {*} schema
 * @param {*} extensions
 * @returns
 */
export const getSchemaValidationErrors = (entity, schema, extensions = []) => {
  const { error } = applySchemaValidation(entity, schema, extensions, false); // AbortEarly false pour récupération de toutes les erreurs

  const errorsFormatted = error?.details?.map(({ context, type, message }) => ({
    type,
    message,
    fieldName: context.label,
    inputValue: context.value,
  }));

  return errorsFormatted || [];
};
