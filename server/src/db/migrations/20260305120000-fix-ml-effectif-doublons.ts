import { ObjectId } from "mongodb";

import { getDatabase } from "@/common/mongodb";

// Champs utilisateur à fusionner du record supprimé vers le keeper
const MERGEABLE_FIELDS = [
  "situation",
  "situation_autre",
  "commentaires",
  "deja_connu",
  "probleme_type",
  "probleme_detail",
  "organisme_data",
  "whatsapp_contact",
  "whatsapp_callback_requested",
  "whatsapp_callback_requested_at",
  "whatsapp_no_help_responded",
  "whatsapp_no_help_responded_at",
  "deca_feedback",
  "effectif_choice",
] as const;

function normalizeDateToUTCMidnight(date: Date): Date {
  const d = new Date(date);
  if (d.getUTCHours() >= 22) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export const up = async () => {
  const db = getDatabase();
  const collection = db.collection("missionLocaleEffectif");

  // Étape 0 : Supprimer l'ancien index unique (sans mission_locale_id, sans partial filter)
  // qui bloque la renormalisation des dates (deux docs convergent vers la même date après normalisation)
  console.log("Step 0: Dropping old unique index on identifiant_normalise...");
  const OLD_INDEX_NAME =
    "identifiant_normalise.nom_1_identifiant_normalise.prenom_1_identifiant_normalise.date_de_naissance_1";
  try {
    await collection.dropIndex(OLD_INDEX_NAME);
    console.log(`Dropped old index ${OLD_INDEX_NAME}`);
  } catch {
    console.log(`Old index ${OLD_INDEX_NAME} not found, skipping`);
  }

  // Étape 1 : Re-normaliser tous les identifiant_normalise.date_de_naissance
  console.log("Step 1: Re-normalizing identifiant_normalise.date_de_naissance...");
  const BATCH_SIZE = 1000;
  const cursor = collection.find({ "identifiant_normalise.date_de_naissance": { $exists: true } });
  let normalizedCount = 0;
  let batch: {
    updateOne: { filter: { _id: ObjectId }; update: { $set: { "identifiant_normalise.date_de_naissance": Date } } };
  }[] = [];

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;

    const currentDate = doc.identifiant_normalise?.date_de_naissance;
    if (!currentDate) continue;

    const normalized = normalizeDateToUTCMidnight(currentDate);
    if (normalized.getTime() !== new Date(currentDate).getTime()) {
      batch.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { "identifiant_normalise.date_de_naissance": normalized } },
        },
      });
      normalizedCount++;
    }

    if (batch.length >= BATCH_SIZE) {
      await collection.bulkWrite(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await collection.bulkWrite(batch);
  }
  console.log(`Re-normalized ${normalizedCount} date_de_naissance values`);

  // Étape 2 : Identifier les groupes de doublons (même personne, même ML — SANS date_rupture)
  console.log("Step 2: Finding and merging duplicate groups...");
  const duplicateGroups = await collection
    .aggregate<{
      _id: {
        nom: string;
        prenom: string;
        date_de_naissance: Date;
        mission_locale_id: ObjectId;
      };
      count: number;
      doc_ids: ObjectId[];
    }>([
      { $match: { soft_deleted: { $ne: true }, identifiant_normalise: { $ne: null } } },
      {
        $group: {
          _id: {
            nom: "$identifiant_normalise.nom",
            prenom: "$identifiant_normalise.prenom",
            date_de_naissance: "$identifiant_normalise.date_de_naissance",
            mission_locale_id: "$mission_locale_id",
          },
          count: { $sum: 1 },
          doc_ids: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  console.log(`Found ${duplicateGroups.length} duplicate groups`);

  let totalMerged = 0;
  let totalSoftDeleted = 0;

  // Pour chaque groupe, fusionner les données puis soft-delete les doublons
  for (const group of duplicateGroups) {
    const docs = await collection.find({ _id: { $in: group.doc_ids } }).toArray();

    // Trier : source ERP > situation non-null > plus récent
    docs.sort((a: any, b: any) => {
      const aIsErp = a.effectif_snapshot?.source !== "DECA";
      const bIsErp = b.effectif_snapshot?.source !== "DECA";
      if (aIsErp && !bIsErp) return -1;
      if (!aIsErp && bIsErp) return 1;
      if (a.situation && !b.situation) return -1;
      if (!a.situation && b.situation) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const keeper = docs[0];
    const toDelete = docs.slice(1);

    // Fusionner les champs utilisateur des records supprimés vers le keeper
    const mergeUpdate: Record<string, unknown> = {};
    for (const field of MERGEABLE_FIELDS) {
      if (keeper[field] == null) {
        const donor = toDelete.find((d) => d[field] != null);
        if (donor) {
          mergeUpdate[field] = donor[field];
        }
      }
    }

    if (Object.keys(mergeUpdate).length > 0) {
      await collection.updateOne({ _id: keeper._id }, { $set: { ...mergeUpdate, updated_at: new Date() } });
      totalMerged++;
      console.log(
        `Merged fields [${Object.keys(mergeUpdate).join(", ")}] into keeper ${keeper._id} for ${group._id.nom} ${group._id.prenom}`
      );
    }

    const deleteIds = toDelete.map((d) => d._id);
    await collection.updateMany({ _id: { $in: deleteIds } }, { $set: { soft_deleted: true, updated_at: new Date() } });
    totalSoftDeleted += deleteIds.length;
  }

  console.log(`Merged user data into ${totalMerged} keepers`);
  console.log(`Soft-deleted ${totalSoftDeleted} duplicate missionLocaleEffectif records`);

  // Étape 3 : Initialiser soft_deleted: false sur tous les records actifs (nécessaire pour l'index partiel)
  // Bypass validation car certains anciens documents ne passent pas la validation Zod du schéma
  console.log("Step 3: Setting soft_deleted: false on all active records...");
  await db.command({
    collMod: "missionLocaleEffectif",
    validationLevel: "off",
  });
  const activeResult = await collection.updateMany(
    { soft_deleted: { $exists: false } },
    { $set: { soft_deleted: false } }
  );
  await db.command({
    collMod: "missionLocaleEffectif",
    validationLevel: "moderate",
  });
  console.log(`Set soft_deleted: false on ${activeResult.modifiedCount} active records`);

  // Étape 4 : Créer l'index unique partiel (SANS date_rupture)
  // Note: MongoDB ne supporte pas $ne dans les partialFilterExpression, on utilise $eq: false
  console.log("Step 4: Creating unique partial index...");
  try {
    await collection.dropIndex("identifiant_normalise_ml_unique_active");
    console.log("Dropped existing index identifiant_normalise_ml_unique_active");
  } catch {
    // Index might not exist yet
  }
  await collection.createIndex(
    {
      "identifiant_normalise.nom": 1,
      "identifiant_normalise.prenom": 1,
      "identifiant_normalise.date_de_naissance": 1,
      mission_locale_id: 1,
    },
    {
      unique: true,
      name: "identifiant_normalise_ml_unique_active",
      partialFilterExpression: {
        soft_deleted: { $eq: false },
        "identifiant_normalise.nom": { $exists: true },
      },
    }
  );
  console.log("Created unique partial index identifiant_normalise_ml_unique_active");

  // Rapport final
  const totalDocs = await collection.countDocuments();
  const activeDocs = await collection.countDocuments({ soft_deleted: false });
  const softDeletedDocs = await collection.countDocuments({ soft_deleted: true });
  const withIdentifiant = await collection.countDocuments({
    soft_deleted: false,
    "identifiant_normalise.nom": { $exists: true },
  });
  const withSituation = await collection.countDocuments({ soft_deleted: false, situation: { $ne: null } });

  console.log("\n=== RAPPORT MIGRATION ===");
  console.log(`Documents totaux          : ${totalDocs}`);
  console.log(`Documents actifs          : ${activeDocs}`);
  console.log(`Documents soft-deleted    : ${softDeletedDocs}`);
  console.log(`Actifs avec identifiant   : ${withIdentifiant}`);
  console.log(`Actifs avec situation     : ${withSituation}`);
  console.log(`Dates re-normalisées     : ${normalizedCount}`);
  console.log(`Groupes de doublons       : ${duplicateGroups.length}`);
  console.log(`Doublons soft-deleted     : ${totalSoftDeleted}`);
  console.log(`Keepers avec merge        : ${totalMerged}`);
  console.log("=========================\n");
};
