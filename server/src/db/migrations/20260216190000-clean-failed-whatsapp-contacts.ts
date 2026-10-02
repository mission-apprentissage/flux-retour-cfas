import logger from "@/common/logger";
import { getDatabase } from "@/common/mongodb";

export const up = async () => {
  const db = getDatabase();
  const collection = db.collection("missionLocaleEffectif");

  const failedResult = await collection.updateMany(
    { "whatsapp_contact.message_status": "failed" },
    { $unset: { whatsapp_contact: "" } }
  );
  logger.info({ modifiedCount: failedResult.modifiedCount }, "[Migration] Contacts whatsapp en échec nettoyés");

  const callbackAfterNoHelpResult = await collection.updateMany(
    {
      whatsapp_callback_requested: true,
      whatsapp_no_help_responded: true,
      "whatsapp_contact.conversation_state": "callback_requested",
    },
    {
      $set: {
        situation: "CONTACTE_SANS_RETOUR",
        a_traiter: false,
        injoignable: true,
        updated_at: new Date(),
      },
      $unset: {
        whatsapp_no_help_responded: "",
        whatsapp_no_help_responded_at: "",
      },
    }
  );
  logger.info(
    { modifiedCount: callbackAfterNoHelpResult.modifiedCount },
    "[Migration] Effectifs corrigés : callback après no_help"
  );

  const noHelpAfterCallbackResult = await collection.updateMany(
    {
      whatsapp_callback_requested: true,
      whatsapp_no_help_responded: true,
      "whatsapp_contact.conversation_state": "closed",
    },
    {
      $set: {
        situation: "NE_SOUHAITE_PAS_ETRE_RECONTACTE",
        a_traiter: false,
        injoignable: false,
        updated_at: new Date(),
      },
      $unset: {
        whatsapp_callback_requested: "",
        whatsapp_callback_requested_at: "",
      },
    }
  );
  logger.info(
    { modifiedCount: noHelpAfterCallbackResult.modifiedCount },
    "[Migration] Effectifs corrigés : no_help après callback"
  );
};
