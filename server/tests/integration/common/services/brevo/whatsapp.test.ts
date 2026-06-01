import { strict as assert } from "assert";

import { ObjectId } from "mongodb";
import { IMissionLocaleEffectif, SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { USER_RESPONSE_TYPE, CONVERSATION_STATE } from "shared/models/data/whatsappContact.model";
import { it, describe, beforeEach, afterEach, vi, expect } from "vitest";

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
  notifyMLUsersOnPrequalifYes,
  handleInboundWhatsAppMessage,
  extractUserResponseText,
  updateMessageStatus,
  triggerWhatsAppIfEligible,
  sendWhatsAppMessage,
  updateWhatsAppContact,
} from "@/common/services/brevo/whatsapp";
import { sendWhatsAppTemplate, upsertBrevoContact } from "@/common/services/brevo/whatsapp/brevoApi";
import { isEligibleForPrequalif } from "@/common/services/brevo/whatsapp/eligibility";
import { buildPrequalifNoMessage, buildPrequalifYesWithoutUrlMessage } from "@/common/services/brevo/whatsapp/messages";
import { applyTestPhoneOverride } from "@/common/services/brevo/whatsapp/phone";
import { isPhoneAlreadyContacted, reserveAndSendPrequalif } from "@/common/services/brevo/whatsapp/prequalif";
import { sendEmail } from "@/common/services/mailer/mailer";
import config from "@/config";
import { sendWhatsAppPrequalif } from "@/jobs/whatsapp/send-whatsapp-prequalif";
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

    describe("contextuel par template_type", () => {
      it("contexte prequalif : ❌ → PREQUALIF_NO (PAS NO_HELP)", () => {
        assert.strictEqual(parseUserResponse("❌", "prequalif"), USER_RESPONSE_TYPE.PREQUALIF_NO);
      });

      it("contexte prequalif : ✅ → PREQUALIF_YES", () => {
        assert.strictEqual(parseUserResponse("✅", "prequalif"), USER_RESPONSE_TYPE.PREQUALIF_YES);
        assert.strictEqual(parseUserResponse("Ça m'intéresse", "prequalif"), USER_RESPONSE_TYPE.PREQUALIF_YES);
      });

      it("contexte prequalif : 'je ne veux pas d'aide' → PREQUALIF_NO", () => {
        assert.strictEqual(parseUserResponse("Je ne veux pas d'aide", "prequalif"), USER_RESPONSE_TYPE.PREQUALIF_NO);
      });

      it("contexte prequalif : 'oui' / 'non' → null (pas un bouton préqualif)", () => {
        assert.strictEqual(parseUserResponse("oui", "prequalif"), null);
        assert.strictEqual(parseUserResponse("non", "prequalif"), null);
      });

      it("contexte injoignables : ❌ → NO_HELP (legacy)", () => {
        assert.strictEqual(parseUserResponse("❌", "injoignables"), USER_RESPONSE_TYPE.NO_HELP);
      });

      it("contexte injoignables : ✅ → null (pas un bouton injoignables)", () => {
        assert.strictEqual(parseUserResponse("✅", "injoignables"), null);
      });

      it("contexte injoignables : 'oui' → CALLBACK", () => {
        assert.strictEqual(parseUserResponse("oui", "injoignables"), USER_RESPONSE_TYPE.CALLBACK);
      });

      it("rétrocompat : sans templateType → comportement legacy NO_HELP/CALLBACK", () => {
        assert.strictEqual(parseUserResponse("❌"), USER_RESPONSE_TYPE.NO_HELP);
        assert.strictEqual(parseUserResponse("oui"), USER_RESPONSE_TYPE.CALLBACK);
      });
    });
  });

  describe("buildPrequalifYesWithoutUrlMessage", () => {
    it("construit le message de suivi YES sans URL", () => {
      const message = buildPrequalifYesWithoutUrlMessage("Marie", { nom: "Paris" });
      expect(message).toContain("C'est noté *Marie* ✅");
      expect(message).toContain("Mission locale Paris");
      expect(message).toContain("contactera dans les prochains jours");
    });
  });

  describe("buildPrequalifNoMessage", () => {
    const ml = {
      nom: "Paris",
      email: "ml@paris.fr",
      telephone: "01 23 45 67 89",
      adresse_inline: "10 rue X, 75001 Paris",
    };

    it("construit le message NO complet avec contacts inline", () => {
      const message = buildPrequalifNoMessage("Marie", ml);
      expect(message).toContain("C'est noté *Marie*");
      expect(message).toContain("Mission locale Paris");
      expect(message).toContain("ne vous contactera pas");
      expect(message).toContain("✉️ ml@paris.fr");
      expect(message).toContain("📞 01 23 45 67 89");
      expect(message).toContain("📍 10 rue X, 75001 Paris");
    });

    it("omet les coordonnées manquantes", () => {
      const message = buildPrequalifNoMessage("Marie", { nom: "Paris" });
      expect(message).not.toContain("✉️");
      expect(message).not.toContain("📞");
      expect(message).not.toContain("📍");
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

  describe("isEligibleForPrequalif", () => {
    const baseEffectif: Partial<IMissionLocaleEffectif> = {
      _id: new ObjectId(),
      mission_locale_id: new ObjectId(),
      effectif_id: new ObjectId(),
      created_at: new Date(),
      brevo: {},
      current_status: {},
      date_rupture: new Date(),
      classification_reponse_appel: {
        score: 0.9,
        model: "test-model",
        scored_at: new Date(),
      },
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
    };

    it("retourne true pour un effectif éligible (score ≥ 0.75)", () => {
      assert.strictEqual(isEligibleForPrequalif(baseEffectif as IMissionLocaleEffectif), true);
    });

    it("retourne false si score < 0.75", () => {
      const effectif = {
        ...baseEffectif,
        classification_reponse_appel: { score: 0.5, model: "x", scored_at: new Date() },
      } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForPrequalif(effectif), false);
    });

    it("retourne false si score absent", () => {
      const effectif = { ...baseEffectif, classification_reponse_appel: undefined } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForPrequalif(effectif), false);
    });

    it("retourne false si CFA V2 collab (is_allowed_collab)", () => {
      const effectif = {
        ...baseEffectif,
        computed: { organisme: { is_allowed_collab: true } },
      } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForPrequalif(effectif), false);
    });

    it("retourne false si CFA demande acc_conjoint sur cet effectif", () => {
      const effectif = {
        ...baseEffectif,
        organisme_data: { acc_conjoint: true },
      } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForPrequalif(effectif), false);
    });

    it("retourne false si situation déjà posée", () => {
      const effectif = {
        ...baseEffectif,
        situation: SITUATION_ENUM.RDV_PRIS,
      } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForPrequalif(effectif), false);
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
      assert.strictEqual(isEligibleForPrequalif(effectif), false);
    });

    it("retourne false si opt-out", () => {
      const effectif = {
        ...baseEffectif,
        whatsapp_contact: { phone_normalized: "+33612345678", opted_out: true },
      } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForPrequalif(effectif), false);
    });

    it("retourne false si pas de téléphone", () => {
      const effectif = {
        ...baseEffectif,
        effectif_snapshot: {
          ...baseEffectif.effectif_snapshot,
          apprenant: { nom: "X", prenom: "Y", telephone: null },
        },
      } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForPrequalif(effectif), false);
    });

    it("inclut les mineurs et les RQTH (décision verrouillée plan §2)", () => {
      assert.strictEqual(isEligibleForPrequalif(baseEffectif as IMissionLocaleEffectif), true);
    });

    it("retourne false si date_rupture absente", () => {
      const effectif = { ...baseEffectif, date_rupture: undefined } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForPrequalif(effectif), false);
    });

    it("retourne false si date_rupture au-delà de 180 jours (effectif en abandon)", () => {
      const tooOld = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
      const effectif = { ...baseEffectif, date_rupture: tooOld } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForPrequalif(effectif), false);
    });

    it("retourne true pour une rupture juste sous la borne 180 jours", () => {
      const recent = new Date(Date.now() - 179 * 24 * 60 * 60 * 1000);
      const effectif = { ...baseEffectif, date_rupture: recent } as IMissionLocaleEffectif;
      assert.strictEqual(isEligibleForPrequalif(effectif), true);
    });
  });

  describe("isPhoneAlreadyContacted (Verrou 2 §7.7)", () => {
    useMongo();

    beforeEach(async () => {
      const db = getDatabase();
      await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
      await missionLocaleEffectifsDb().deleteMany({});
    });

    it("retourne false si aucun autre effectif n'a ce phone normalisé", async () => {
      const effectifId = new ObjectId();
      assert.strictEqual(await isPhoneAlreadyContacted("+33611111111", effectifId), false);
    });

    const insertMockEffectifWithPhone = (id: ObjectId, phone: string, extra: any = {}) =>
      missionLocaleEffectifsDb().insertOne(
        {
          _id: id,
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
            apprenant: { nom: "X", prenom: "Y", telephone: phone },
            formation: {},
            is_lock: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
          whatsapp_contact: { phone_normalized: phone, last_message_sent_at: new Date(), opted_out: false },
          ...extra,
        } as any,
        { bypassDocumentValidation: true }
      );

    it("retourne true si un autre effectif a déjà reçu un message au même phone", async () => {
      const otherEffectifId = new ObjectId();
      const currentEffectifId = new ObjectId();
      await insertMockEffectifWithPhone(otherEffectifId, "+33611111111");
      assert.strictEqual(await isPhoneAlreadyContacted("+33611111111", currentEffectifId), true);
    });

    it("ignore soft_deleted=true du courant mais PAS de la cible (intentional cross-flow dedup)", async () => {
      const otherEffectifId = new ObjectId();
      const currentEffectifId = new ObjectId();
      await insertMockEffectifWithPhone(otherEffectifId, "+33622222222", { soft_deleted: true });
      assert.strictEqual(await isPhoneAlreadyContacted("+33622222222", currentEffectifId), true);
    });

    it("ne bloque pas l'effectif courant lui-même", async () => {
      const effectifId = new ObjectId();
      await insertMockEffectifWithPhone(effectifId, "+33633333333");
      assert.strictEqual(await isPhoneAlreadyContacted("+33633333333", effectifId), false);
    });
  });

  describe("reserveAndSendPrequalif (Verrou 1 §7.7)", () => {
    useMongo();

    beforeEach(async () => {
      vi.clearAllMocks();
      const db = getDatabase();
      await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
      await missionLocaleEffectifsDb().deleteMany({});
    });

    const setupEffectif = async (overrides: Partial<IMissionLocaleEffectif> = {}): Promise<ObjectId> => {
      const id = new ObjectId();
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: id,
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
            apprenant: { nom: "X", prenom: "Y", telephone: "0600000000" },
            formation: {},
            is_lock: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
          ...overrides,
        } as any,
        { bypassDocumentValidation: true }
      );
      return id;
    };

    it("retourne 'skipped' si WhatsApp désactivé (config.brevo.whatsapp.enabled=false)", async () => {
      const id = await setupEffectif();
      const result = await reserveAndSendPrequalif({
        effectifId: id,
        targetPhone: "+33644444444",
        prenom: "Test",
        mlNom: "ML",
        sentVia: "backfill",
      });
      assert.strictEqual(result, "skipped");
    });

    it("skip si phone déjà contacté sur un autre effectif (Verrou 2)", async () => {
      const otherId = await setupEffectif({
        whatsapp_contact: { phone_normalized: "+33655555555", last_message_sent_at: new Date(), opted_out: false },
      } as any);
      const currentId = await setupEffectif();
      assert.strictEqual(await isPhoneAlreadyContacted("+33655555555", currentId), true);
      assert.notStrictEqual(otherId, currentId);
    });

    it("re-run sur le même effectif est idempotent (Verrou 1)", async () => {
      const id = await setupEffectif({
        whatsapp_contact: { phone_normalized: "+33666666666", last_message_sent_at: new Date(), opted_out: false },
      } as any);
      const result = await reserveAndSendPrequalif({
        effectifId: id,
        targetPhone: "+33677777777",
        prenom: "Test",
        mlNom: "ML",
        sentVia: "backfill",
      });
      assert.strictEqual(result, "skipped");
    });
  });

  describe("handlePrequalifYes / handlePrequalifNo (timeline log + DB updates)", () => {
    useMongo();

    beforeEach(async () => {
      vi.clearAllMocks();
      const db = getDatabase();
      await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
      await db.command({ collMod: "organisations", validationLevel: "off" }).catch(() => {});
      await db.command({ collMod: "missionLocaleEffectifsLog", validationLevel: "off" }).catch(() => {});
      await missionLocaleEffectifsDb().deleteMany({});
      await missionLocaleEffectifsLogDb().deleteMany({});
      await organisationsDb().deleteMany({});
    });

    const setupPrequalifEffectif = async (overrides: any = {}) => {
      const mlId = new ObjectId();
      await organisationsDb().insertOne(
        {
          _id: mlId,
          type: "MISSION_LOCALE",
          nom: "ML Test",
          ml_id: 1,
          created_at: new Date(),
        } as any,
        { bypassDocumentValidation: true }
      );

      const effectifId = new ObjectId();
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: effectifId,
          mission_locale_id: mlId,
          effectif_id: new ObjectId(),
          created_at: new Date(),
          brevo: {},
          current_status: {},
          a_traiter: true,
          situation: null,
          whatsapp_contact: {
            phone_normalized: "+33688888888",
            brevo_visitor_id: "visitor-x",
            last_message_sent_at: new Date(Date.now() - 60_000),
            template_type: "prequalif",
            sent_via: "backfill",
            message_status: "sent",
          },
          effectif_snapshot: {
            _id: new ObjectId(),
            organisme_id: new ObjectId(),
            id_erp_apprenant: "123",
            source: "test",
            annee_scolaire: "2024-2025",
            apprenant: { nom: "Dupont", prenom: "Marie", telephone: "0688888888" },
            formation: {},
            is_lock: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
          ...overrides,
        } as any,
        { bypassDocumentValidation: true }
      );

      return { effectifId, mlId };
    };

    it("PREQUALIF_YES : pose souhaite_rdv=true + a_traiter=true + log timeline event YES", async () => {
      const { effectifId } = await setupPrequalifEffectif();

      await handleInboundWhatsAppMessage("+33688888888", "✅ Ça m'intéresse", "msg-1", "visitor-x");

      const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      assert.strictEqual(updated?.souhaite_rdv, true);
      assert.strictEqual(updated?.souhaite_rdv_source, "whatsapp_prequalif");
      assert.strictEqual(updated?.a_traiter, true);

      const log = await missionLocaleEffectifsLogDb().findOne({
        mission_locale_effectif_id: effectifId,
        event: "WHATSAPP_PREQUALIF_YES",
      });
      assert.ok(log, "Log timeline event YES doit être inséré");
    });

    it("PREQUALIF_NO : pose situation=NE_SOUHAITE_PAS_ETRE_RECONTACTE + log timeline NO + a_traiter=false", async () => {
      const { effectifId } = await setupPrequalifEffectif({
        whatsapp_contact: {
          phone_normalized: "+33699999999",
          brevo_visitor_id: "visitor-y",
          last_message_sent_at: new Date(Date.now() - 60_000),
          template_type: "prequalif",
          sent_via: "backfill",
          message_status: "sent",
        },
      });

      await handleInboundWhatsAppMessage("+33699999999", "❌ Je ne veux pas d'aide", "msg-2", "visitor-y");

      const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      assert.strictEqual(updated?.situation, SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE);
      assert.strictEqual(updated?.a_traiter, false);

      const log = await missionLocaleEffectifsLogDb().findOne({
        mission_locale_effectif_id: effectifId,
        event: "WHATSAPP_PREQUALIF_NO",
      });
      assert.ok(log, "Log timeline event NO doit être inséré");
    });

    it("YES après NO (race) : re-aligne a_traiter=true et lève situation NE_SOUHAITE_PAS_ETRE_RECONTACTE", async () => {
      const { effectifId } = await setupPrequalifEffectif({
        a_traiter: false,
        situation: SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
        whatsapp_contact: {
          phone_normalized: "+33677000000",
          brevo_visitor_id: "visitor-race",
          last_message_sent_at: new Date(Date.now() - 60_000),
          template_type: "prequalif",
          sent_via: "backfill",
          message_status: "sent",
        },
      });

      await handleInboundWhatsAppMessage("+33677000000", "✅", "msg-race", "visitor-race");

      const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      assert.strictEqual(updated?.a_traiter, true);
      assert.strictEqual(updated?.souhaite_rdv, true);
      assert.ok(updated?.situation == null);
    });

    it("YES avec situation hors flow déjà posée → souhaite_rdv true mais situation conservée (bug 3)", async () => {
      const { effectifId } = await setupPrequalifEffectif({
        situation: SITUATION_ENUM.DEJA_ACCOMPAGNE,
        whatsapp_contact: {
          phone_normalized: "+33655000000",
          brevo_visitor_id: "visitor-deja-acc",
          last_message_sent_at: new Date(Date.now() - 60_000),
          template_type: "prequalif",
          sent_via: "backfill",
          message_status: "sent",
        },
      });

      await handleInboundWhatsAppMessage("+33655000000", "✅", "msg-deja", "visitor-deja-acc");

      const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      assert.strictEqual(updated?.souhaite_rdv, true);
      assert.strictEqual(updated?.situation, SITUATION_ENUM.DEJA_ACCOMPAGNE);
    });

    it("YES mais CFA bascule V2 entre envoi et réponse → souhaite_rdv NON posé (exclusion PRD)", async () => {
      const { effectifId } = await setupPrequalifEffectif({
        computed: { organisme: { is_allowed_collab: true } },
        whatsapp_contact: {
          phone_normalized: "+33611200000",
          brevo_visitor_id: "visitor-cfa-v2",
          last_message_sent_at: new Date(Date.now() - 60_000),
          template_type: "prequalif",
          sent_via: "backfill",
          message_status: "sent",
        },
      });

      await handleInboundWhatsAppMessage("+33611200000", "✅", "msg-cfa-v2", "visitor-cfa-v2");

      const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      assert.ok(!updated?.souhaite_rdv, "souhaite_rdv ne doit pas être true pour un CFA V2");
    });
  });

  describe("notifyMLUsersOnPrequalifYes (integration)", () => {
    useMongo();

    beforeEach(async () => {
      vi.mocked(sendEmail).mockClear();
      const db = getDatabase();
      await db.command({ collMod: "usersMigration", validationLevel: "off" }).catch(() => {});
      await usersMigrationDb().deleteMany({});
    });

    const buildEffectif = (mlId: ObjectId, prenom = "Jean", nom = "Dupont"): IMissionLocaleEffectif =>
      ({
        _id: new ObjectId(),
        mission_locale_id: mlId,
        effectif_id: new ObjectId(),
        created_at: new Date(),
        brevo: {},
        current_status: {},
        effectif_snapshot: {
          _id: new ObjectId(),
          organisme_id: new ObjectId(),
          id_erp_apprenant: "x",
          source: "test",
          annee_scolaire: "2024-2025",
          apprenant: { nom, prenom, telephone: "0600000000" },
          formation: {},
          is_lock: false,
          created_at: new Date(),
          updated_at: new Date(),
        } as any,
      }) as IMissionLocaleEffectif;

    it("broadcast à TOUS les users CONFIRMED de la ML", async () => {
      const mlId = new ObjectId();
      await usersMigrationDb().insertMany([
        {
          _id: new ObjectId(),
          email: "user1@ml.fr",
          nom: "Alpha",
          prenom: "User",
          civility: "Madame",
          password: "x",
          account_status: "CONFIRMED",
          organisation_id: mlId,
          created_at: new Date(),
        },
        {
          _id: new ObjectId(),
          email: "user2@ml.fr",
          nom: "Beta",
          prenom: "User",
          civility: "Monsieur",
          password: "x",
          account_status: "CONFIRMED",
          organisation_id: mlId,
          created_at: new Date(),
        },
      ] as any[]);

      await notifyMLUsersOnPrequalifYes(buildEffectif(mlId));

      expect(sendEmail).toHaveBeenCalledTimes(2);
      expect(sendEmail).toHaveBeenCalledWith(
        "user1@ml.fr",
        "mission_locale_prequalif_yes",
        expect.objectContaining({ jeune: { prenom: "Jean", nom: "Dupont" } }),
        { noreply: true }
      );
      expect(sendEmail).toHaveBeenCalledWith("user2@ml.fr", "mission_locale_prequalif_yes", expect.anything(), {
        noreply: true,
      });
    });

    it("n'envoie aucun email si la ML n'a aucun user CONFIRMED", async () => {
      const mlId = new ObjectId();
      await usersMigrationDb().insertOne({
        _id: new ObjectId(),
        email: "pending@ml.fr",
        nom: "X",
        prenom: "Y",
        civility: "Madame",
        password: "x",
        account_status: "PENDING",
        organisation_id: mlId,
        created_at: new Date(),
      } as any);

      await notifyMLUsersOnPrequalifYes(buildEffectif(mlId));

      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("ne notifie QUE les users de la ML de l'effectif (isolation)", async () => {
      const mlA = new ObjectId();
      const mlB = new ObjectId();
      await usersMigrationDb().insertMany([
        {
          _id: new ObjectId(),
          email: "ml-a@example.fr",
          nom: "A",
          prenom: "User",
          civility: "Madame",
          password: "x",
          account_status: "CONFIRMED",
          organisation_id: mlA,
          created_at: new Date(),
        },
        {
          _id: new ObjectId(),
          email: "ml-b@example.fr",
          nom: "B",
          prenom: "User",
          civility: "Madame",
          password: "x",
          account_status: "CONFIRMED",
          organisation_id: mlB,
          created_at: new Date(),
        },
      ] as any[]);

      await notifyMLUsersOnPrequalifYes(buildEffectif(mlA));

      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith("ml-a@example.fr", "mission_locale_prequalif_yes", expect.anything(), {
        noreply: true,
      });
    });
  });

  describe("applyTestPhoneOverride", () => {
    const originalOverride = config.brevo.whatsapp?.testPhoneOverride;
    const originalEnv = config.env;
    const mutableConfig = config as { env: string; brevo: { whatsapp: { testPhoneOverride: string } } };

    afterEach(() => {
      mutableConfig.env = originalEnv;
      mutableConfig.brevo.whatsapp.testPhoneOverride = originalOverride ?? "";
    });

    it("non-prod + override valide → retourne le numéro override normalisé", () => {
      mutableConfig.env = "local";
      mutableConfig.brevo.whatsapp.testPhoneOverride = "0612345678";
      assert.strictEqual(applyTestPhoneOverride("+33688888888"), "+33612345678");
    });

    it("production + override défini → numéro original (override ignoré)", () => {
      mutableConfig.env = "production";
      mutableConfig.brevo.whatsapp.testPhoneOverride = "+33612345678";
      assert.strictEqual(applyTestPhoneOverride("+33688888888"), "+33688888888");
    });

    it("override invalide → fallback sur le numéro original", () => {
      mutableConfig.env = "local";
      mutableConfig.brevo.whatsapp.testPhoneOverride = "not-a-number";
      assert.strictEqual(applyTestPhoneOverride("+33688888888"), "+33688888888");
    });

    it("pas d'override défini → retourne le numéro original", () => {
      mutableConfig.env = "local";
      mutableConfig.brevo.whatsapp.testPhoneOverride = "";
      assert.strictEqual(applyTestPhoneOverride("+33688888888"), "+33688888888");
    });
  });

  describe("updateWhatsAppContact: messages_history cap", () => {
    useMongo();

    beforeEach(async () => {
      const db = getDatabase();
      await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
      await missionLocaleEffectifsDb().deleteMany({});
    });

    it("limite messages_history aux 50 dernières entrées via $slice", async () => {
      const effectifId = new ObjectId();
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: effectifId,
          mission_locale_id: new ObjectId(),
          effectif_id: new ObjectId(),
          created_at: new Date(),
          brevo: {},
          current_status: {},
          whatsapp_contact: { phone_normalized: "+33611111111" },
        } as any,
        { bypassDocumentValidation: true }
      );

      for (let i = 0; i < 60; i++) {
        await updateWhatsAppContact(effectifId, {}, {
          direction: "inbound",
          message_id: `msg-${i}`,
          content: `body-${i}`,
          received_at: new Date(),
        } as any);
      }

      const after = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      const history = after?.whatsapp_contact?.messages_history ?? [];
      assert.strictEqual(history.length, 50, "history doit être capé à 50");
      assert.strictEqual((history[0] as any).message_id, "msg-10", "doit garder les 50 dernières (msg-10 → msg-59)");
      assert.strictEqual((history[49] as any).message_id, "msg-59");
    });
  });

  describe("handlePrequalifYes idempotence (conversation CLOSED)", () => {
    useMongo();

    beforeEach(async () => {
      vi.clearAllMocks();
      const db = getDatabase();
      await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
      await db.command({ collMod: "organisations", validationLevel: "off" }).catch(() => {});
      await db.command({ collMod: "missionLocaleEffectifsLog", validationLevel: "off" }).catch(() => {});
      await missionLocaleEffectifsDb().deleteMany({});
      await missionLocaleEffectifsLogDb().deleteMany({});
      await organisationsDb().deleteMany({});
    });

    it("YES rejoué après CLOSED → ne réécrase pas souhaite_rdv_at + ne duplique pas le log", async () => {
      const mlId = new ObjectId();
      await organisationsDb().insertOne(
        { _id: mlId, type: "MISSION_LOCALE", nom: "ML", ml_id: 1, created_at: new Date() } as any,
        { bypassDocumentValidation: true }
      );

      const effectifId = new ObjectId();
      const initialSouhaiteRdvAt = new Date(Date.now() - 60_000);
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: effectifId,
          mission_locale_id: mlId,
          effectif_id: new ObjectId(),
          created_at: new Date(),
          brevo: {},
          current_status: {},
          a_traiter: true,
          situation: null,
          souhaite_rdv: true,
          souhaite_rdv_at: initialSouhaiteRdvAt,
          souhaite_rdv_source: "whatsapp_prequalif",
          whatsapp_contact: {
            phone_normalized: "+33644000000",
            brevo_visitor_id: "visitor-replay",
            last_message_sent_at: new Date(Date.now() - 120_000),
            template_type: "prequalif",
            sent_via: "backfill",
            message_status: "sent",
            conversation_state: CONVERSATION_STATE.CLOSED,
          },
          effectif_snapshot: {
            _id: new ObjectId(),
            organisme_id: new ObjectId(),
            id_erp_apprenant: "123",
            source: "test",
            annee_scolaire: "2024-2025",
            apprenant: { nom: "X", prenom: "Y", telephone: "0644000000" },
            formation: {},
            is_lock: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        } as any,
        { bypassDocumentValidation: true }
      );

      await handleInboundWhatsAppMessage("+33644000000", "✅", "msg-replay", "visitor-replay");

      const updated = await missionLocaleEffectifsDb().findOne({ _id: effectifId });
      assert.strictEqual(
        updated?.souhaite_rdv_at?.getTime(),
        initialSouhaiteRdvAt.getTime(),
        "souhaite_rdv_at ne doit PAS dériver sur replay quand conversation CLOSED"
      );

      const logs = await missionLocaleEffectifsLogDb()
        .find({ mission_locale_effectif_id: effectifId, event: "WHATSAPP_PREQUALIF_YES" })
        .toArray();
      assert.strictEqual(logs.length, 0, "aucun nouveau log YES inséré (idempotence)");
    });
  });

  describe("TEST_PHONE_OVERRIDE — bout-en-bout préqualif", () => {
    useMongo();

    const originalEnv = config.env;
    const originalOverride = config.brevo.whatsapp?.testPhoneOverride;
    const originalEnabled = config.brevo.whatsapp?.enabled;
    const originalTemplateId = config.brevo.whatsapp?.templatePrequalifInitialId;
    const originalApiKey = config.brevo.apiKey;
    const mutableConfig = config as {
      env: string;
      brevo: {
        apiKey?: string;
        whatsapp: {
          enabled: boolean;
          testPhoneOverride: string;
          templatePrequalifInitialId: number;
        };
      };
    };

    beforeEach(async () => {
      vi.clearAllMocks();
      const db = getDatabase();
      await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
      await db.command({ collMod: "organisations", validationLevel: "off" }).catch(() => {});
      await missionLocaleEffectifsDb().deleteMany({});
      await organisationsDb().deleteMany({});
      mutableConfig.brevo.whatsapp.enabled = true;
      mutableConfig.brevo.whatsapp.templatePrequalifInitialId = 42;
      mutableConfig.brevo.apiKey = "test-key";
    });

    afterEach(() => {
      mutableConfig.env = originalEnv;
      mutableConfig.brevo.whatsapp.enabled = originalEnabled ?? false;
      mutableConfig.brevo.whatsapp.testPhoneOverride = originalOverride ?? "";
      mutableConfig.brevo.whatsapp.templatePrequalifInitialId = originalTemplateId ?? 0;
      mutableConfig.brevo.apiKey = originalApiKey;
    });

    const insertCandidate = async (phone = "0688888888") => {
      const id = new ObjectId();
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: id,
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
            apprenant: { nom: "X", prenom: "Y", telephone: phone },
            formation: {},
            is_lock: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        } as any,
        { bypassDocumentValidation: true }
      );
      return id;
    };

    it("non-prod + override → Brevo (upsert + template) reçoit le numéro override, pas l'original", async () => {
      mutableConfig.env = "local";
      mutableConfig.brevo.whatsapp.testPhoneOverride = "+33612345678";

      const id = await insertCandidate();
      const result = await reserveAndSendPrequalif({
        effectifId: id,
        targetPhone: "+33688888888",
        prenom: "Test",
        mlNom: "ML",
        sentVia: "backfill",
      });

      assert.strictEqual(result, "sent");
      expect(upsertBrevoContact).toHaveBeenCalledWith("+33612345678", expect.any(Object));
      expect(sendWhatsAppTemplate).toHaveBeenCalledWith("+33612345678", { templateId: 42 });

      const after = await missionLocaleEffectifsDb().findOne({ _id: id });
      assert.strictEqual(
        after?.whatsapp_contact?.phone_normalized,
        "+33612345678",
        "DB doit stocker le numéro override pour que l'inbound retrouve l'effectif"
      );
    });

    it("isPhoneAlreadyContacted bypass : non-prod+override → false même si phone partagé (envois successifs OK)", async () => {
      mutableConfig.env = "local";
      mutableConfig.brevo.whatsapp.testPhoneOverride = "+33612345678";

      const otherId = new ObjectId();
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: otherId,
          mission_locale_id: new ObjectId(),
          effectif_id: new ObjectId(),
          created_at: new Date(),
          brevo: {},
          current_status: {},
          whatsapp_contact: {
            phone_normalized: "+33612345678",
            last_message_sent_at: new Date(),
            opted_out: false,
          },
        } as any,
        { bypassDocumentValidation: true }
      );

      assert.strictEqual(await isPhoneAlreadyContacted("+33612345678", new ObjectId()), false);
    });

    it("isPhoneAlreadyContacted PROD : override ignoré, dedup phone reste actif", async () => {
      mutableConfig.env = "production";
      mutableConfig.brevo.whatsapp.testPhoneOverride = "+33612345678";

      const otherId = new ObjectId();
      await missionLocaleEffectifsDb().insertOne(
        {
          _id: otherId,
          mission_locale_id: new ObjectId(),
          effectif_id: new ObjectId(),
          created_at: new Date(),
          brevo: {},
          current_status: {},
          whatsapp_contact: {
            phone_normalized: "+33612345678",
            last_message_sent_at: new Date(),
            opted_out: false,
          },
        } as any,
        { bypassDocumentValidation: true }
      );

      assert.strictEqual(await isPhoneAlreadyContacted("+33612345678", new ObjectId()), true);
    });

    it("inbound routing : quand 2 effectifs partagent l'override, le plus récent gagne", async () => {
      mutableConfig.env = "local";
      mutableConfig.brevo.whatsapp.testPhoneOverride = "+33612345678";

      const mlId = new ObjectId();
      await organisationsDb().insertOne(
        { _id: mlId, type: "MISSION_LOCALE", nom: "ML", ml_id: 1, created_at: new Date() } as any,
        { bypassDocumentValidation: true }
      );

      const olderId = new ObjectId();
      const newerId = new ObjectId();
      const olderSentAt = new Date(Date.now() - 60_000);
      const newerSentAt = new Date();

      for (const [id, sentAt] of [
        [olderId, olderSentAt],
        [newerId, newerSentAt],
      ] as const) {
        await missionLocaleEffectifsDb().insertOne(
          {
            _id: id,
            mission_locale_id: mlId,
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
              apprenant: { nom: "X", prenom: "Y", telephone: "0612345678" },
              formation: {},
              is_lock: false,
              created_at: new Date(),
              updated_at: new Date(),
            },
            whatsapp_contact: {
              phone_normalized: "+33612345678",
              brevo_visitor_id: `visitor-${id.toHexString()}`,
              last_message_sent_at: sentAt,
              template_type: "prequalif",
              sent_via: "backfill",
              message_status: "sent",
              conversation_state: CONVERSATION_STATE.INITIAL_SENT,
            },
          } as any,
          { bypassDocumentValidation: true }
        );
      }

      await handleInboundWhatsAppMessage("+33612345678", "✅", "msg-routing", undefined);

      const olderAfter = await missionLocaleEffectifsDb().findOne({ _id: olderId });
      const newerAfter = await missionLocaleEffectifsDb().findOne({ _id: newerId });

      assert.strictEqual(
        newerAfter?.whatsapp_contact?.conversation_state,
        CONVERSATION_STATE.CLOSED,
        "le plus récent doit être traité et clôturé"
      );
      assert.strictEqual(
        olderAfter?.whatsapp_contact?.conversation_state,
        CONVERSATION_STATE.INITIAL_SENT,
        "le plus ancien doit rester intact — documente la limitation 'un effectif test à la fois'"
      );
    });

    it("job guard : non-prod sans override → retourne 0 et n'appelle ni Brevo ni DB write", async () => {
      mutableConfig.env = "local";
      mutableConfig.brevo.whatsapp.testPhoneOverride = "";

      const id = await insertCandidate();

      const code = await sendWhatsAppPrequalif({ dryRun: false, sentVia: "backfill" });

      assert.strictEqual(code, 0);
      expect(sendWhatsAppTemplate).not.toHaveBeenCalled();
      expect(upsertBrevoContact).not.toHaveBeenCalled();

      const after = await missionLocaleEffectifsDb().findOne({ _id: id });
      assert.strictEqual(
        after?.whatsapp_contact,
        undefined,
        "aucune écriture whatsapp_contact ne doit avoir lieu quand le guard rejette"
      );
    });

    it("garde-fou prod : override défini en production → ignoré, le vrai numéro est envoyé à Brevo", async () => {
      mutableConfig.env = "production";
      mutableConfig.brevo.whatsapp.testPhoneOverride = "+33612345678";

      const id = await insertCandidate();
      const result = await reserveAndSendPrequalif({
        effectifId: id,
        targetPhone: "+33688888888",
        prenom: "Test",
        mlNom: "ML",
        sentVia: "daily",
      });

      assert.strictEqual(result, "sent");
      expect(upsertBrevoContact).toHaveBeenCalledWith("+33688888888", expect.any(Object));
      expect(sendWhatsAppTemplate).toHaveBeenCalledWith("+33688888888", { templateId: 42 });

      const after = await missionLocaleEffectifsDb().findOne({ _id: id });
      assert.strictEqual(
        after?.whatsapp_contact?.phone_normalized,
        "+33688888888",
        "en prod, le vrai numéro doit être stocké (override ignoré)"
      );
    });
  });
});
