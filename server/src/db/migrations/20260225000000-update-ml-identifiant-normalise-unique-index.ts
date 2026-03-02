import { ObjectId } from "mongodb";

import { getDatabase } from "@/common/mongodb";

const OLD_INDEX_NAME =
  "identifiant_normalise.nom_1_identifiant_normalise.prenom_1_identifiant_normalise.date_de_naissance_1_soft_deleted_1";

/**
 * Migration : passage à un index unique partiel sur identifiant_normalise.
 *
 * 1. Nettoyage des doublons existants (soft-delete les DECA quand un ERP existe, sinon garder le plus récent)
 * 2. Drop de l'ancien index (non-unique, incluait soft_deleted dans la clé)
 * 3. Création du nouvel index unique partiel
 */
export const up = async () => {
  const db = getDatabase();
  const collection = db.collection("missionLocaleEffectif");

  // 1. Nettoyer les doublons actifs sur identifiant_normalise
  const duplicates = await collection
    .aggregate([
      {
        $match: {
          soft_deleted: { $ne: true },
          identifiant_normalise: { $ne: null },
        },
      },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: {
            nom: "$identifiant_normalise.nom",
            prenom: "$identifiant_normalise.prenom",
            dob: "$identifiant_normalise.date_de_naissance",
          },
          records: {
            $push: {
              id: "$_id",
              is_deca: { $ne: [{ $type: "$effectif_snapshot.is_deca_compatible" }, "missing"] },
            },
          },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  const idsToSoftDelete: ObjectId[] = [];

  for (const dup of duplicates) {
    const hasErp = dup.records.some((r: { is_deca: boolean }) => !r.is_deca);
    const decaRecords = dup.records.filter((r: { is_deca: boolean }) => r.is_deca);

    if (hasErp && decaRecords.length > 0) {
      // ERP existe : soft-delete tous les DECA
      for (const deca of decaRecords) {
        idsToSoftDelete.push(deca.id);
      }
    } else if (!hasErp && decaRecords.length > 1) {
      // Que des DECA : garder le plus récent (premier après sort desc), soft-delete les autres
      for (const deca of decaRecords.slice(1)) {
        idsToSoftDelete.push(deca.id);
      }
    } else {
      // Que des ERP en doublon : garder le plus récent
      const erpRecords = dup.records.filter((r: { is_deca: boolean }) => !r.is_deca);
      for (const erp of erpRecords.slice(1)) {
        idsToSoftDelete.push(erp.id);
      }
    }
  }

  if (idsToSoftDelete.length > 0) {
    const result = await collection.updateMany(
      { _id: { $in: idsToSoftDelete } },
      { $set: { soft_deleted: true }, $unset: { identifiant_normalise: "" } }
    );
    console.log(`Doublons nettoyés: ${result.modifiedCount} records soft-deleted`);
  } else {
    console.log("Aucun doublon à nettoyer");
  }

  // 2. $unset identifiant_normalise sur tous les documents déjà soft-deleted
  //    (nécessaire car l'index partiel utilise identifiant_normalise.nom $exists: true)
  const cleanupResult = await collection.updateMany(
    { soft_deleted: true, identifiant_normalise: { $ne: null } },
    { $unset: { identifiant_normalise: "" } }
  );
  if (cleanupResult.modifiedCount > 0) {
    console.log(`Nettoyage: ${cleanupResult.modifiedCount} documents soft-deleted avec identifiant_normalise nettoyé`);
  }

  // 3. Drop l'ancien index (s'il existe)
  const indexes = await collection.indexes();
  const hasOldIndex = indexes.some((index) => index.name === OLD_INDEX_NAME);

  if (hasOldIndex) {
    await collection.dropIndex(OLD_INDEX_NAME);
    console.log(`Ancien index ${OLD_INDEX_NAME} supprimé`);
  } else {
    console.log("Ancien index non trouvé, skip drop");
  }

  // 3. Créer le nouvel index unique partiel
  await collection.createIndex(
    {
      "identifiant_normalise.nom": 1,
      "identifiant_normalise.prenom": 1,
      "identifiant_normalise.date_de_naissance": 1,
    },
    {
      unique: true,
      partialFilterExpression: { "identifiant_normalise.nom": { $exists: true } },
    }
  );
  console.log("Nouvel index unique partiel créé");
};

export const down = async () => {
  const db = getDatabase();
  const collection = db.collection("missionLocaleEffectif");

  const NEW_INDEX_NAME =
    "identifiant_normalise.nom_1_identifiant_normalise.prenom_1_identifiant_normalise.date_de_naissance_1";

  const indexes = await collection.indexes();
  const hasNewIndex = indexes.some((index) => index.name === NEW_INDEX_NAME);

  if (hasNewIndex) {
    await collection.dropIndex(NEW_INDEX_NAME);
  }

  // Recréer l'ancien index non-unique
  await collection.createIndex(
    {
      "identifiant_normalise.nom": 1,
      "identifiant_normalise.prenom": 1,
      "identifiant_normalise.date_de_naissance": 1,
      soft_deleted: 1,
    },
    {}
  );
};
