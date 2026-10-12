import logger from "@/common/logger";
import { getDatabase } from "@/common/mongodb";

export const up = async () => {
  const db = getDatabase();
  const collection = db.collection("missionLocaleEffectif");

  // Étape 0 — Normaliser soft_deleted : certains docs actifs n'ont pas le champ
  // (cf. `$unset: { soft_deleted: "" }` dans mission-locale.actions.ts). L'index partiel
  // de l'étape 5 utiliserait `$eq: false` qui ne match pas l'absence — backfill nécessaire.
  logger.info("[Migration] Étape 0 : normalisation de soft_deleted sur les docs sans le champ");
  await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" });
  const softDeletedRes = await collection.updateMany(
    { soft_deleted: { $exists: false } },
    { $set: { soft_deleted: false } }
  );
  await db.command({ collMod: "missionLocaleEffectif", validationLevel: "moderate" });
  logger.info({ modifiedCount: softDeletedRes.modifiedCount }, "[Migration] soft_deleted initialisé à false");

  // Étape 1 — Backfill template_type='injoignables' + sent_via='backfill' sur le legacy.
  // (1) Route les réponses entrantes vers le handler legacy via parseUserResponse contextuel.
  // (2) sent_via='backfill' garantit qu'aucune notif individuelle ML n'est envoyée pour les
  //     réponses tardives sur les anciens envois (cohérent avec le mode CLI manuel).
  logger.info("[Migration] Étape 1 : backfill template_type=injoignables + sent_via=backfill sur le legacy");
  const templateRes = await collection.updateMany(
    {
      whatsapp_contact: { $exists: true },
      "whatsapp_contact.template_type": { $exists: false },
    },
    {
      $set: {
        "whatsapp_contact.template_type": "injoignables",
        "whatsapp_contact.sent_via": "backfill",
      },
    }
  );
  logger.info({ modifiedCount: templateRes.modifiedCount }, "[Migration] Docs whatsapp_contact legacy taggés");

  // Étape 2 — Backfill souhaite_rdv=true depuis whatsapp_callback_requested
  // Exclut les effectifs liés à un CFA V2 (is_allowed_collab=true) et les soft-deleted.
  logger.info("[Migration] Étape 2 : backfill de souhaite_rdv depuis whatsapp_callback_requested");
  const souhaiteRdvRes = await collection.updateMany(
    {
      whatsapp_callback_requested: true,
      "computed.organisme.is_allowed_collab": { $ne: true },
      soft_deleted: { $ne: true },
    },
    [
      {
        $set: {
          souhaite_rdv: true,
          souhaite_rdv_source: "whatsapp_callback",
          souhaite_rdv_at: { $ifNull: ["$whatsapp_callback_requested_at", "$updated_at"] },
          updated_at: "$$NOW",
        },
      },
    ]
  );
  logger.info({ modifiedCount: souhaiteRdvRes.modifiedCount }, "[Migration] souhaite_rdv=true backfillé");

  // Étape 3 — Index partiel souhaite_rdv (utilisé par GET /banner-stats et le filtre prioritaire)
  logger.info("[Migration] Étape 3 : création de l'index partiel souhaite_rdv_by_ml_partial");
  await collection.createIndex(
    { souhaite_rdv: 1, mission_locale_id: 1 },
    {
      name: "souhaite_rdv_by_ml_partial",
      partialFilterExpression: { souhaite_rdv: true },
    }
  );

  // Étape 3bis — Index sparse rdv_redirect_token (route GET /r/:token doit faire un lookup O(log n))
  logger.info("[Migration] Étape 3bis : création de l'index sparse rdv_redirect_token_sparse");
  await collection.createIndex(
    { "whatsapp_contact.rdv_redirect_token": 1 },
    { name: "rdv_redirect_token_sparse", sparse: true }
  );

  // Rapport final
  const totalSouhaiteRdv = await collection.countDocuments({ souhaite_rdv: true });
  const totalPrequalifReady = await collection.countDocuments({
    "whatsapp_contact.template_type": "injoignables",
    "whatsapp_contact.sent_via": "backfill",
  });
  logger.info(
    {
      softDeletedBackfilled: softDeletedRes.modifiedCount,
      whatsappContactTaggedLegacy: templateRes.modifiedCount,
      souhaiteRdvBackfilled: souhaiteRdvRes.modifiedCount,
      totalSouhaiteRdv,
      totalLegacyTagged: totalPrequalifReady,
    },
    "[Migration] Rapport final add-souhaite-rdv"
  );
};
