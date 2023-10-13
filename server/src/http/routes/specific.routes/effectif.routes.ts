import express from "express";
import Joi from "joi";
import { cloneDeep, isObject, merge, mergeWith, reduce, set } from "lodash-es";
import { ObjectId } from "mongodb";

import { updateEffectif } from "@/common/actions/effectifs.actions";
import { findDataFromSiret } from "@/common/actions/infoSiret.actions";
import { InfoSiret } from "@/common/actions/infoSiret.actions-struct";
import { getUploadByOrgId } from "@/common/actions/uploads.actions";
import { getCodePostalInfo } from "@/common/apis/apiTablesCorrespondances";
import { CODE_POSTAL_REGEX } from "@/common/constants/validations";
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
                effectif.is_lock.apprenant.representant_legal?.adresse,
                customizerLock
              ),
              paths.apprenant.representant_legal?.adresse,
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
      contrats: {
        ...effectifSchema.contrats,
        value: effectif.contrats,
        locked: effectif.is_lock.contrats || false,
        path: paths.contrats,
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

  router.get("/detail/:id", async ({ params }, res) => {
    let { id } = await Joi.object({
      id: Joi.string().required(),
    })
      .unknown()
      .validateAsync(params, { abortEarly: false });

    const effectif = await effectifsDb().findOne({ _id: new ObjectId(id) });
    return res.json(effectif);
  });

  router.get("/:id/snapshot", async ({ params, query }, res) => {
    const { id, organisme_id } = await Joi.object({
      id: Joi.string().required(),
      organisme_id: Joi.string().required(),
    })
      .unknown()
      .validateAsync({ ...params, ...query }, { abortEarly: false });

    const uploads = await getUploadByOrgId(new ObjectId(organisme_id));

    const effectif = uploads.last_snapshot_effectifs.find(({ _id }) => _id.toString() === id);

    if (!effectif) {
      throw new Error(`Unable to find effectif ${params.id}`);
    }

    return res.json(buildEffectifResult(effectif));
  });

  // TODO https://github.com/mission-apprentissage/flux-retour-cfas/issues/2387
  // router.post("/", async ({ body }, res) => {
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
      merge(effectifDb, stripEmptyFields(restData));

    // TODO WEIRD MONGO VALIDATION ISSUE ONLY ON THOSE
    if (dataToUpdate.formation.date_entree)
      dataToUpdate.formation.date_entree = new Date(dataToUpdate.formation.date_entree);
    if (dataToUpdate.formation.date_fin) dataToUpdate.formation.date_fin = new Date(dataToUpdate.formation.date_fin);
    if (dataToUpdate.formation.date_inscription)
      dataToUpdate.formation.date_inscription = new Date(dataToUpdate.formation.date_inscription);
    if (dataToUpdate.formation.date_obtention_diplome)
      dataToUpdate.formation.date_obtention_diplome = new Date(dataToUpdate.formation.date_obtention_diplome);
    if (dataToUpdate.apprenant.date_rqth) dataToUpdate.apprenant.date_rqth = new Date(dataToUpdate.apprenant.date_rqth);
    if (dataToUpdate.apprenant.date_de_naissance)
      dataToUpdate.apprenant.date_de_naissance = new Date(dataToUpdate.apprenant.date_de_naissance);

    dataToUpdate.apprenant.historique_statut = dataToUpdate.apprenant.historique_statut.map((s) => {
      const statut = stripEmptyFields(s);
      if (statut.date_statut) {
        statut.date_statut = new Date(statut.date_statut);
      }
      if (statut.date_reception) {
        statut.date_reception = new Date(statut.date_reception);
      }
      return statut;
    });
    if (nouveau_statut) {
      dataToUpdate.apprenant.historique_statut.push({
        valeur_statut: nouveau_statut.valeur_statut,
        date_statut: nouveau_statut.date_statut,
        date_reception: new Date(),
      });
    }

    dataToUpdate.contrats = dataToUpdate.contrats.map((c) => {
      const contrat = stripEmptyFields(c);
      if (contrat.date_debut) {
        contrat.date_debut = new Date(contrat.date_debut);
      }
      if (contrat.date_fin) {
        contrat.date_fin = new Date(contrat.date_fin);
      }
      if (contrat.date_rupture) {
        contrat.date_rupture = new Date(contrat.date_rupture);
      }
      return contrat;
    });
    if (nouveau_contrat) {
      dataToUpdate.contrats.push(nouveau_contrat);
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
      organisme_id: new ObjectId(organisme_id),
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

    const data: InfoSiret = await findDataFromSiret(siret);

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
