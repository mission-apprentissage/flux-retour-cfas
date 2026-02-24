import { strict as assert } from "assert";

import { ObjectId } from "mongodb";
import { IMissionLocaleEffectif, SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { USER_RESPONSE_TYPE, CONVERSATION_STATE } from "shared/models/data/whatsappContact.model";
import { it, describe, beforeEach, vi, expect } from "vitest";

import {
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import {
  normalizePhoneNumber,
  parseUserResponse,
  isStopMessage,
  buildAutoReplyMessage,
  buildCallbackMessage,
  buildNoHelpMessage,
  buildStopConfirmationMessage,
  isEligibleForWhatsApp,
  notifyMLUserOnCallback,
  notifyMLUserOnNoHelp,
  handleInboundWhatsAppMessage,
  extractUserResponseText,
  updateMessageStatus,
  triggerWhatsAppIfEligible,
  sendWhatsAppMessage,
} from "@/common/services/brevo/whatsapp";
import { sendEmail } from "@/common/services/mailer/mailer";
import { useMongo } from "@tests/jest/setupMongo";

vi.mock("@/common/services/mailer/mailer");

// Mock brevoApi pour les appels HTTP Brevo (sendWhatsAppMessage, sendWhatsAppTemplate, upsertBrevoContact)
vi.mock("@/common/services/brevo/whatsapp/brevoApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/common/services/brevo/whatsapp/brevoApi")>();
  return {
    ...actual,
    sendWhatsAppMessage: vi.fn().mockResolvedValue({ success: true, messageId: "mock-msg-id" }),
    sendWhatsAppTemplate: vi.fn().mockResolvedValue({ success: true, messageId: "mock-template-id" }),
    upsertBrevoContact: vi.fn().mockResolvedValue(undefined),
  };
});

describe("WhatsApp Service", () => {
  describe("normalizePhoneNumber", () => {
    it("normalise un numéro français au format E.164", () => {
      assert.strictEqual(normalizePhoneNumber("0612345678"), "+33612345678");
      assert.strictEqual(normalizePhoneNumber("06 12 34 56 78"), "+33612345678");
      assert.strictEqual(normalizePhoneNumber("+33612345678"), "+33612345678");
      assert.strictEqual(normalizePhoneNumber("33612345678"), "+33612345678");
    });

    it("normalise un numéro DOM-TOM", () => {
      // Guadeloupe
      assert.strictEqual(normalizePhoneNumber("0690123456"), "+590690123456");
      // Martinique
      assert.strictEqual(normalizePhoneNumber("0696123456"), "+596696123456");
      // Réunion
      assert.strictEqual(normalizePhoneNumber("0692123456"), "+262692123456");
    });

    it("retourne null pour un numéro invalide", () => {
      assert.strictEqual(normalizePhoneNumber(null), null);
      assert.strictEqual(normalizePhoneNumber(undefined), null);
      assert.strictEqual(normalizePhoneNumber(""), null);
      assert.strictEqual(normalizePhoneNumber("123"), null);
      assert.strictEqual(normalizePhoneNumber("invalid"), null);
    });
  });

  describe("parseUserResponse", () => {
    it("détecte le bouton callback WhatsApp (exact)", () => {
      assert.strictEqual(parseUserResponse("Je veux être recontacté·e"), USER_RESPONSE_TYPE.CALLBACK);
      assert.strictEqual(parseUserResponse("je veux être recontacté·e"), USER_RESPONSE_TYPE.CALLBACK);
      assert.strictEqual(parseUserResponse("Je veux être recontacté"), USER_RESPONSE_TYPE.CALLBACK);
      assert.strictEqual(parseUserResponse("Je veux être recontactée"), USER_RESPONSE_TYPE.CALLBACK);
      assert.strictEqual(parseUserResponse("Je veux etre recontacte"), USER_RESPONSE_TYPE.CALLBACK);
    });

    it("détecte les réponses manuelles callback", () => {
      assert.strictEqual(parseUserResponse("1"), USER_RESPONSE_TYPE.CALLBACK);
      assert.strictEqual(parseUserResponse("📞"), USER_RESPONSE_TYPE.CALLBACK);
      assert.strictEqual(parseUserResponse("oui"), USER_RESPONSE_TYPE.CALLBACK);
    });

    it("détecte le bouton no_help WhatsApp (exact)", () => {
      assert.strictEqual(parseUserResponse("Je ne veux pas d'aide"), USER_RESPONSE_TYPE.NO_HELP);
      assert.strictEqual(parseUserResponse("je ne veux pas d'aide"), USER_RESPONSE_TYPE.NO_HELP);
      assert.strictEqual(parseUserResponse("Je ne veux pas d\u2019aide"), USER_RESPONSE_TYPE.NO_HELP);
    });

    it("détecte les réponses manuelles no_help", () => {
      assert.strictEqual(parseUserResponse("non"), USER_RESPONSE_TYPE.NO_HELP);
      assert.strictEqual(parseUserResponse("❌"), USER_RESPONSE_TYPE.NO_HELP);
      assert.strictEqual(parseUserResponse("2"), USER_RESPONSE_TYPE.NO_HELP);
    });

    it("retourne null pour un message non reconnu (plus de faux positifs)", () => {
      assert.strictEqual(parseUserResponse("bonjour"), null);
      assert.strictEqual(parseUserResponse("quelle heure"), null);
      assert.strictEqual(parseUserResponse("???"), null);
      assert.strictEqual(parseUserResponse("rappel svp"), null);
      assert.strictEqual(parseUserResponse("je veux être rappelé"), null);
      assert.strictEqual(parseUserResponse("pas intéressé"), null);
    });
  });

  describe("isStopMessage", () => {
    it("détecte les messages STOP", () => {
      assert.strictEqual(isStopMessage("STOP"), true);
      assert.strictEqual(isStopMessage("stop"), true);
      assert.strictEqual(isStopMessage("Stop"), true);
      assert.strictEqual(isStopMessage("  STOP  "), true);
      assert.strictEqual(isStopMessage("ARRET"), true);
      assert.strictEqual(isStopMessage("ARRÊT"), true);
    });

    it("ne détecte pas les messages non-STOP", () => {
      assert.strictEqual(isStopMessage("stopper"), false);
      assert.strictEqual(isStopMessage("arrêtez"), false);
      assert.strictEqual(isStopMessage("non"), false);
      assert.strictEqual(isStopMessage(""), false);
    });
  });

  describe("buildCallbackMessage", () => {
    it("construit le message de confirmation de rappel", () => {
      const message = buildCallbackMessage("Jean", { nom: "ML Paris" });

      assert.strictEqual(
        message,
        "Super *Jean*, un conseiller ou une conseillère de la *Mission locale ML Paris* devrait vous recontacter."
      );
    });
  });

  describe("buildNoHelpMessage", () => {
    it("construit le message de refus d'aide", () => {
      const message = buildNoHelpMessage("Jean", { nom: "ML Paris" });

      assert.strictEqual(
        message,
        "C'est noté *Jean*. La *Mission locale ML Paris* ne reprendra pas contact avec vous."
      );
    });
  });

  describe("buildStopConfirmationMessage", () => {
    it("construit le message de confirmation STOP", () => {
      const message = buildStopConfirmationMessage();

      assert.ok(message.includes("prise en compte"));
      assert.ok(message.includes("plus de messages"));
    });
  });

  describe("buildAutoReplyMessage", () => {
    it("construit le message avec toutes les coordonnées", () => {
      const message = buildAutoReplyMessage({
        nom: "ML Paris",
        telephone: "01 23 45 67 89",
        site_web: "https://www.ml-paris.fr",
        adresse: "Paris",
      });

      expect(message).toContain("Mission apprentissage");
      expect(message).toContain("https://beta.gouv.fr/incubateurs/mission-apprentissage.html");
      expect(message).toContain("Mission Locale *ML Paris*");
      expect(message).toContain("à Paris");
      expect(message).toContain("les appeler directement au 01 23 45 67 89");
      expect(message).toContain("aller sur leur site web https://www.ml-paris.fr");
    });

    it("construit le message avec téléphone seul", () => {
      const message = buildAutoReplyMessage({
        nom: "ML Paris",
        telephone: "01 23 45 67 89",
      });

      expect(message).toContain("les appeler directement au 01 23 45 67 89");
      expect(message).not.toContain("site web");
    });

    it("construit le message avec site web seul", () => {
      const message = buildAutoReplyMessage({
        nom: "ML Paris",
        site_web: "https://www.ml-paris.fr",
      });

      expect(message).toContain("aller sur leur site web https://www.ml-paris.fr");
      expect(message).not.toContain("appeler");
    });

    it("omet les coordonnées manquantes", () => {
      const message = buildAutoReplyMessage({ nom: "ML Paris" });

      expect(message).toContain("Mission Locale *ML Paris*");
      expect(message).not.toContain("appeler");
      expect(message).not.toContain("site web");
    });
  });

  describe("isEligibleForWhatsApp", () => {
    const baseEffectif: Partial<IMissionLocaleEffectif> = {
      _id: new ObjectId(),
      mission_locale_id: new ObjectId(),
      effectif_id: new ObjectId(),
      created_at: new Date(),
      brevo: {},
      current_status: {},
      effectif_snapshot: {
        _id: new ObjectId(),
        organisme_id: new ObjectId(),
        id_erp_apprenant: "123",
        source: "test",
        annee_scolaire: "2024-2025",
        apprenant: {
          nom: "Dupont",
          prenom: "Jean",
          telephone: "0612345678",
        },
        formation: {},
        is_lock: false,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    };

    it("retourne true pour un effectif éligible", () => {
      const effectif = { ...baseEffectif } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForWhatsApp(effectif), true);
    });

    it("retourne false si pas de téléphone", () => {
      const effectif = {
        ...baseEffectif,
        effectif_snapshot: {
          ...baseEffectif.effectif_snapshot,
          apprenant: {
            nom: "Dupont",
            prenom: "Jean",
            telephone: null,
          },
        },
      } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForWhatsApp(effectif), false);
    });

    it("retourne false si déjà contacté par WhatsApp", () => {
      const effectif = {
        ...baseEffectif,
        whatsapp_contact: {
          phone_normalized: "+33612345678",
          last_message_sent_at: new Date(),
          opted_out: false,
        },
      } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForWhatsApp(effectif), false);
    });

    it("retourne false si opt-out", () => {
      const effectif = {
        ...baseEffectif,
        whatsapp_contact: {
          phone_normalized: "+33612345678",
          opted_out: true,
        },
      } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForWhatsApp(effectif), false);
    });
  });

  describe("notifyMLUserOnNoHelp (integration)", () => {
    useMongo();

    const effectifId = new ObjectId();
    const missionLocaleId = new ObjectId();
    const userId = new ObjectId();

    const mockEffectif: IMissionLocaleEffectif = {
      _id: effectifId,
      mission_locale_id: missionLocaleId,
      effectif_id: new ObjectId(),
      created_at: new Date(),
      brevo: {},
      current_status: {},
      effectif_snapshot: {
        _id: new ObjectId(),
        organisme_id: new ObjectId(),
        id_erp_apprenant: "123",
        source: "test",
        annee_scolaire: "2024-2025",
        apprenant: { nom: "Dupont", prenom: "Jean", telephone: "0612345678" },
        formation: {},
        is_lock: false,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    } as IMissionLocaleEffectif;

    beforeEach(async () => {
      vi.mocked(sendEmail).mockClear();
      await missionLocaleEffectifsLogDb().deleteMany({});
      await usersMigrationDb().deleteMany({});
    });

    it("envoie un email avec le template whatsapp_nohelp_notification", async () => {
      await missionLocaleEffectifsLogDb().insertOne({
        _id: new ObjectId(),
        mission_locale_effectif_id: effectifId,
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        created_at: new Date(),
        created_by: userId,
        read_by: [],
      } as any);

      await usersMigrationDb().insertOne({
        _id: userId,
        email: "conseiller@ml.fr",
        nom: "Martin",
        prenom: "Sophie",
        civility: "Madame",
        password: "hashedpassword",
        account_status: "CONFIRMED",
        organisation_id: missionLocaleId,
        created_at: new Date(),
      } as any);

      await notifyMLUserOnNoHelp(mockEffectif);

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        "conseiller@ml.fr",
        "whatsapp_nohelp_notification",
        expect.objectContaining({
          recipient: { nom: "Martin", prenom: "Sophie" },
          effectif: { prenom: "Jean", nom: "Dupont" },
        }),
        { noreply: true }
      );
    });

    it("n'envoie pas d'email si aucun log ML trouvé", async () => {
      await notifyMLUserOnNoHelp(mockEffectif);
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("handleInboundWhatsAppMessage (integration)", () => {
    useMongo();

    const effectifId = new ObjectId();
    const missionLocaleId = new ObjectId();
    const userId = new ObjectId();

    beforeEach(async () => {
      vi.mocked(sendEmail).mockClear();
      // Désactiver la validation de schéma pour les tests avec des fixtures minimales
      const db = getDatabase();
      await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
      await db.command({ collMod: "organisations", validationLevel: "off" }).catch(() => {});
      await db.command({ collMod: "missionLocaleEffectifsLog", validationLevel: "off" }).catch(() => {});
      await db.command({ collMod: "usersMigration", validationLevel: "off" }).catch(() => {});
      await missionLocaleEffectifsDb().deleteMany({});
      await missionLocaleEffectifsLogDb().deleteMany({});
      await organisationsDb().deleteMany({});
      await usersMigrationDb().deleteMany({});

      // Créer l'organisation Mission Locale
      await organisationsDb().insertOne(
        {
          _id: missionLocaleId,
          type: "MISSION_LOCALE",
          nom: "ML Test",
          telephone: "01 23 45 67 89",
          email: "contact@ml-test.fr",
          site_web: "https://www.ml-test.fr",
          adresse: { commune: "Paris" },
          created_at: new Date(),
        } as any,
        { bypassDocumentValidation: true }
      );

      // Créer l'effectif avec whatsapp_contact
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: effectifId,
          mission_locale_id: missionLocaleId,
          effectif_id: new ObjectId(),
          created_at: new Date(),
          brevo: {},
          current_status: {},
          a_traiter: true,
          injoignable: true,
          effectif_snapshot: {
            _id: new ObjectId(),
            organisme_id: new ObjectId(),
            id_erp_apprenant: "123",
            source: "test",
            annee_scolaire: "2024-2025",
            apprenant: { nom: "Dupont", prenom: "Jean", telephone: "0612345678" },
            formation: {},
            is_lock: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
          whatsapp_contact: {
            phone_normalized: "+33612345678",
            last_message_sent_at: new Date("2024-06-01"),
            message_status: "delivered",
            conversation_state: CONVERSATION_STATE.INITIAL_SENT,
            brevo_visitor_id: "visitor-123",
            opted_out: false,
            messages_history: [
              {
                direction: "outbound",
                content: "Template message",
                sent_at: new Date("2024-06-01"),
                brevo_message_id: "initial-msg-id",
              },
            ],
          },
        } as any,
        { bypassDocumentValidation: true }
      );

      // Créer un log ML (pour les notifications)
      await missionLocaleEffectifsLogDb().insertOne(
        {
          _id: new ObjectId(),
          mission_locale_effectif_id: effectifId,
          situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
          created_at: new Date(),
          created_by: userId,
          read_by: [],
        } as any,
        { bypassDocumentValidation: true }
      );

      // Créer l'utilisateur ML
      await usersMigrationDb().insertOne(
        {
          _id: userId,
          email: "conseiller@ml.fr",
          nom: "Martin",
          prenom: "Sophie",
          civility: "Madame",
          password: "hashedpassword",
          account_status: "CONFIRMED",
          organisation_id: missionLocaleId,
          created_at: new Date(),
        } as any,
        { bypassDocumentValidation: true }
      );
    });

    it("ne traite pas un numéro inconnu", async () => {
      await handleInboundWhatsAppMessage("+33699999999", "oui", "msg-1");
      // Pas de changement en DB
      const effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_contact?.user_response).toBeUndefined();
    });

    it("stocke user_response_raw pour un message non reconnu", async () => {
      await handleInboundWhatsAppMessage("+33612345678", "bonjour", "msg-unknown");

      const effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_contact?.user_response_raw).toBe("bonjour");
      expect(effectif?.whatsapp_contact?.user_response).toBeUndefined();
      expect(effectif?.whatsapp_contact?.conversation_state).toBe(CONVERSATION_STATE.USER_RESPONDED);
    });

    it("envoie l'auto-reply avec coordonnées ML pour un message non reconnu", async () => {
      await handleInboundWhatsAppMessage("+33612345678", "bonjour", "msg-auto-1", "visitor-123");

      const effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_contact?.auto_reply_sent).toBe(true);
      expect(effectif?.whatsapp_contact?.auto_reply_sent_at).toBeInstanceOf(Date);

      const autoReplyMsg = effectif?.whatsapp_contact?.messages_history?.find(
        (m: any) => m.direction === "outbound" && m.content.includes("Mission apprentissage")
      );
      expect(autoReplyMsg).toBeDefined();
      expect(autoReplyMsg?.content).toContain("ML Test");
      expect(autoReplyMsg?.content).toContain("01 23 45 67 89");
      expect(autoReplyMsg?.content).toContain("https://www.ml-test.fr");
    });

    it("n'envoie PAS l'auto-reply au deuxième message non reconnu", async () => {
      // Premier message : auto-reply envoyé
      await handleInboundWhatsAppMessage("+33612345678", "bonjour", "msg-first", "visitor-123");

      const afterFirst = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      const autoReplyCountFirst = afterFirst?.whatsapp_contact?.messages_history?.filter(
        (m: any) => m.direction === "outbound" && m.content.includes("Mission apprentissage")
      ).length;
      expect(autoReplyCountFirst).toBe(1);

      // Deuxième message : pas d'auto-reply
      await handleInboundWhatsAppMessage("+33612345678", "allo", "msg-second", "visitor-123");

      const afterSecond = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      const autoReplyCountSecond = afterSecond?.whatsapp_contact?.messages_history?.filter(
        (m: any) => m.direction === "outbound" && m.content.includes("Mission apprentissage")
      ).length;
      expect(autoReplyCountSecond).toBe(1);
    });

    it("n'envoie PAS l'auto-reply pour une réponse callback (1)", async () => {
      await handleInboundWhatsAppMessage("+33612345678", "1", "msg-callback-auto", "visitor-123");

      const effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_contact?.auto_reply_sent).not.toBe(true);
      expect(effectif?.whatsapp_contact?.user_response).toBe("callback");
    });

    it("n'envoie PAS l'auto-reply pour STOP", async () => {
      await handleInboundWhatsAppMessage("+33612345678", "STOP", "msg-stop-auto", "visitor-123");

      const effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_contact?.auto_reply_sent).not.toBe(true);
      expect(effectif?.whatsapp_contact?.opted_out).toBe(true);
    });

    it("rollback auto_reply_sent si l'envoi échoue, et retry au message suivant", async () => {
      // Premier message : envoi échoue → rollback
      vi.mocked(sendWhatsAppMessage).mockResolvedValueOnce({ success: false, error: "API error" });
      await handleInboundWhatsAppMessage("+33612345678", "bonjour", "msg-fail", "visitor-123");

      const afterFail = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(afterFail?.whatsapp_contact?.auto_reply_sent).toBe(false);
      const autoReplyAfterFail = afterFail?.whatsapp_contact?.messages_history?.filter(
        (m: any) => m.direction === "outbound" && m.content.includes("Mission apprentissage")
      );
      expect(autoReplyAfterFail?.length ?? 0).toBe(0);

      // Deuxième message : envoi réussit → auto-reply envoyé
      vi.mocked(sendWhatsAppMessage).mockResolvedValueOnce({ success: true, messageId: "mock-retry-id" });
      await handleInboundWhatsAppMessage("+33612345678", "allo", "msg-retry", "visitor-123");

      const afterRetry = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(afterRetry?.whatsapp_contact?.auto_reply_sent).toBe(true);
      const autoReplyAfterRetry = afterRetry?.whatsapp_contact?.messages_history?.filter(
        (m: any) => m.direction === "outbound" && m.content.includes("Mission apprentissage")
      );
      expect(autoReplyAfterRetry?.length).toBe(1);
    });

    it("déduplique les messages avec le même brevoMessageId", async () => {
      await handleInboundWhatsAppMessage("+33612345678", "bonjour", "msg-dedup");
      // Deuxième appel avec le même ID
      await handleInboundWhatsAppMessage("+33612345678", "bonjour", "msg-dedup");

      const effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      // L'historique ne doit contenir qu'une seule entrée inbound avec ce message ID
      const inboundMessages = effectif?.whatsapp_contact?.messages_history?.filter(
        (m: any) => m.direction === "inbound" && m.brevo_message_id === "msg-dedup"
      );
      expect(inboundMessages?.length).toBe(1);
    });

    it("gère un message STOP : opt-out + conversation fermée", async () => {
      await handleInboundWhatsAppMessage("+33612345678", "STOP", "msg-stop", "visitor-123");

      const effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_contact?.opted_out).toBe(true);
      expect(effectif?.whatsapp_contact?.conversation_state).toBe(CONVERSATION_STATE.CLOSED);
      expect((effectif as any)?.a_traiter).toBe(false);
      expect((effectif as any)?.injoignable).toBe(false);
    });

    it("gère une réponse callback (1) : marque callback_requested + notification + reset situation", async () => {
      await handleInboundWhatsAppMessage("+33612345678", "1", "msg-callback", "visitor-123");

      const effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_contact?.user_response).toBe("callback");
      expect(effectif?.whatsapp_contact?.conversation_state).toBe(CONVERSATION_STATE.CALLBACK_REQUESTED);
      expect(effectif?.whatsapp_callback_requested).toBe(true);
      expect(effectif?.situation).toBe(SITUATION_ENUM.CONTACTE_SANS_RETOUR);
      expect((effectif as any)?.a_traiter).toBe(false);
      expect((effectif as any)?.injoignable).toBe(true);
      expect(effectif?.whatsapp_no_help_responded).toBeUndefined();
      expect(sendEmail).toHaveBeenCalledWith(
        "conseiller@ml.fr",
        "whatsapp_callback_notification",
        expect.anything(),
        expect.anything()
      );
    });

    it("gère une réponse no_help (2) : situation NE_SOUHAITE_PAS + notification + cleanup callback flags", async () => {
      await handleInboundWhatsAppMessage("+33612345678", "2", "msg-nohelp", "visitor-123");

      const effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_contact?.user_response).toBe("no_help");
      expect(effectif?.whatsapp_contact?.conversation_state).toBe(CONVERSATION_STATE.CLOSED);
      expect(effectif?.situation).toBe(SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE);
      expect((effectif as any)?.a_traiter).toBe(false);
      expect(effectif?.whatsapp_no_help_responded).toBe(true);
      expect(effectif?.whatsapp_callback_requested).toBeUndefined();

      // Vérifie qu'un log a été créé
      const logs = await missionLocaleEffectifsLogDb().find({ mission_locale_effectif_id: effectifId }).toArray();
      const noHelpLog = logs.find((l: any) => l.situation === SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE);
      expect(noHelpLog).toBeDefined();
      expect(noHelpLog?.created_by).toBeNull();

      expect(sendEmail).toHaveBeenCalledWith(
        "conseiller@ml.fr",
        "whatsapp_nohelp_notification",
        expect.anything(),
        expect.anything()
      );
    });

    it("changement d'avis : no_help puis callback remet situation CONTACTE_SANS_RETOUR", async () => {
      // D'abord no_help
      await handleInboundWhatsAppMessage("+33612345678", "2", "msg-nohelp", "visitor-123");

      let effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.situation).toBe(SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE);
      expect(effectif?.whatsapp_no_help_responded).toBe(true);
      expect((effectif as any)?.a_traiter).toBe(false);

      vi.mocked(sendEmail).mockClear();

      // Puis callback (changement d'avis)
      await handleInboundWhatsAppMessage("+33612345678", "1", "msg-callback", "visitor-123");

      effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_contact?.user_response).toBe("callback");
      expect(effectif?.whatsapp_contact?.conversation_state).toBe(CONVERSATION_STATE.CALLBACK_REQUESTED);
      expect(effectif?.situation).toBe(SITUATION_ENUM.CONTACTE_SANS_RETOUR);
      expect((effectif as any)?.a_traiter).toBe(false);
      expect((effectif as any)?.injoignable).toBe(true);
      expect(effectif?.whatsapp_callback_requested).toBe(true);
      expect(effectif?.whatsapp_no_help_responded).toBeUndefined();
      expect(sendEmail).toHaveBeenCalledWith(
        "conseiller@ml.fr",
        "whatsapp_callback_notification",
        expect.anything(),
        expect.anything()
      );
    });

    it("changement d'avis : callback puis no_help remet situation NE_SOUHAITE_PAS", async () => {
      // D'abord callback
      await handleInboundWhatsAppMessage("+33612345678", "1", "msg-callback", "visitor-123");

      let effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_callback_requested).toBe(true);
      expect((effectif as any)?.injoignable).toBe(true);

      vi.mocked(sendEmail).mockClear();

      // Puis no_help (changement d'avis)
      await handleInboundWhatsAppMessage("+33612345678", "2", "msg-nohelp", "visitor-123");

      effectif = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(effectif?.whatsapp_contact?.user_response).toBe("no_help");
      expect(effectif?.whatsapp_contact?.conversation_state).toBe(CONVERSATION_STATE.CLOSED);
      expect(effectif?.situation).toBe(SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE);
      expect((effectif as any)?.a_traiter).toBe(false);
      expect((effectif as any)?.injoignable).toBe(false);
      expect(effectif?.whatsapp_no_help_responded).toBe(true);
      expect(effectif?.whatsapp_callback_requested).toBeUndefined();
      expect(sendEmail).toHaveBeenCalledWith(
        "conseiller@ml.fr",
        "whatsapp_nohelp_notification",
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe("notifyMLUserOnCallback (integration)", () => {
    useMongo();

    const effectifId = new ObjectId();
    const missionLocaleId = new ObjectId();
    const userId = new ObjectId();

    const mockEffectif: IMissionLocaleEffectif = {
      _id: effectifId,
      mission_locale_id: missionLocaleId,
      effectif_id: new ObjectId(),
      created_at: new Date(),
      brevo: {},
      current_status: {},
      effectif_snapshot: {
        _id: new ObjectId(),
        organisme_id: new ObjectId(),
        id_erp_apprenant: "123",
        source: "test",
        annee_scolaire: "2024-2025",
        apprenant: {
          nom: "Dupont",
          prenom: "Jean",
          telephone: "0612345678",
        },
        formation: {},
        is_lock: false,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    } as IMissionLocaleEffectif;

    beforeEach(async () => {
      vi.mocked(sendEmail).mockClear();
      await missionLocaleEffectifsLogDb().deleteMany({});
      await usersMigrationDb().deleteMany({});
    });

    it("envoie un email à l'utilisateur ML qui a traité le dossier", async () => {
      // Créer le log ML
      await missionLocaleEffectifsLogDb().insertOne({
        _id: new ObjectId(),
        mission_locale_effectif_id: effectifId,
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        created_at: new Date(),
        created_by: userId,
        read_by: [],
      } as any);

      // Créer l'utilisateur ML
      await usersMigrationDb().insertOne({
        _id: userId,
        email: "conseiller@ml.fr",
        nom: "Martin",
        prenom: "Sophie",
        civility: "Madame",
        password: "hashedpassword",
        account_status: "CONFIRMED",
        organisation_id: missionLocaleId,
        created_at: new Date(),
      } as any);

      await notifyMLUserOnCallback(mockEffectif);

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        "conseiller@ml.fr",
        "whatsapp_callback_notification",
        expect.objectContaining({
          recipient: { nom: "Martin", prenom: "Sophie" },
          effectif: { prenom: "Jean", nom: "Dupont" },
        }),
        { noreply: true }
      );
    });

    it("n'envoie pas d'email si aucun log ML trouvé", async () => {
      await notifyMLUserOnCallback(mockEffectif);

      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("n'envoie pas d'email si le log n'a pas de created_by", async () => {
      await missionLocaleEffectifsLogDb().insertOne({
        _id: new ObjectId(),
        mission_locale_effectif_id: effectifId,
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        created_at: new Date(),
        created_by: null,
        read_by: [],
      } as any);

      await notifyMLUserOnCallback(mockEffectif);

      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("n'envoie pas d'email si l'utilisateur ML n'existe pas", async () => {
      await missionLocaleEffectifsLogDb().insertOne({
        _id: new ObjectId(),
        mission_locale_effectif_id: effectifId,
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        created_at: new Date(),
        created_by: userId,
        read_by: [],
      } as any);

      // Pas d'utilisateur créé

      await notifyMLUserOnCallback(mockEffectif);

      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("utilise le log le plus récent si plusieurs logs existent", async () => {
      const oldUserId = new ObjectId();
      const newUserId = new ObjectId();

      // Log ancien
      await missionLocaleEffectifsLogDb().insertOne({
        _id: new ObjectId(),
        mission_locale_effectif_id: effectifId,
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        created_at: new Date("2024-01-01"),
        created_by: oldUserId,
        read_by: [],
      } as any);

      // Log récent
      await missionLocaleEffectifsLogDb().insertOne({
        _id: new ObjectId(),
        mission_locale_effectif_id: effectifId,
        situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
        created_at: new Date("2024-06-01"),
        created_by: newUserId,
        read_by: [],
      } as any);

      // Créer les deux utilisateurs
      await usersMigrationDb().insertMany([
        {
          _id: oldUserId,
          email: "old@ml.fr",
          nom: "Ancien",
          prenom: "User",
          civility: "Monsieur",
          password: "hashedpassword",
          account_status: "CONFIRMED",
          organisation_id: missionLocaleId,
          created_at: new Date(),
        },
        {
          _id: newUserId,
          email: "new@ml.fr",
          nom: "Nouveau",
          prenom: "User",
          civility: "Monsieur",
          password: "hashedpassword",
          account_status: "CONFIRMED",
          organisation_id: missionLocaleId,
          created_at: new Date(),
        },
      ] as any[]);

      await notifyMLUserOnCallback(mockEffectif);

      expect(sendEmail).toHaveBeenCalledWith(
        "new@ml.fr",
        "whatsapp_callback_notification",
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe("extractUserResponseText", () => {
    it("extrait le texte après les lignes quotées", () => {
      const raw = "> *template_name*\n> Template WhatsApp n°1\nJe veux être recontacté·e";
      assert.strictEqual(extractUserResponseText(raw), "Je veux être recontacté·e");
    });

    it("retourne le texte brut si pas de quotes", () => {
      assert.strictEqual(extractUserResponseText("bonjour"), "bonjour");
    });

    it("retourne une chaîne vide si toutes les lignes sont quotées", () => {
      const raw = "> ligne 1\n> ligne 2";
      assert.strictEqual(extractUserResponseText(raw), "");
    });

    it("gère les lignes mixtes (quotes + texte)", () => {
      const raw = "> citation\nréponse\n> autre citation\nfin";
      assert.strictEqual(extractUserResponseText(raw), "réponse\nfin");
    });

    it("trim les espaces autour du résultat", () => {
      const raw = "> quote\n  réponse  \n";
      assert.strictEqual(extractUserResponseText(raw), "réponse");
    });
  });

  describe("updateMessageStatus (integration)", () => {
    useMongo();

    beforeEach(async () => {
      await getDatabase()
        .command({ collMod: "missionLocaleEffectif", validationLevel: "off" })
        .catch(() => {});
      await missionLocaleEffectifsDb().deleteMany({});
    });

    it("met à jour le statut d'un message existant", async () => {
      const effectifId = new ObjectId();
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: effectifId,
          mission_locale_id: new ObjectId(),
          effectif_id: new ObjectId(),
          created_at: new Date(),
          brevo: {},
          current_status: {},
          effectif_snapshot: {} as any,
          whatsapp_contact: {
            phone_normalized: "+33612345678",
            message_id: "brevo-msg-123",
            message_status: "sent",
            last_message_sent_at: new Date(),
          },
        } as any,
        { bypassDocumentValidation: true }
      );

      await updateMessageStatus("brevo-msg-123", "delivered");

      const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(updated?.whatsapp_contact?.message_status).toBe("delivered");
      expect(updated?.whatsapp_contact?.status_updated_at).toBeInstanceOf(Date);
    });

    it("met à jour le statut en 'read'", async () => {
      const effectifId = new ObjectId();
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: effectifId,
          mission_locale_id: new ObjectId(),
          effectif_id: new ObjectId(),
          created_at: new Date(),
          brevo: {},
          current_status: {},
          effectif_snapshot: {} as any,
          whatsapp_contact: {
            phone_normalized: "+33612345678",
            message_id: "brevo-msg-456",
            message_status: "delivered",
            last_message_sent_at: new Date(),
          },
        } as any,
        { bypassDocumentValidation: true }
      );

      await updateMessageStatus("brevo-msg-456", "read");

      const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(updated?.whatsapp_contact?.message_status).toBe("read");
    });

    it("met à jour le statut en 'failed'", async () => {
      const effectifId = new ObjectId();
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: effectifId,
          mission_locale_id: new ObjectId(),
          effectif_id: new ObjectId(),
          created_at: new Date(),
          brevo: {},
          current_status: {},
          effectif_snapshot: {} as any,
          whatsapp_contact: {
            phone_normalized: "+33612345678",
            message_id: "brevo-msg-789",
            message_status: "sent",
            last_message_sent_at: new Date(),
          },
        } as any,
        { bypassDocumentValidation: true }
      );

      await updateMessageStatus("brevo-msg-789", "failed");

      const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      expect(updated?.whatsapp_contact?.message_status).toBe("failed");
    });

    it("ne crashe pas si le messageId n'existe pas en base", async () => {
      // Doit juste logger un warning, pas d'erreur
      await expect(updateMessageStatus("unknown-msg-id", "delivered")).resolves.toBeUndefined();
    });
  });

  describe("triggerWhatsAppIfEligible (integration)", () => {
    useMongo();

    const missionLocaleId = new ObjectId();

    const baseEffectif: Partial<IMissionLocaleEffectif> = {
      _id: new ObjectId(),
      mission_locale_id: missionLocaleId,
      effectif_id: new ObjectId(),
      created_at: new Date(),
      brevo: {},
      current_status: {},
      effectif_snapshot: {
        _id: new ObjectId(),
        organisme_id: new ObjectId(),
        id_erp_apprenant: "123",
        source: "test",
        annee_scolaire: "2024-2025",
        apprenant: {
          nom: "Dupont",
          prenom: "Jean",
          telephone: "0612345678",
        },
        formation: {},
        is_lock: false,
        created_at: new Date(),
        updated_at: new Date(),
      } as any,
    };

    beforeEach(async () => {
      const db = getDatabase();
      await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
      await db.command({ collMod: "organisations", validationLevel: "off" }).catch(() => {});
      await missionLocaleEffectifsDb().deleteMany({});
      await organisationsDb().deleteMany({});
    });

    it("ne fait rien si effectif est null", async () => {
      await expect(triggerWhatsAppIfEligible(null, missionLocaleId)).resolves.toBeUndefined();
    });

    it("ne fait rien si la feature est désactivée", async () => {
      const effectif = { ...baseEffectif } as IMissionLocaleEffectif;
      // Par défaut en test, MNA_TDB_WHATSAPP_ENABLED=false
      await expect(triggerWhatsAppIfEligible(effectif, missionLocaleId)).resolves.toBeUndefined();
    });

    it("ne fait rien si l'effectif n'est pas éligible (déjà contacté)", async () => {
      const effectif = {
        ...baseEffectif,
        whatsapp_contact: {
          phone_normalized: "+33612345678",
          last_message_sent_at: new Date(),
          opted_out: false,
        },
      } as IMissionLocaleEffectif;
      await expect(triggerWhatsAppIfEligible(effectif, missionLocaleId)).resolves.toBeUndefined();
    });
  });
});
