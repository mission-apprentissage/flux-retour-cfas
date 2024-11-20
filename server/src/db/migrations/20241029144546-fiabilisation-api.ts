import { Db } from "mongodb";

import { organismesDb } from "@/common/model/collections";

export const up = async (db: Db) => {
  await organismesDb().updateMany(
    {
      fiabilisation_statut: "FIABLE",
    },
    {
      $unset: {
        fiabilisation_api_statut: true,
        creation_statut: true,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  );
  await organismesDb().updateMany(
    {
      fiabilisation_statut: { $ne: "FIABLE" },
    },
    {
      $set: {
        fiabilisation_statut: "NON_FIABLE",
      },
      $unset: {
        fiabilisation_api_statut: true,
        creation_statut: true,
      },
    },
    {
      bypassDocumentValidation: true,
    }
  );

  await db
    .collection("fiabilisationUaiSiret")
    .drop()
    .catch((e) => {
      if (e.codeName !== "NamespaceNotFound") {
        throw e;
      }
    });
};
