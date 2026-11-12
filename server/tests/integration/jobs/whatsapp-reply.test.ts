import { addJob } from "job-processor";
import { ObjectId } from "mongodb";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { sendWhatsAppMessage } from "@/common/services/brevo/whatsapp/brevoApi";
import {
  enqueueWhatsAppReply,
  nextRetryDelayMs,
  WHATSAPP_REPLY_JOB,
  WHATSAPP_RETRY_DELAYS_MS,
} from "@/common/services/brevo/whatsapp/queue";
import { whatsappJobs } from "@/jobs/registry/whatsapp";
import { sendWhatsAppReply } from "@/jobs/whatsapp/send-whatsapp-reply";
import { useMongo } from "@tests/jest/setupMongo";
import { DeepPartial, testDoc } from "@tests/utils/testUtils";

vi.mock("job-processor", async (importOriginal) => ({
  ...(await importOriginal<typeof import("job-processor")>()),
  addJob: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/common/services/brevo/whatsapp/brevoApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/brevo/whatsapp/brevoApi")>()),
  sendWhatsAppMessage: vi.fn(),
}));

vi.mock("@/common/services/sentry/alertContract", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/sentry/alertContract")>()),
  captureTiered: vi.fn(),
}));

describe("file d'envoi des réponses WhatsApp", () => {
  useMongo();

  const mlId = new ObjectId();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(sendWhatsAppMessage).mockResolvedValue({ success: true, messageId: "out-1" });
    const db = getDatabase();
    await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
    await db.command({ collMod: "organisations", validationLevel: "off" }).catch(() => {});
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organisationsDb().insertOne(
      testDoc<IOrganisation>({
        _id: mlId,
        type: "MISSION_LOCALE",
        nom: "ML Test",
        ml_id: 1,
        created_at: new Date(),
        rdv_url: "https://rdv.exemple.fr",
      }),
      { bypassDocumentValidation: true }
    );
  });

  const insertEffectif = async (overrides: DeepPartial<IMissionLocaleEffectif> = {}): Promise<ObjectId> => {
    const _id = new ObjectId();
    await missionLocaleEffectifsDb().insertOne(
      testDoc<IMissionLocaleEffectif>({
        _id,
        mission_locale_id: mlId,
        effectif_id: new ObjectId(),
        created_at: new Date(),
        brevo: {},
        current_status: {},
        effectif_snapshot: {
          _id: new ObjectId(),
          organisme_id: new ObjectId(),
          id_erp_apprenant: "1",
          source: "test",
          annee_scolaire: "2025-2026",
          apprenant: { nom: "Dupont", prenom: "Jeanne", telephone: "0612345678" },
          formation: {},
          is_lock: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        whatsapp_contact: { phone_normalized: "+33612345678", brevo_visitor_id: "visitor-1", opted_out: false },
        ...overrides,
      }),
      { bypassDocumentValidation: true }
    );
    return _id;
  };

  describe("envoi", () => {
    it("envoie le message reconstruit depuis la base et trace l'entrée sortante", async () => {
      const id = await insertEffectif();

      const result = await sendWhatsAppReply({ effectifId: id, kind: "callback", attempt: 1 });

      expect(result).toEqual({ outcome: "sent" });
      expect(sendWhatsAppMessage).toHaveBeenCalledWith("visitor-1", expect.stringContaining("Mission locale ML Test"));
      expect(sendWhatsAppMessage).toHaveBeenCalledWith("visitor-1", expect.stringContaining("Jeanne"));
      const after = await missionLocaleEffectifsDb().findOne({ _id: id });
      expect(after?.whatsapp_contact?.messages_history).toEqual([
        expect.objectContaining({ direction: "outbound", brevo_message_id: "out-1" }),
      ]);
    });

    it("prequalif_yes : lien de prise de rendez-vous quand la ML a une rdv_url et que le jeton existe", async () => {
      const id = await insertEffectif({
        whatsapp_contact: { brevo_visitor_id: "visitor-1", rdv_redirect_token: "tok-123" },
      });

      await sendWhatsAppReply({ effectifId: id, kind: "prequalif_yes", attempt: 1 });

      expect(sendWhatsAppMessage).toHaveBeenCalledWith("visitor-1", expect.stringContaining("/api/r/tok-123"));
    });

    it("prequalif_yes : sans jeton, message sans lien", async () => {
      const id = await insertEffectif();

      await sendWhatsAppReply({ effectifId: id, kind: "prequalif_yes", attempt: 1 });

      const [, message] = vi.mocked(sendWhatsAppMessage).mock.calls[0];
      expect(message).not.toContain("/api/r/");
      expect(message).toContain("vous contactera dans les prochains jours");
    });

    it.each(["prequalif_no", "no_help", "auto_reply", "stop"] as const)("%s : message envoyé", async (kind) => {
      const id = await insertEffectif();
      expect(await sendWhatsAppReply({ effectifId: id, kind, attempt: 1 })).toEqual({ outcome: "sent" });
      expect(sendWhatsAppMessage).toHaveBeenCalledOnce();
    });
  });

  describe("garde-fous", () => {
    it("ignore un effectif supprimé ou introuvable", async () => {
      const gone = await insertEffectif({ soft_deleted: true });

      expect(await sendWhatsAppReply({ effectifId: gone, kind: "callback", attempt: 1 })).toMatchObject({
        outcome: "skipped",
      });
      expect(await sendWhatsAppReply({ effectifId: new ObjectId(), kind: "callback", attempt: 1 })).toMatchObject({
        outcome: "skipped",
      });
      expect(sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it("n'envoie rien (hors confirmation du STOP) à un jeune désinscrit entre-temps", async () => {
      const id = await insertEffectif({ whatsapp_contact: { brevo_visitor_id: "visitor-1", opted_out: true } });

      expect(await sendWhatsAppReply({ effectifId: id, kind: "prequalif_yes", attempt: 1 })).toEqual({
        outcome: "skipped",
        reason: "opted_out",
      });
      expect(sendWhatsAppMessage).not.toHaveBeenCalled();

      expect(await sendWhatsAppReply({ effectifId: id, kind: "stop", attempt: 1 })).toEqual({ outcome: "sent" });
    });

    it("échec terminal sans visitorId, sans appel Brevo", async () => {
      const id = await insertEffectif({ whatsapp_contact: { phone_normalized: "+33612345678" } });

      expect(await sendWhatsAppReply({ effectifId: id, kind: "callback", attempt: 1 })).toEqual({
        outcome: "failed",
        reason: "visitor_id_absent",
      });
      expect(sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it("échec terminal si la Mission Locale a disparu", async () => {
      const id = await insertEffectif({ mission_locale_id: new ObjectId() });

      expect(await sendWhatsAppReply({ effectifId: id, kind: "callback", attempt: 1 })).toEqual({
        outcome: "failed",
        reason: "mission_locale_introuvable",
      });
    });
  });

  describe("réessais", () => {
    it("replanifie avec attempt+1 et le délai prévu quand Brevo n'a rien traité (503)", async () => {
      vi.mocked(sendWhatsAppMessage).mockResolvedValue({
        success: false,
        status: 503,
        retryable: true,
        safeToRetry: true,
      });
      const id = await insertEffectif();

      const result = await sendWhatsAppReply({ effectifId: id, kind: "callback", attempt: 1 });

      expect(result).toEqual({ outcome: "retry_scheduled", attempt: 2, delayMs: WHATSAPP_RETRY_DELAYS_MS[0] });
      expect(addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          name: WHATSAPP_REPLY_JOB,
          payload: { effectifId: id.toString(), kind: "callback", attempt: 2 },
          queued: true,
        })
      );
      const { scheduled_for } = vi.mocked(addJob).mock.calls[0][0] as { scheduled_for: Date };
      expect(scheduled_for.getTime() - Date.now()).toBeGreaterThan(WHATSAPP_RETRY_DELAYS_MS[0] - 5_000);
    });

    it("ne rejoue pas après un timeout : Brevo a pu envoyer le message", async () => {
      vi.mocked(sendWhatsAppMessage).mockResolvedValue({ success: false, retryable: true, safeToRetry: false });
      const id = await insertEffectif();

      expect(await sendWhatsAppReply({ effectifId: id, kind: "callback", attempt: 1 })).toMatchObject({
        outcome: "failed",
        reason: "echec_brevo",
      });
      expect(addJob).not.toHaveBeenCalled();
    });

    it("ne rejoue pas un refus 4xx", async () => {
      vi.mocked(sendWhatsAppMessage).mockResolvedValue({
        success: false,
        status: 404,
        retryable: false,
        safeToRetry: false,
      });
      const id = await insertEffectif();

      expect(await sendWhatsAppReply({ effectifId: id, kind: "callback", attempt: 1 })).toMatchObject({
        outcome: "failed",
      });
      expect(addJob).not.toHaveBeenCalled();
    });

    it("abandonne après la dernière reprise", async () => {
      vi.mocked(sendWhatsAppMessage).mockResolvedValue({
        success: false,
        status: 503,
        retryable: true,
        safeToRetry: true,
      });
      const id = await insertEffectif();
      const lastAttempt = WHATSAPP_RETRY_DELAYS_MS.length + 1;

      expect(await sendWhatsAppReply({ effectifId: id, kind: "callback", attempt: lastAttempt })).toEqual({
        outcome: "failed",
        reason: "tentatives_epuisees",
      });
      expect(addJob).not.toHaveBeenCalled();
    });

    it("délais : 1, 5 puis 15 minutes, puis plus rien", () => {
      expect([1, 2, 3, 4].map(nextRetryDelayMs)).toEqual([60_000, 300_000, 900_000, null]);
    });

    it("réponse automatique abandonnée : le verrou auto_reply_sent est libéré", async () => {
      vi.mocked(sendWhatsAppMessage).mockResolvedValue({
        success: false,
        status: 404,
        retryable: false,
        safeToRetry: false,
      });
      const id = await insertEffectif({
        whatsapp_contact: {
          brevo_visitor_id: "visitor-1",
          auto_reply_sent: true,
          auto_reply_sent_at: new Date(),
        },
      });

      await sendWhatsAppReply({ effectifId: id, kind: "auto_reply", attempt: 1 });

      const after = await missionLocaleEffectifsDb().findOne({ _id: id });
      expect(after?.whatsapp_contact?.auto_reply_sent).toBe(false);
      expect(after?.whatsapp_contact?.auto_reply_sent_at).toBeNull();
    });

    it("un échec non terminal d'une autre réponse ne touche pas auto_reply_sent", async () => {
      vi.mocked(sendWhatsAppMessage).mockResolvedValue({
        success: false,
        status: 404,
        retryable: false,
        safeToRetry: false,
      });
      const id = await insertEffectif({
        whatsapp_contact: { brevo_visitor_id: "visitor-1", auto_reply_sent: true },
      });

      await sendWhatsAppReply({ effectifId: id, kind: "callback", attempt: 1 });

      const after = await missionLocaleEffectifsDb().findOne({ _id: id });
      expect(after?.whatsapp_contact?.auto_reply_sent).toBe(true);
    });
  });

  describe("handler du registre", () => {
    const run = (payload: Record<string, unknown>) => whatsappJobs[WHATSAPP_REPLY_JOB].handler({ payload } as never);

    it("exécute l'envoi à partir du payload, attempt vaut 1 par défaut", async () => {
      const id = await insertEffectif();
      expect(await run({ effectifId: id.toString(), kind: "callback" })).toEqual({ outcome: "sent" });
    });

    it("refuse un type de réponse inconnu ou un effectifId manquant", async () => {
      await expect(run({ effectifId: new ObjectId().toString(), kind: "inconnu" })).rejects.toThrow(/inconnu/);
      await expect(run({ kind: "callback" })).rejects.toThrow(/effectifId/);
    });
  });

  describe("enqueueWhatsAppReply", () => {
    it("n'enfile que des identifiants, sans prénom ni téléphone", async () => {
      const id = new ObjectId();
      expect(await enqueueWhatsAppReply(id, "prequalif_yes")).toBe(true);

      expect(addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          name: WHATSAPP_REPLY_JOB,
          payload: { effectifId: id.toString(), kind: "prequalif_yes", attempt: 1 },
          queued: true,
        })
      );
    });

    it("ne lève jamais quand l'enqueue échoue", async () => {
      vi.mocked(addJob).mockRejectedValueOnce(new Error("mongo down"));

      await expect(enqueueWhatsAppReply(new ObjectId(), "stop")).resolves.toBe(false);
    });
  });
});
