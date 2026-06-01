import { subMonths } from "date-fns";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { describe, it, expect, beforeEach } from "vitest";

import { auditLogsDb, organismesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { revokeStaleApiKeysJob } from "./revoke-stale-api-keys";

useMongo();

const recent = subMonths(new Date(), 1);
const old = subMonths(new Date(), 13);

const organismes = {
  // transmise récemment → conservée
  activeRecentTransmission: generateOrganismeFixture({
    siret: "42334912500066",
    uai: "0133336F",
    api_key: "key-active-recent",
    last_transmission_date: recent,
  }),
  // transmise il y a plus de 12 mois → révoquée
  staleOldTransmission: generateOrganismeFixture({
    siret: "13002975400020",
    uai: "0597114M",
    api_key: "key-stale-transmission",
    last_erp_transmission_date: old,
  }),
  // aucun signal d'activité → révoquée (clé orpheline > 12 mois)
  staleNoSignal: generateOrganismeFixture({
    siret: "19240007500011",
    uai: "0932751K",
    api_key: "key-no-signal",
  }),
  // fraîchement générée (jamais transmis) → conservée
  freshlyGenerated: generateOrganismeFixture({
    siret: "19590065900028",
    uai: "0802230P",
    api_key: "key-fresh",
    api_key_generated_at: recent,
  }),
  // pas de clé → ignorée
  noKey: generateOrganismeFixture({
    siret: "26220009000278",
    uai: "0133336G",
    api_key: null,
    last_transmission_date: old,
  }),
};

const reload = (id) => organismesDb().findOne({ _id: id });

describe("revokeStaleApiKeysJob", () => {
  beforeEach(async () => {
    await organismesDb().insertMany(Object.values(organismes));
  });

  it("révoque les clés inactives depuis plus de 12 mois (transmises ou non) et conserve les actives", async () => {
    await revokeStaleApiKeysJob();

    const active = await reload(organismes.activeRecentTransmission._id);
    const staleTransmission = await reload(organismes.staleOldTransmission._id);
    const staleNoSignal = await reload(organismes.staleNoSignal._id);
    const fresh = await reload(organismes.freshlyGenerated._id);
    const noKey = await reload(organismes.noKey._id);

    // conservées
    expect(active?.api_key).toBe("key-active-recent");
    expect(active?.api_key_revoked_at).toBeFalsy();
    expect(fresh?.api_key).toBe("key-fresh");
    expect(fresh?.api_key_revoked_at).toBeFalsy();

    // révoquées : le secret quitte api_key mais est archivé dans api_key_revoked_value
    expect(staleTransmission?.api_key).toBeFalsy();
    expect(staleTransmission?.api_key_revoked_value).toBe("key-stale-transmission");
    expect(staleTransmission?.api_key_revoked_at).toBeInstanceOf(Date);
    expect(staleTransmission?.api_key_revoked_reason).toBe("inactif_12_mois");
    expect(staleNoSignal?.api_key).toBeFalsy();
    expect(staleNoSignal?.api_key_revoked_value).toBe("key-no-signal");
    expect(staleNoSignal?.api_key_revoked_at).toBeInstanceOf(Date);

    // pas de clé → inchangé
    expect(noKey?.api_key_revoked_at).toBeFalsy();

    // une entrée d'audit par révocation
    const audits = await auditLogsDb().find({ action: "organisme_api_key_revoked" }).toArray();
    expect(audits).toHaveLength(2);
  });

  it("ne modifie rien en dry-run", async () => {
    await revokeStaleApiKeysJob({ dryRun: true });

    const staleTransmission = await reload(organismes.staleOldTransmission._id);
    const staleNoSignal = await reload(organismes.staleNoSignal._id);

    expect(staleTransmission?.api_key).toBe("key-stale-transmission");
    expect(staleTransmission?.api_key_revoked_at).toBeFalsy();
    expect(staleNoSignal?.api_key).toBe("key-no-signal");

    const audits = await auditLogsDb().countDocuments({ action: "organisme_api_key_revoked" });
    expect(audits).toBe(0);
  });

  it("est idempotent (un 2e passage ne révoque plus rien)", async () => {
    await revokeStaleApiKeysJob();
    const auditsAfterFirst = await auditLogsDb().countDocuments({ action: "organisme_api_key_revoked" });

    await revokeStaleApiKeysJob();
    const auditsAfterSecond = await auditLogsDb().countDocuments({ action: "organisme_api_key_revoked" });

    expect(auditsAfterFirst).toBe(2);
    expect(auditsAfterSecond).toBe(2);
  });

  it("respecte la limite", async () => {
    await revokeStaleApiKeysJob({ limit: 1 });

    const audits = await auditLogsDb().countDocuments({ action: "organisme_api_key_revoked" });
    expect(audits).toBe(1);
  });
});
