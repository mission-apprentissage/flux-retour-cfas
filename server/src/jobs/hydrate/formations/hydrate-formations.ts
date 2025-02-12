import { IFormation as IFormationApi } from "api-alternance-sdk";
import { AnyBulkWriteOperation, ObjectId } from "mongodb";
import { IFormationV2, IOrganisme } from "shared/models";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { formationV2Db, organismesDb } from "@/common/model/collections";

type IOrganismeIdGetter = (org: Pick<IOrganisme, "uai" | "siret">) => ObjectId | null;

export async function hydrateFormation(importDate: Date) {
  const cursor = apiAlternanceClient.formation.recherche({ page_size: 1000 });

  const organismeIdGetter = await buildOrganismeIdGetter();

  for await (const page of cursor) {
    await formationV2Db().bulkWrite(
      page.map((formation) => buildBulkOperation(formation, importDate, organismeIdGetter)),
      { ordered: false }
    );
  }
}

function buildBulkOperation(
  chunk: IFormationApi,
  importDate: Date,
  organismeIdGetter: IOrganismeIdGetter
): AnyBulkWriteOperation<IFormationV2> {
  const data: Omit<IFormationV2, "_id" | "created_at" | "cle_ministere_educatif"> = {
    responsable:
      chunk.responsable.organisme == null
        ? null
        : {
            tdb_id: organismeIdGetter(chunk.responsable.organisme.identifiant),
            siret: chunk.responsable.organisme.identifiant.siret,
            uai: chunk.responsable.organisme.identifiant.uai,
          },

    formateur:
      chunk.formateur.organisme == null
        ? null
        : {
            tdb_id: organismeIdGetter(chunk.formateur.organisme.identifiant),
            siret: chunk.formateur.organisme.identifiant.siret,
            uai: chunk.formateur.organisme.identifiant.uai,
          },

    certification: {
      rncp: chunk.certification.valeur.identifiant.rncp,
      cfd: chunk.certification.valeur.identifiant.cfd,
    },

    updated_at: importDate,
  };

  // TODO: what if draft already exists ??
  // How to detect ?
  return {
    updateOne: {
      filter: {
        cle_ministere_educatif: chunk.identifiant.cle_ministere_educatif,
      },
      update: {
        $set: data,
        $setOnInsert: {
          _id: new ObjectId(),
          created_at: importDate,
        },
      },
      upsert: true,
    },
  };
}

function getOrganismeKey({ uai, siret }: Pick<IOrganisme, "uai" | "siret">): string {
  return `${siret ?? "null"}-${uai ?? "null"}`;
}

async function buildOrganismeIdGetter(): Promise<IOrganismeIdGetter> {
  const map = new Map<string, ObjectId>();

  const cursor = organismesDb().find({}, { projection: { siret: 1, uai: 1 } });
  for await (const org of cursor) {
    map.set(getOrganismeKey(org), org._id);
  }

  return ({ uai, siret }) => map.get(getOrganismeKey({ uai, siret })) ?? null;
}
