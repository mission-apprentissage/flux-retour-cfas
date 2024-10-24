import { addJob } from "job-processor";
import type { AnyBulkWriteOperation } from "mongodb";
import { DEPARTEMENTS_BY_CODE, type IDepartement } from "shared/constants";
import type { IEffectif, IOrganisme } from "shared/models";

import logger from "@/common/logger";
import { effectifsDb, modelDescriptors, organisationsDb, organismesDb } from "@/common/model/collections";
import { configureDbSchemaValidation } from "@/common/mongodb";

async function migrateOrganisations() {
  // Certaines organisatons sont créée avec des code regions invalides principalement due à l'impersonation
  const emptyOrganisations = await organisationsDb()
    .aggregate([
      {
        $lookup: {
          from: "usersMigration",
          localField: "_id",
          foreignField: "organisation_id",
          as: "users",
        },
      },
      {
        $match: {
          users: {
            $size: 0,
          },
        },
      },
    ])
    .toArray();
  await organisationsDb().deleteMany({ _id: { $in: emptyOrganisations.map((o) => o._id) } });

  for (let i = 1; i < 10; i++) {
    const prevCode = `${i}`;
    const newCode = `0${i}`;

    await organisationsDb().updateMany(
      { code_academie: prevCode },
      { $set: { code_academie: newCode } },
      { bypassDocumentValidation: true }
    );
  }
}

function updateOrganismeAdresse(org: IOrganisme): AnyBulkWriteOperation<IOrganisme> | null {
  if (!org.adresse) return null;
  if (Object.keys(org.adresse).length === 0) {
    return {
      updateOne: {
        filter: { _id: org._id },
        update: {
          $unset: { adresse: "" },
        },
      },
    };
  }

  if (!org.adresse.departement) return null;

  const dep: IDepartement = DEPARTEMENTS_BY_CODE[org.adresse.departement];

  if (dep.region.code === org.adresse.region && dep.academie.code === org.adresse.academie) return null;

  return {
    updateOne: {
      filter: { _id: org._id },
      update: {
        $set: {
          "adresse.region": dep.region.code,
          "adresse.academie": dep.academie.code,
        },
      },
    },
  };
}

function updateOrganismeResponsablesAdresse(org: IOrganisme): AnyBulkWriteOperation<IOrganisme> | null {
  if (!org.organismesResponsables) return null;

  let updated = false;
  const result = org.organismesResponsables.map((resp) => {
    if (!resp.departement) return resp;

    const dep: IDepartement = DEPARTEMENTS_BY_CODE[resp.departement];
    if (!dep) return resp;
    if (dep.region.code === resp.region && dep.academie.code === resp.academie) return resp;

    updated = true;
    return {
      ...resp,
      region: dep.region.code,
      academie: dep.academie.code,
    };
  });

  if (!updated) return null;

  return {
    updateOne: {
      filter: { _id: org._id },
      update: {
        $set: {
          organismesResponsables: result,
        },
      },
    },
  };
}

function updateOrganismeFormateursAdresse(org: IOrganisme): AnyBulkWriteOperation<IOrganisme> | null {
  if (!org.organismesFormateurs) return null;

  let updated = false;
  const result = org.organismesFormateurs.map((formateur) => {
    if (!formateur.departement) return formateur;

    const dep: IDepartement = DEPARTEMENTS_BY_CODE[formateur.departement];
    if (!dep) return formateur;
    if (dep.region.code === formateur.region && dep.academie.code === formateur.academie) return formateur;

    updated = true;
    return {
      ...formateur,
      region: dep.region.code,
      academie: dep.academie.code,
    };
  });

  if (!updated) return null;

  return {
    updateOne: {
      filter: { _id: org._id },
      update: {
        $set: {
          organismesFormateurs: result,
        },
      },
    },
  };
}

function updateOrganisme(org: IOrganisme): AnyBulkWriteOperation<IOrganisme>[] {
  const updates: AnyBulkWriteOperation<IOrganisme>[] = [];

  const adresseUpdate = updateOrganismeAdresse(org);
  if (adresseUpdate) updates.push(adresseUpdate);

  const responsablesUpdate = updateOrganismeResponsablesAdresse(org);
  if (responsablesUpdate) updates.push(responsablesUpdate);

  const formateursUpdate = updateOrganismeFormateursAdresse(org);
  if (formateursUpdate) updates.push(formateursUpdate);

  return updates;
}

async function migrateOrganismes() {
  const total = await organismesDb().countDocuments({});

  const cursor = organismesDb().find({});
  let updates: AnyBulkWriteOperation<IOrganisme>[] = [];
  let count = 0;

  for await (const org of cursor) {
    count++;
    if (count % 1000 === 0) {
      logger.info(`Migrating organismes: ${count} / ${total}`);
    }

    updates = updates.concat(updateOrganisme(org));

    if (updates.length > 1000) {
      await organismesDb().bulkWrite(updates, { bypassDocumentValidation: true });
      updates = [];
    }
  }

  if (updates.length > 0) {
    await organismesDb().bulkWrite(updates, { bypassDocumentValidation: true });
  }

  logger.info(`Migrating organismes done: ${count} / ${total}`);
}

function updateEffectifAdresse(effectif: IEffectif): AnyBulkWriteOperation<IEffectif>[] {
  if (!effectif.apprenant.adresse) return [];
  if (Object.keys(effectif.apprenant.adresse).length === 0) {
    return [
      {
        updateOne: {
          filter: { _id: effectif._id },
          update: {
            $unset: { "apprenant.adresse": "" },
          },
        },
      },
    ];
  }
  if (!effectif.apprenant.adresse.departement) return [];
  const dep: IDepartement = DEPARTEMENTS_BY_CODE[effectif.apprenant.adresse.departement];
  if (
    dep.region.code === effectif.apprenant.adresse.region &&
    dep.academie.code === effectif.apprenant.adresse.academie
  ) {
    return [];
  }

  return [
    {
      updateOne: {
        filter: { _id: effectif._id },
        update: {
          $set: {
            "apprenant.adresse.region": dep.region.code,
            "apprenant.adresse.academie": dep.academie.code,
          },
        },
      },
    },
  ];
}

function updateEffectifContratAdresse(effectif: IEffectif): AnyBulkWriteOperation<IEffectif>[] {
  if (!effectif.contrats) return [];
  let updated = false;
  const result = effectif.contrats.map((contrat) => {
    if (!contrat.adresse) return contrat;
    if (Object.keys(contrat.adresse).length === 0) {
      updated = true;
      return {
        ...contrat,
        adresse: undefined,
      };
    }
    if (!contrat.adresse.departement) return contrat;
    const dep: IDepartement = DEPARTEMENTS_BY_CODE[contrat.adresse.departement];
    if (dep.region.code === contrat.adresse.region && dep.academie.code === contrat.adresse.academie) {
      return contrat;
    }
    updated = true;
    return {
      ...contrat,
      adresse: {
        ...contrat.adresse,
        region: dep.region.code,
        academie: dep.academie.code,
      },
    };
  });
  if (!updated) return [];

  return [
    {
      updateOne: {
        filter: { _id: effectif._id },
        update: {
          $set: {
            contrats: result,
          },
        },
      },
    },
  ];
}

async function migrateEffectifs() {
  // Invalid source values in local database
  await effectifsDb().updateMany(
    { source: { $nin: ["FICHIER", "ERP", "DECA"] } },
    { $set: { source: "ERP" } },
    { bypassDocumentValidation: true }
  );

  const total = await effectifsDb().countDocuments({});
  let count = 0;
  const cursor = effectifsDb().find({});
  let updates: AnyBulkWriteOperation<IEffectif>[] = [];

  for await (const effectif of cursor) {
    count++;
    if (count % 1000 === 0) {
      logger.info(`Migrating effectifs: ${count} / ${total}`);
    }
    updates = updates.concat(updateEffectifAdresse(effectif));
    updates = updates.concat(updateEffectifContratAdresse(effectif));

    if (updates.length > 1000) {
      await effectifsDb().bulkWrite(updates, { bypassDocumentValidation: true });
      updates = [];
    }
  }

  if (updates.length > 0) {
    await effectifsDb().bulkWrite(updates, { bypassDocumentValidation: true });
  }

  logger.info(`Migrating effectifs done: ${count} / ${total}`);
}

export const up = async () => {
  await Promise.all([migrateOrganismes(), migrateOrganisations(), migrateEffectifs()]);
  await configureDbSchemaValidation(modelDescriptors);
  await addJob({ name: "computed:update", queued: true });
};
