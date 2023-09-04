import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  // cette migration supprime les données liées à l'ancien système de permissions
  await db.collection("usersMigration").updateMany(
    {},
    {
      $unset: {
        roles: 1,
        is_cross_organismes: 1,
        is_admin: 1,
        codes_region: 1,
        codes_departement: 1,
        codes_academie: 1,
        organisation: 1,
        siret: 1,
        uai: 1,
        main_organisme_id: 1,
        reseau: 1,
        erp: 1,
        acl: 1,

        // potentiellement à supprimer (hors PR)
        // connection_history
        // emails
      },
    },
    { bypassDocumentValidation: true }
  );
  await db
    .collection("permissions")
    .drop()
    .catch(() => {});
  await db
    .collection("roles")
    .drop()
    .catch(() => {});

  await db.collection("organismes").updateMany(
    {},
    {
      $unset: {
        contributeurs: 1,
      },
    },
    { bypassDocumentValidation: true }
  );
};
