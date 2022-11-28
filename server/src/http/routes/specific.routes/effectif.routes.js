import express from "express";
import Joi from "joi";
import { ObjectId } from "mongodb";
import { cloneDeep, isObject, merge, mergeWith, reduce, set } from "lodash-es";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import { schema } from "../../../common/model/next.toKeep.models/effectifs.model/effectifs.model.js";
import { effectifsDb } from "../../../common/model/collections.js";
import { createEffectif, updateEffectif } from "../../../common/actions/effectifs.actions.js";
import permissionsOrganismeMiddleware from "../../middlewares/permissionsOrganismeMiddleware.js";

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
    "/:id",
    permissionsOrganismeMiddleware(["organisme/page_effectifs"]),
    tryCatch(async ({ params }, res) => {
      let { id } = await Joi.object({
        id: Joi.string().required(),
      })
        .unknown()
        .validateAsync(params, { abortEarly: false });

      const effectif = await effectifsDb().findOne({ _id: ObjectId(id) });
      return res.json(buildEffectifResult(effectif));
    })
  );

  router.post(
    "/",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/ajout_apprenant"]),
    tryCatch(async ({ body }, res) => {
      const { organisme_id, annee_scolaire, source, apprenant, formation } = await Joi.object({
        organisme_id: Joi.string().required(),
        annee_scolaire: Joi.string().required(),
        source: Joi.string().required(),
        apprenant: Joi.object({
          nom: Joi.string().required(),
          prenom: Joi.string().required(),
        }).required(),
        formation: Joi.object({
          cfd: Joi.string().required(),
        }).required(),
      }).validateAsync(body, { abortEarly: false });

      const effectif = await createEffectif({
        organisme_id,
        annee_scolaire,
        source,
        apprenant,
        formation,
      });
      return res.json(effectif);
    })
  );

  router.put(
    "/:id",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/edition"]),
    tryCatch(async ({ body, params }, res) => {
      // eslint-disable-next-line no-unused-vars
      const { inputNames, ...data } = body; // TODO JOI (inputNames used to track suer actions)

      const effectifDb = await effectifsDb().findOne({ _id: ObjectId(params.id) }, { _id: 0, __v: 0 });
      if (!effectifDb) {
        throw new Error(`Unable to find effectif ${params.id}`);
      }

      const { is_lock, ...restData } = data;
      const compactObject = (val) => {
        const data = Array.isArray(val) ? val.filter(Boolean) : val;
        const ret = Object.keys(data).reduce(
          (acc, key) => {
            const value = data[key];
            // TODO Might be an issue with number and boolean
            if (value) acc[key] = typeof value === "object" ? compactObject(value) : value;
            if (!acc[key]) delete acc[key];
            return acc;
          },
          Array.isArray(val) ? [] : {}
        );
        return !Array.isArray(val) ? (!Object.keys(ret).length ? null : ret) : ret;
      };
      // eslint-disable-next-line no-unused-vars
      const { _id, id_erp_apprenant, organisme_id, annee_scolaire, source, updated_at, created_at, ...dataToUpdate } =
        merge(effectifDb, {
          ...compactObject(restData),
          is_lock,
        });

      const effectifUpdated = await updateEffectif(effectifDb._id, dataToUpdate);

      return res.json(buildEffectifResult(effectifUpdated));
    })
  );

  return router;
};
