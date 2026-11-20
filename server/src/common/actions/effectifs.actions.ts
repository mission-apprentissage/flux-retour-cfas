import * as Boom from "@hapi/boom";
import type { ICertification } from "api-alternance-sdk";
import { cloneDeep, mergeWith } from "lodash-es";
import { Collection, ObjectId, type WithoutId } from "mongodb";
import { MOTIF_SUPPRESSION } from "shared/constants";
import { IOpcos, IRncp } from "shared/models";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { IOrganisme } from "shared/models/data/organismes.model";

import { effectifsArchiveDb, effectifsDECADb, effectifsDb, opcosRncpDb } from "@/common/model/collections";
import { defaultValuesEffectif } from "@/common/model/effectifs.model/effectifs.model";
import { cachedInRun } from "@/common/utils/runCache";

import { legacySchema } from "./effectif.legacy_schema";
import { createComputedStatutObject } from "./effectifs.statut.actions";
import { generateOrganismeComputed } from "./organismes/organismes.actions";

export const mergeEffectifWithDefaults = (
  effectifData: Omit<IEffectif, "_id" | "_computed" | "organisme_id">
): Omit<IEffectif, "_id" | "_computed" | "organisme_id"> => {
  const defaultValues = defaultValuesEffectif();
  return {
    ...defaultValues,
    ...effectifData,
    apprenant: {
      ...defaultValues.apprenant,
      ...effectifData.apprenant,
    },
    formation: {
      ...defaultValues.formation,
      ...effectifData.formation,
    },
  };
};

export const addComputedFields = async <T extends WithoutId<IEffectif | IEffectifDECA>>({
  organisme,
  effectif,
  certification,
}: {
  organisme?: IOrganisme;
  effectif?: T;
  certification: ICertification | null;
}): Promise<IEffectif["_computed"]> => {
  const computedFields: IEffectif["_computed"] = {};

  if (organisme) {
    computedFields.organisme = generateOrganismeComputed(organisme);
  }

  if (effectif) {
    const statut = createComputedStatutObject(effectif, new Date());
    computedFields.statut = statut;
  }

  if (effectif?.formation?.rncp) {
    const rncp = effectif.formation.rncp;
    const rncpList = await cachedInRun(`opcos-rncp:${rncp}`, () =>
      opcosRncpDb().find({ "_computed.rncp.code": rncp }).toArray()
    );

    if (rncpList) {
      computedFields.formation = {
        codes_rome: certification?.domaines.rome.rncp?.map(({ code }) => code) ?? null,
        opcos: rncpList.map(({ _computed }) => _computed.opco.nom),
      };
    }
  }

  return computedFields;
};

export const withComputedFields = async <T extends WithoutId<IEffectif | IEffectifDECA>>(
  effectif: T,
  {
    organisme,
    certification,
  }: {
    organisme?: IOrganisme;
    certification: ICertification | null;
  }
): Promise<T> => {
  return {
    ...effectif,
    _computed: await addComputedFields({ organisme, effectif, certification }),
  };
};

export async function getEffectifByIdWithCollection(effectifId: ObjectId): Promise<{
  effectif: IEffectif | IEffectifDECA;
  collection: () => Collection<IEffectif> | Collection<IEffectifDECA>;
} | null> {
  let effectif: IEffectif | IEffectifDECA | null;

  effectif = await effectifsDb().findOne({ _id: effectifId });
  if (effectif) {
    return { effectif, collection: effectifsDb };
  }

  effectif = await effectifsDECADb().findOne({ _id: effectifId });
  if (effectif) {
    return { effectif, collection: effectifsDECADb };
  }

  return null;
}

export async function getEffectifForm(effectifId: ObjectId) {
  let effectif: IEffectif | IEffectifDECA | null = await effectifsDb().findOne({ _id: effectifId });

  if (!effectif) {
    effectif = await effectifsDECADb().findOne({ _id: effectifId });
  }
  if (!effectif) {
    throw Boom.notFound(`Unable to find effectif ${effectifId.toString()}`);
  }

  return buildEffectifResult(effectif);
}

export async function softDeleteEffectif(
  effectifId: ObjectId,
  userId: ObjectId | null,
  {
    motif,
    description,
  }: {
    motif: MOTIF_SUPPRESSION;
    description: string | null | undefined;
  }
) {
  const effectif = await effectifsDb().findOne({ _id: new ObjectId(effectifId) });
  if (!effectif) {
    throw Boom.notFound(`Unable to find effectif ${effectifId.toString()}`);
  }
  await effectifsArchiveDb().insertOne({
    ...effectif,
    _id: new ObjectId(),
    suppression: {
      user_id: userId,
      motif,
      description,
      date: new Date(),
    },
  });
  await effectifsDb().deleteOne({ _id: new ObjectId(effectifId) });
}

function buildEffectifResult(effectif: (IEffectif | IEffectifDECA) & { lieu_de_formation?: unknown }) {
  const { properties: effectifSchema } = legacySchema;

  function customizer(objValue: Record<string, unknown> | undefined, srcValue: unknown) {
    if (objValue !== undefined) {
      return {
        ...objValue,
        value:
          srcValue || srcValue === false || srcValue === 0 ? srcValue : typeof objValue.type === "object" ? null : "",
      };
    }
  }

  return {
    apprenant: {
      ...mergeWith(cloneDeep(effectifSchema.apprenant.properties), effectif.apprenant, customizer),
      adresse: {
        ...mergeWith(
          cloneDeep(effectifSchema.apprenant.properties.adresse.properties),
          effectif.apprenant.adresse,
          customizer
        ),
      },
      adresse_naissance: {
        ...mergeWith(
          cloneDeep(effectifSchema.apprenant.properties.adresse_naissance.properties),
          effectif.apprenant.adresse_naissance,
          customizer
        ),
      },
      representant_legal: {
        ...mergeWith(
          cloneDeep(effectifSchema.apprenant.properties.representant_legal.properties),
          effectif.apprenant.representant_legal,
          customizer
        ),
        adresse: {
          ...mergeWith(
            cloneDeep(effectifSchema.apprenant.properties.representant_legal.properties.adresse.properties),
            effectif.apprenant.representant_legal ? effectif.apprenant.representant_legal.adresse : {},
            customizer
          ),
        },
      },
    },
    formation: {
      ...mergeWith(cloneDeep(effectifSchema.formation.properties), effectif.formation, customizer),
    },
    lieu_de_formation: {
      ...mergeWith(cloneDeep(effectifSchema.lieu_de_formation.properties), effectif.lieu_de_formation, customizer),
    },
    contrats: {
      ...effectifSchema.contrats,
      value: effectif.contrats,
    },
    annee_scolaire: effectif.annee_scolaire,
    id: effectif._id,
    organisme_id: effectif.organisme_id,
    id_erp_apprenant: effectif.id_erp_apprenant,
    source: effectif.source,
    validation_errors: effectif.validation_errors,
    updated_at: effectif.updated_at,
  };
}

export const updateEffectifComputedFromRNCP = async (rncp: IRncp, opco: IOpcos) => {
  return (
    rncp.rncp &&
    effectifsDb().updateMany(
      {
        "formation.rncp": rncp.rncp,
      },
      {
        $set: {
          "_computed.formation.codes_rome": rncp.romes,
        },
        $addToSet: {
          "_computed.formation.opcos": opco.name,
        },
      }
    )
  );
};
