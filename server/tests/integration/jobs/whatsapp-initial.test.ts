import { addJob } from "job-processor";
import { ObjectId } from "mongodb";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { sendWhatsAppTemplate, upsertBrevoContact } from "@/common/services/brevo/whatsapp/brevoApi";
import { triggerWhatsAppIfEligible } from "@/common/services/brevo/whatsapp/eligibility";
import { reserveAndSendInjoignables } from "@/common/services/brevo/whatsapp/injoignables";
import { WHATSAPP_INITIAL_JOB, WHATSAPP_RETRY_DELAYS_MS } from "@/common/services/brevo/whatsapp/queue";
import config from "@/config";
import { whatsappJobs } from "@/jobs/registry/whatsapp";
import { sendWhatsAppInitial } from "@/jobs/whatsapp/send-whatsapp-initial";
import { useMongo } from "@tests/jest/setupMongo";
import { DeepPartial, testDoc } from "@tests/utils/testUtils";

vi.mock("job-processor", async (importOriginal) => ({
  ...(await importOriginal<typeof import("job-processor")>()),
  addJob: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/common/services/brevo/whatsapp/brevoApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/brevo/whatsapp/brevoApi")>()),
  sendWhatsAppTemplate: vi.fn(),
  upsertBrevoContact: vi.fn().mockResolvedValue(undefined),
}));

const mutableConfig = config as unknown as {
  env: string;
  brevo: {
    apiKey?: string;
    whatsapp: { enabled: boolean; testPhoneOverride: string; templateInjoignablesId: number };
  };
};

describe("premier message WhatsApp « injoignables » en job", () => {
  useMongo();

  const original = {
    env: config.env,
    apiKey: config.brevo.apiKey,
    enabled: config.brevo.whatsapp?.enabled,
    override: config.brevo.whatsapp?.testPhoneOverride,
    templateId: config.brevo.whatsapp?.templateInjoignablesId,
  };
  const mlId = new ObjectId();

  beforeEach(async () => {
    vi.clearAllMocks();
    mutableConfig.env = "local";
    mutableConfig.brevo.apiKey = "test-key";
    mutableConfig.brevo.whatsapp.enabled = true;
    mutableConfig.brevo.whatsapp.testPhoneOverride = "+33611111111";
    mutableConfig.brevo.whatsapp.templateInjoignablesId = 7;
    vi.mocked(sendWhatsAppTemplate).mockResolvedValue({ success: true, messageId: "tpl-1" });

    const db = getDatabase();
    await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
    await db.command({ collMod: "organisations", validationLevel: "off" }).catch(() => {});
    await missionLocaleEffectifsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organisationsDb().insertOne(
      testDoc<IOrganisation>({ _id: mlId, type: "MISSION_LOCALE", nom: "ML Test", ml_id: 1, created_at: new Date() }),
      { bypassDocumentValidation: true }
    );
  });

  afterEach(() => {
    mutableConfig.env = original.env;
    mutableConfig.brevo.apiKey = original.apiKey;
    mutableConfig.brevo.whatsapp.enabled = original.enabled ?? false;
    mutableConfig.brevo.whatsapp.testPhoneOverride = original.override ?? "";
    mutableConfig.brevo.whatsapp.templateInjoignablesId = original.templateId ?? 0;
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
        date_rupture: new Date(Date.now() - 10 * 24 * 3600 * 1000),
        effectif_snapshot: {
          _id: new ObjectId(),
          organisme_id: new ObjectId(),
          id_erp_apprenant: "1",
          source: "test",
          annee_scolaire: "2025-2026",
          apprenant: {
            nom: "Dupont",
            prenom: "Jeanne",
            telephone: "0612345678",
            date_de_naissance: new Date(new Date().getFullYear() - 17, 5, 1),
          },
          formation: {},
          is_lock: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        ...overrides,
      }),
      { bypassDocumentValidation: true }
    );
    return _id;
  };

  describe("triggerWhatsAppIfEligible : n'enfile que des identifiants", () => {
    it("enfile le job pour un effectif éligible, sans appeler Brevo", async () => {
      const id = await insertEffectif();
      const effectif = (await missionLocaleEffectifsDb().findOne({ _id: id })) as IMissionLocaleEffectif;

      await triggerWhatsAppIfEligible(effectif, mlId);

      expect(addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          name: WHATSAPP_INITIAL_JOB,
          payload: { effectifId: id.toString(), missionLocaleId: mlId.toString(), attempt: 1 },
          queued: true,
        })
      );
      expect(sendWhatsAppTemplate).not.toHaveBeenCalled();
      expect(upsertBrevoContact).not.toHaveBeenCalled();
    });

    it("n'enfile rien si WhatsApp est désactivé, si l'effectif a déjà été contacté ou hors prod sans override", async () => {
      const contacted = await insertEffectif({ whatsapp_contact: { last_message_sent_at: new Date() } });
      const fresh = await insertEffectif();
      const load = async (id: ObjectId) =>
        (await missionLocaleEffectifsDb().findOne({ _id: id })) as IMissionLocaleEffectif;

      await triggerWhatsAppIfEligible(await load(contacted), mlId);
      mutableConfig.brevo.whatsapp.enabled = false;
      await triggerWhatsAppIfEligible(await load(fresh), mlId);
      mutableConfig.brevo.whatsapp.enabled = true;
      mutableConfig.brevo.whatsapp.testPhoneOverride = "";
      await triggerWhatsAppIfEligible(await load(fresh), mlId);

      expect(addJob).not.toHaveBeenCalled();
    });

    it("ne lève pas quand l'enqueue échoue : l'agent ML n'est pas pénalisé", async () => {
      vi.mocked(addJob).mockRejectedValueOnce(new Error("mongo down"));
      const id = await insertEffectif();
      const effectif = (await missionLocaleEffectifsDb().findOne({ _id: id })) as IMissionLocaleEffectif;

      await expect(triggerWhatsAppIfEligible(effectif, mlId)).resolves.toBeUndefined();
    });
  });

  describe("reserveAndSendInjoignables", () => {
    it("envoie le template vers le numéro effectif, stocke ce numéro et trace l'envoi", async () => {
      const id = await insertEffectif();

      const result = await reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId });

      expect(result).toEqual({ outcome: "sent" });
      expect(upsertBrevoContact).toHaveBeenCalledWith("+33611111111", {
        TBA_EFFECTIF_PRENOM_WHATSAPP: "Jeanne",
        TBA_EFFECTIF_MISSION_LOCALE_NOM_WHATSAPP: "ML Test",
      });
      expect(sendWhatsAppTemplate).toHaveBeenCalledWith("+33611111111", { templateId: 7 });
      const after = await missionLocaleEffectifsDb().findOne({ _id: id });
      expect(after?.whatsapp_contact).toMatchObject({
        phone_normalized: "+33611111111",
        message_id: "tpl-1",
        message_status: "sent",
        conversation_state: "initial_sent",
      });
      expect(after?.whatsapp_contact?.last_message_sent_at).toBeInstanceOf(Date);
      expect(after?.whatsapp_contact?.messages_history).toEqual([
        expect.objectContaining({ direction: "outbound", brevo_message_id: "tpl-1" }),
      ]);
    });

    it("deux jobs pour le même effectif n'envoient qu'un message", async () => {
      const id = await insertEffectif();

      const [a, b] = await Promise.all([
        reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId }),
        reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId }),
      ]);

      expect([a.outcome, b.outcome].sort()).toEqual(["sent", "skipped"]);
      expect(sendWhatsAppTemplate).toHaveBeenCalledOnce();
    });

    it("ignore un effectif déjà contacté, désinscrit ou supprimé", async () => {
      const contacted = await insertEffectif({ whatsapp_contact: { last_message_sent_at: new Date() } });
      const optedOut = await insertEffectif({ whatsapp_contact: { opted_out: true } });
      const deleted = await insertEffectif({ soft_deleted: true });

      for (const id of [contacted, optedOut, deleted]) {
        expect(await reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId })).toMatchObject({
          outcome: "skipped",
        });
      }
      expect(sendWhatsAppTemplate).not.toHaveBeenCalled();
    });

    it("hors production sans numéro de test : aucun envoi", async () => {
      mutableConfig.brevo.whatsapp.testPhoneOverride = "";
      const id = await insertEffectif();

      expect(await reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId })).toEqual({
        outcome: "skipped",
        reason: "non_prod_sans_override",
      });
      expect(sendWhatsAppTemplate).not.toHaveBeenCalled();
    });

    it("refus Brevo (4xx) : effectif en failed et conversation close, pas de reprise", async () => {
      vi.mocked(sendWhatsAppTemplate).mockResolvedValue({
        success: false,
        status: 400,
        retryable: false,
        safeToRetry: false,
      });
      const id = await insertEffectif();

      expect(await reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId, canRetry: true })).toEqual({
        outcome: "failed",
        reason: "echec_brevo",
      });
      const after = await missionLocaleEffectifsDb().findOne({ _id: id });
      expect(after?.whatsapp_contact).toMatchObject({ message_status: "failed", conversation_state: "closed" });
    });

    it("timeout : pas de reprise (Brevo a pu envoyer), effectif en failed", async () => {
      vi.mocked(sendWhatsAppTemplate).mockResolvedValue({ success: false, retryable: true, safeToRetry: false });
      const id = await insertEffectif();

      expect(await reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId, canRetry: true })).toMatchObject(
        {
          outcome: "failed",
        }
      );
      const after = await missionLocaleEffectifsDb().findOne({ _id: id });
      expect(after?.whatsapp_contact?.message_status).toBe("failed");
    });

    it("503 avec reprise possible : effectif en failed_send, la reprise le réserve à nouveau", async () => {
      vi.mocked(sendWhatsAppTemplate).mockResolvedValueOnce({
        success: false,
        status: 503,
        retryable: true,
        safeToRetry: true,
      });
      const id = await insertEffectif();

      expect(await reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId, canRetry: true })).toEqual({
        outcome: "retry",
      });
      expect((await missionLocaleEffectifsDb().findOne({ _id: id }))?.whatsapp_contact?.message_status).toBe(
        "failed_send"
      );

      expect(
        await reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId, attempt: 2, canRetry: true })
      ).toEqual({
        outcome: "sent",
      });
      expect((await missionLocaleEffectifsDb().findOne({ _id: id }))?.whatsapp_contact?.message_status).toBe("sent");
    });

    it("une reprise ne réserve pas un effectif déjà envoyé", async () => {
      const id = await insertEffectif();
      await reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId });
      vi.mocked(sendWhatsAppTemplate).mockClear();

      expect(await reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId, attempt: 2 })).toMatchObject({
        outcome: "skipped",
      });
      expect(sendWhatsAppTemplate).not.toHaveBeenCalled();
    });

    it("une reprise ne touche pas un échec de la préqualif (template_type posé)", async () => {
      const id = await insertEffectif({
        whatsapp_contact: {
          last_message_sent_at: new Date(),
          message_status: "failed_send",
          template_type: "prequalif",
        },
      });

      expect(await reserveAndSendInjoignables({ effectifId: id, missionLocaleId: mlId, attempt: 2 })).toMatchObject({
        outcome: "skipped",
      });
      expect(sendWhatsAppTemplate).not.toHaveBeenCalled();
    });
  });

  describe("job whatsapp:send-initial", () => {
    it("replanifie avec attempt+1 et le délai prévu sur 503", async () => {
      vi.mocked(sendWhatsAppTemplate).mockResolvedValue({
        success: false,
        status: 503,
        retryable: true,
        safeToRetry: true,
      });
      const id = await insertEffectif();

      const result = await sendWhatsAppInitial({ effectifId: id, missionLocaleId: mlId, attempt: 1 });

      expect(result).toEqual({ outcome: "retry_scheduled", attempt: 2, delayMs: WHATSAPP_RETRY_DELAYS_MS[0] });
      expect(addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          name: WHATSAPP_INITIAL_JOB,
          payload: { effectifId: id.toString(), missionLocaleId: mlId.toString(), attempt: 2 },
          queued: true,
        })
      );
    });

    it("si la replanification échoue, clôt l'effectif au lieu de le laisser en failed_send", async () => {
      vi.mocked(sendWhatsAppTemplate).mockResolvedValue({
        success: false,
        status: 503,
        retryable: true,
        safeToRetry: true,
      });
      vi.mocked(addJob).mockRejectedValueOnce(new Error("mongo down"));
      const id = await insertEffectif();

      const result = await sendWhatsAppInitial({ effectifId: id, missionLocaleId: mlId, attempt: 1 });

      expect(result).toEqual({ outcome: "failed", reason: "replanification_impossible" });
      const doc = await missionLocaleEffectifsDb().findOne({ _id: id });
      expect(doc?.whatsapp_contact?.message_status).toBe("failed");
      expect(doc?.whatsapp_contact?.conversation_state).toBe("closed");
    });

    it("à la dernière tentative, clôt l'effectif au lieu de replanifier", async () => {
      vi.mocked(sendWhatsAppTemplate).mockResolvedValue({
        success: false,
        status: 503,
        retryable: true,
        safeToRetry: true,
      });
      const id = await insertEffectif({
        whatsapp_contact: { last_message_sent_at: new Date(), message_status: "failed_send" },
      });
      const last = WHATSAPP_RETRY_DELAYS_MS.length + 1;

      const result = await sendWhatsAppInitial({ effectifId: id, missionLocaleId: mlId, attempt: last });

      expect(result).toEqual({ outcome: "failed", reason: "tentatives_epuisees" });
      expect(addJob).not.toHaveBeenCalled();
      expect((await missionLocaleEffectifsDb().findOne({ _id: id }))?.whatsapp_contact).toMatchObject({
        message_status: "failed",
        conversation_state: "closed",
      });
    });

    it("handler du registre : exécute depuis le payload et refuse un payload incomplet", async () => {
      const id = await insertEffectif();
      const run = (payload: Record<string, unknown>) =>
        whatsappJobs[WHATSAPP_INITIAL_JOB].handler({ payload } as never);

      expect(await run({ effectifId: id.toString(), missionLocaleId: mlId.toString() })).toEqual({ outcome: "sent" });
      await expect(run({ effectifId: id.toString() })).rejects.toThrow(/missionLocaleId/);
    });
  });
});
