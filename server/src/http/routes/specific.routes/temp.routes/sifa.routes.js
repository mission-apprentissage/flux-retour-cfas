import express from "express";
import { cloneDeep, mergeWith } from "lodash-es";
import { ObjectId } from "mongodb";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
import { schema } from "../../../../common/model/next.toKeep.models/sifas.model/sifas.model.js";
import { sifasDb } from "../../../../common/model/collections.js";

// TODO TMP
export default () => {
  const router = express.Router();

  const buildSifaResult = (cerfa) => {
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
      const sifa = await sifasDb().findOne({ _id: ObjectId("6379d1f12329a49fbea0b535") });
      return res.json(buildSifaResult(sifa));
    })
  );

  return router;
};
