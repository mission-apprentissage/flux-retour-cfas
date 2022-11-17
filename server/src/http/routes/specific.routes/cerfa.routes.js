import express from "express";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import { cloneDeep, mergeWith } from "lodash-es";

import { schema } from "../../../common/model/cerfa.model/cerfa.model.js";
import { CerfasDb } from "../../../common/model/collections.js";
import { ObjectId } from "mongodb";

// TODO TMP
export default () => {
  const router = express.Router();

  const buildCerfaResult = (cerfa) => {
    const { properties: cerfaSchema } = schema();

    function customizer(objValue, srcValue) {
      if (objValue !== undefined) {
        return {
          ...objValue,
          value:
            srcValue || srcValue === false || srcValue === 0 ? srcValue : typeof objValue.type === "object" ? null : "",
        };
      }
    }

    function customizerLock(objValue, srcValue) {
      if (objValue !== undefined) {
        return { ...objValue, locked: srcValue };
      }
    }
    console.log(cerfaSchema, cerfa);
    return {
      employeur: {
        ...mergeWith(
          mergeWith(cloneDeep(cerfaSchema.employeur.properties), cerfa.employeur, customizer),
          cerfa.isLockedField.employeur,
          customizerLock
        ),
        adresse: {
          ...mergeWith(
            mergeWith(
              cloneDeep(cerfaSchema.employeur.properties.adresse.properties),
              cerfa.employeur.adresse,
              customizer
            ),
            cerfa.isLockedField.employeur.adresse,
            customizerLock
          ),
        },
      },
      id: cerfa._id,
      draft: cerfa.draft,
    };
  };

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const cerfa = await CerfasDb().findOne({ _id: ObjectId("6376500374c10993ee47ac60") });
      return res.json(buildCerfaResult(cerfa));
    })
  );

  return router;
};
