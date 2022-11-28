import express from "express";
import Joi from "joi";
import { ObjectId } from "mongodb";
import { cloneDeep, isObject, merge, mergeWith, reduce, set } from "lodash-es";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import { schema } from "../../../common/model/next.toKeep.models/effectifs.model/effectifs.model.js";
import { effectifsDb } from "../../../common/model/collections.js";
import { createEffectif, updateEffectif } from "../../../common/actions/effectifs.actions.js";

const flattenKeys = (obj, path = []) =>
  !isObject(obj)
    ? { [path.join(".")]: obj }
    : reduce(obj, (cum, next, key) => merge(cum, flattenKeys(next, [...path, key])), {});

// TODO [tech] TMP
export default () => {
  const router = express.Router();

  const buildEffectifResult = (effectif) => {
    const { properties: effectifSchema } = schema;

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
    function customizerPath(objValue, srcValue) {
      if (objValue !== undefined) {
        return { ...objValue, path: srcValue };
      }
    }

    const flatPaths = Object.keys(flattenKeys(effectif.is_lock));
    let paths = cloneDeep(effectif.is_lock);
    for (const path of flatPaths) {
      set(paths, path, path);
    }

    return {
      apprenant: {
        ...mergeWith(
          mergeWith(
            mergeWith(cloneDeep(effectifSchema.apprenant.properties), effectif.apprenant, customizer),
            effectif.is_lock.apprenant,
            customizerLock
          ),
          paths.apprenant,
          customizerPath
        ),
        adresse: {
          ...mergeWith(
            mergeWith(
              mergeWith(
                cloneDeep(effectifSchema.apprenant.properties.adresse.properties),
                effectif.apprenant.adresse,
                customizer
              ),
              effectif.is_lock.apprenant.adresse,
              customizerLock
            ),
            paths.apprenant.adresse,
            customizerPath
          ),
        },
      },
      formation: {
        ...mergeWith(
          mergeWith(
            mergeWith(cloneDeep(effectifSchema.formation.properties), effectif.formation, customizer),
            effectif.is_lock.formation,
            customizerLock
          ),
          paths.formation.adresse,
          customizerPath
        ),
      },
      annee_scolaire: effectif.annee_scolaire,
      id: effectif._id,
      organisme_id: effectif.organisme_id,
      id_erp_apprenant: effectif.id_erp_apprenant,
      source: effectif.source,
      updated_at: effectif.updated_at,
    };
  };

  router.get(
    "/",
    tryCatch(async (req, res) => {
      let { effectifId } = await Joi.object({
        effectifId: Joi.string().required(),
      })
        .unknown()
        .validateAsync(req.query, { abortEarly: false });

      const effectif = await effectifsDb().findOne({ _id: ObjectId(effectifId) });
      return res.json(buildEffectifResult(effectif));
    })
  );

  router.get(
    "/create",
    tryCatch(async (req, res) => {
      const effectif = await createEffectif();
      return res.json(effectif);
    })
  );

  router.put(
    "/:id",
    // permissionsDossierMiddleware(components, ["dossier/sauvegarder"]),
    tryCatch(async ({ body, params }, res) => {
      // eslint-disable-next-line no-unused-vars
      const { inputNames, ...data } = body; // TODO JOI

      const effectifDb = await effectifsDb().findOne({ _id: ObjectId(params.id) }, { _id: 0, __v: 0 });
      if (!effectifDb) {
        throw new Error(`Unable to find effectif ${params.id}`);
      }
      // TODO DEAL WITH NULL values
      // eslint-disable-next-line no-unused-vars
      const { _id, apprenant, formation, ...mergedData } = merge(effectifDb, data);
      const tmp = {
        apprenant: {
          nom: apprenant.nom,
          prenom: apprenant.prenom,
          historique_statut: [],
        },
        formation,
      };
      console.log(tmp);
      const effectifUpdated = await updateEffectif(effectifDb._id, tmp);

      return res.json(buildEffectifResult(effectifUpdated));
    })
  );

  return router;
};
