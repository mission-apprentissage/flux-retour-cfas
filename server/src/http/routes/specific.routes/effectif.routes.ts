import express from "express";
import Joi from "joi";
import { cloneDeep, isObject, merge, mergeWith, reduce, set } from "lodash-es";
import { ObjectId } from "mongodb";

import { updateEffectif } from "@/common/actions/effectifs.actions";
import { findDataFromSiret } from "@/common/actions/infoSiret.actions";
import { getUploadByOrgId } from "@/common/actions/uploads.actions";
import { getCodePostalInfo } from "@/common/apis/apiTablesCorrespondances";
import { CODE_POSTAL_REGEX } from "@/common/constants/organisme";
import { effectifsDb } from "@/common/model/collections";
import { schema } from "@/common/model/effectifs.model/effectifs.model";
import { stripEmptyFields } from "@/common/utils/miscUtils";
import { algoUAI } from "@/common/utils/uaiUtils";
import { legacyRequireManageEffectifsPermissionMiddleware } from "@/http/middlewares/legacyRequireManageEffectifsPermissionMiddleware";

const flattenKeys = (obj: any, path: any = []) =>
  !isObject(obj)
    ? { [path.join(".")]: obj }
    : reduce(obj, (cum, next, key) => merge(cum, flattenKeys(next, [...path, key])), {});

export default () => {
  const router = express.Router();

  router.use(legacyRequireManageEffectifsPermissionMiddleware);

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
        representant_legal: {
          ...mergeWith(
            mergeWith(
              mergeWith(
                cloneDeep(effectifSchema.apprenant.properties.representant_legal.properties),
                effectif.apprenant.representant_legal,
                customizer
              ),
              effectif.is_lock.apprenant.representant_legal,
              customizerLock
            ),
            paths.apprenant.representant_legal,
            customizerPath
          ),
          adresse: {
            ...mergeWith(
              mergeWith(
                mergeWith(
                  cloneDeep(effectifSchema.apprenant.properties.representant_legal.properties.adresse.properties),
                  effectif.apprenant.representant_legal ? effectif.apprenant.representant_legal.adresse : {},
                  customizer
                ),
                effectif.is_lock.apprenant.representant_legal.adresse,
                customizerLock
              ),
              paths.apprenant.representant_legal.adresse,
              customizerPath
            ),
          },
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
      validation_errors: effectif.validation_errors,
      updated_at: effectif.updated_at,
    };
  };

  router.get("/:id", async ({ params }, res) => {
    let { id } = await Joi.object({
      id: Joi.string().required(),
    })
      .unknown()
      .validateAsync(params, { abortEarly: false });

    const effectif = await effectifsDb().findOne({ _id: new ObjectId(id) });
    return res.json(buildEffectifResult(effectif));
  });

  router.get("/:id/snapshot", async ({ params, query }, res) => {
    let { id, organisme_id } = await Joi.object({
      id: Joi.string().required(),
      organisme_id: Joi.string().required(),
    })
      .unknown()
      .validateAsync({ ...params, ...query }, { abortEarly: false });

    const uploads = await getUploadByOrgId(organisme_id);

    const effectif = uploads.last_snapshot_effectifs.find(({ _id }) => _id.toString() === id);

    if (!effectif) {
      throw new Error(`Unable to find effectif ${params.id}`);
    }

    return res.json(buildEffectifResult(effectif));
  });

  // TODO https://github.com/mission-apprentissage/flux-retour-cfas/issues/2387
  // router.post("/", async ({ body }, res) => {
  //   const { organisme_id, annee_scolaire, source, apprenant, formation } = await Joi.object({
  //     organisme_id: Joi.string().required(),
  //     annee_scolaire: Joi.string().required(),
  //     source: Joi.string().required(),
  //     apprenant: Joi.object({
  //       nom: Joi.string().required(),
  //       prenom: Joi.string().required(),
  //     }).required(),
  //     formation: Joi.object({
  //       cfd: Joi.string().required(),
  //     }).required(),
  //   }).validateAsync(body, { abortEarly: false });

  //   const effectif = await createEffectif({
  //     organisme_id,
  //     annee_scolaire,
  //     source,
  //     apprenant,
  //     formation,
  //   });
  //   return res.json(effectif);
  // });

  router.put("/:id", async ({ body, params }, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { inputNames, ...data } = body; // TODO JOI (inputNames used to track suer actions)

    const effectifDb = await effectifsDb().findOne({ _id: new ObjectId(params.id) });
    if (!effectifDb) {
      throw new Error(`Unable to find effectif ${params.id}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { is_lock, nouveau_statut, nouveau_contrat, ...restData } = data;

    // TODO CHECK IS LOCK IF COMING FROM API
    // organisme

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, id_erp_apprenant, organisme_id, annee_scolaire, source, updated_at, created_at, ...dataToUpdate } =
      merge(effectifDb, {
        ...stripEmptyFields(restData),
      });

    // TODO WEIRD MONGO VALIDATION ISSUE ONLY ON THOSE
    if (dataToUpdate.formation.date_debut_formation)
      dataToUpdate.formation.date_debut_formation = new Date(dataToUpdate.formation.date_debut_formation);
    if (dataToUpdate.formation.date_fin_formation)
      dataToUpdate.formation.date_fin_formation = new Date(dataToUpdate.formation.date_fin_formation);
    if (dataToUpdate.formation.date_obtention_diplome)
      dataToUpdate.formation.date_obtention_diplome = new Date(dataToUpdate.formation.date_obtention_diplome);

    if (nouveau_statut) {
      dataToUpdate.apprenant.historique_statut.push({
        valeur_statut: nouveau_statut.valeur_statut,
        date_statut: nouveau_statut.date_statut,
        date_reception: new Date(),
      });
    }
    if (nouveau_contrat) {
      dataToUpdate.apprenant.contrats.push(nouveau_contrat);
    }

    let validation_errors: any[] = [];
    for (const validation_error of dataToUpdate.validation_errors) {
      if (!inputNames.includes(validation_error.fieldName)) {
        validation_errors.push(validation_error);
      }
    }

    const effectifUpdated = await updateEffectif(effectifDb._id, {
      ...dataToUpdate,
      id_erp_apprenant,
      organisme_id,
      annee_scolaire,
      source,
      validation_errors,
    });

    return res.json(buildEffectifResult(effectifUpdated));
  });

  router.post("/recherche-siret", async ({ body }, res) => {
    // TODO organismeFormation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { siret, organismeFormation } = await Joi.object({
      siret: Joi.string().required(),
      organismeFormation: Joi.boolean(),
    })
      .unknown()
      .validateAsync(body, { abortEarly: false });

    const data = await findDataFromSiret(siret);

    return res.json(data);
  });

  router.post("/recherche-uai", async ({ body }, res) => {
    const { uai: userUai } = await Joi.object({
      uai: Joi.string(),
    })
      .unknown()
      .validateAsync(body, { abortEarly: false });

    let uai = null;
    if (userUai) {
      if (!algoUAI(userUai)) return res.json({ uai, error: `L'UAI ${userUai} n'est pas valide` });
      uai = userUai;
    }

    // if (uai) {
    //   const { organismes: organismesResp } = await fetchOrganismesWithUai(uai);
    //   if (!organismesResp.length) return res.json({ uai, error: `L'uai ${uai} n'a pas été retrouvé` });
    // }

    return res.json({ uai });
  });

  router.post("/recherche-code-postal", async ({ body }, res) => {
    const { codePostal } = await Joi.object({
      codePostal: Joi.string().pattern(CODE_POSTAL_REGEX),
    })
      .unknown()
      .validateAsync(body, { abortEarly: false });

    const result = await getCodePostalInfo(codePostal);

    return res.json(result);
  });

  return router;
};
