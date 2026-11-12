import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ObjectId } from "bson";
import { Collection } from "mongodb";
import type { IMissionLocaleEffectif } from "shared/models";
import {
  CONNAISSANCE_ML_ENUM,
  PROBLEME_TYPE_ENUM,
  SITUATION_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";
import { it, expect, describe, beforeEach, afterEach, vi } from "vitest";

import { normalisePersonIdentifiant } from "@/common/actions/personV2/personV2.actions";
import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { migrateAutreSituations } from "@/jobs/migration/migrate-autre-situations";
import { useMongo } from "@tests/jest/setupMongo";
import { testDocs } from "@tests/utils/testUtils";

const DATE_TRAITEMENT = new Date("2026-05-12T09:00:00Z");

function createMlEffectifDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    mission_locale_id: new ObjectId(),
    effectif_id: new ObjectId(),
    situation: SITUATION_ENUM.AUTRE,
    commentaires: "Le jeune a signé un CDI",
    date_traitement: DATE_TRAITEMENT,
    created_at: new Date("2026-01-01T00:00:00Z"),
    updated_at: DATE_TRAITEMENT,
    ...overrides,
  };
}

function writeCsv(lignes: Array<[ObjectId, string]>) {
  const path = join(mkdtempSync(join(tmpdir(), "autre-situations-")), "retour.csv");
  const contenu = ["_id,nouveau_motif", ...lignes.map(([id, motif]) => `${id.toString()},"${motif}"`)].join("\n");
  writeFileSync(path, contenu, "utf8");
  return path;
}

describe("migrateAutreSituations", () => {
  useMongo();

  beforeEach(async () => {
    await getDatabase().command({ collMod: "missionLocaleEffectif", validationLevel: "off" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requalifie chaque motif dans la situation attendue", async () => {
    const docs = {
      projet: createMlEffectifDoc(),
      neVeutPas: createMlEffectifDoc(),
      injoignable: createMlEffectifDoc(),
      rdvConnu: createMlEffectifDoc(),
      rdvNonConnu: createMlEffectifDoc(),
    };
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>(Object.values(docs)));

    await migrateAutreSituations({
      csvPath: writeCsv([
        [docs.projet._id, "en projet sécurisé"],
        [docs.neVeutPas._id, "ne veut pas d'accompagnement"],
        [docs.injoignable._id, "injoignable"],
        [docs.rdvConnu._id, "RDV pris jeune connu"],
        [docs.rdvNonConnu._id, "RDV pris jeune non connu"],
      ]),
      dryRun: false,
    });

    const after = new Map(
      (await missionLocaleEffectifsDb().find({}).toArray()).map((e) => [e._id.toString(), e] as const)
    );
    expect(after.get(docs.projet._id.toString())?.situation).toBe(SITUATION_ENUM.NOUVEAU_PROJET);
    expect(after.get(docs.neVeutPas._id.toString())?.situation).toBe(SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT);
    expect(after.get(docs.injoignable._id.toString())?.situation).toBe(SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES);
    expect(after.get(docs.rdvConnu._id.toString())).toMatchObject({
      situation: SITUATION_ENUM.RDV_PRIS,
      connaissance_ml: CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE,
      deja_connu: true,
    });
    expect(after.get(docs.rdvNonConnu._id.toString())).toMatchObject({
      situation: SITUATION_ENUM.RDV_PRIS,
      connaissance_ml: CONNAISSANCE_ML_ENUM.NON_CONNU,
      deja_connu: false,
    });
    for (const doc of Object.values(docs)) {
      expect(after.get(doc._id.toString())?.date_traitement).toEqual(DATE_TRAITEMENT);
      expect(after.get(doc._id.toString())?.updated_at).toEqual(DATE_TRAITEMENT);
      expect(after.get(doc._id.toString())?.commentaires).toBe("Le jeune a signé un CDI");
    }
    expect(await missionLocaleEffectifsLogDb().countDocuments({ created_by: null })).toBe(5);
  });

  it("remet un dossier à recontacter dans la liste, daté du passage", async () => {
    const doc = createMlEffectifDoc({ commentaires: "Message laissé, à rappeler" });
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>([doc]));

    await migrateAutreSituations({ csvPath: writeCsv([[doc._id, "à recontacter"]]), dryRun: false });

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    const log = await missionLocaleEffectifsLogDb().findOne({ mission_locale_effectif_id: doc._id });
    expect(after?.situation).toBe(SITUATION_ENUM.CONTACTE_SANS_RETOUR);
    expect(after?.date_traitement).toBeNull();
    expect(after?.date_dernier_passage_a_recontacter).toEqual(log?.created_at);
    expect(after?.date_dernier_passage_a_recontacter?.getTime()).toBeGreaterThan(DATE_TRAITEMENT.getTime());
  });

  it("garde l'accompagnement actif d'un jeune connu", async () => {
    const doc = createMlEffectifDoc({ connaissance_ml: CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT });
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>([doc]));

    await migrateAutreSituations({ csvPath: writeCsv([[doc._id, "RDV pris jeune connu"]]), dryRun: false });

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    const log = await missionLocaleEffectifsLogDb().findOne({ mission_locale_effectif_id: doc._id });
    expect(after).toMatchObject({
      situation: SITUATION_ENUM.RDV_PRIS,
      connaissance_ml: CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT,
      deja_connu: true,
    });
    expect(log?.connaissance_ml).toBe(CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT);
  });

  it("recopie dans le log le texte saisi par la ML sur le dossier", async () => {
    const doc = createMlEffectifDoc({
      situation_autre: "Retour en formation initiale",
      commentaires: "Inscrit au lycée pro",
      probleme_type: PROBLEME_TYPE_ENUM.AUTRE,
      probleme_detail: "Déménagement",
    });
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>([doc]));

    await migrateAutreSituations({ csvPath: writeCsv([[doc._id, "en projet sécurisé"]]), dryRun: false });

    const logs = await missionLocaleEffectifsLogDb().find({ mission_locale_effectif_id: doc._id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      situation: SITUATION_ENUM.NOUVEAU_PROJET,
      situation_autre: "Retour en formation initiale",
      commentaires: "Inscrit au lycée pro",
      probleme_type: PROBLEME_TYPE_ENUM.AUTRE,
      probleme_detail: "Déménagement",
      created_by: null,
    });
  });

  it("laisse intacts les motifs autre ou vides et les dossiers qui ne sont plus en AUTRE", async () => {
    const autre = createMlEffectifDoc();
    const vide = createMlEffectifDoc();
    const dejaTraite = createMlEffectifDoc({ situation: SITUATION_ENUM.RDV_PRIS });
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>([autre, vide, dejaTraite]));

    await migrateAutreSituations({
      csvPath: writeCsv([
        [autre._id, "autre"],
        [vide._id, ""],
        [dejaTraite._id, "injoignable"],
      ]),
      dryRun: false,
    });

    const situations = new Map(
      (await missionLocaleEffectifsDb().find({}).toArray()).map((e) => [e._id.toString(), e.situation] as const)
    );
    expect(situations.get(autre._id.toString())).toBe(SITUATION_ENUM.AUTRE);
    expect(situations.get(vide._id.toString())).toBe(SITUATION_ENUM.AUTRE);
    expect(situations.get(dejaTraite._id.toString())).toBe(SITUATION_ENUM.RDV_PRIS);
    expect(await missionLocaleEffectifsLogDb().countDocuments({})).toBe(0);
  });

  it("requalifie le dossier conservé quand la ligne pointe un doublon fusionné", async () => {
    const date_de_naissance = new Date("2008-03-02T00:00:00Z");
    const donor = createMlEffectifDoc({
      soft_deleted: true,
      effectif_snapshot: { apprenant: { nom: "durand ", prenom: "léa", date_de_naissance } },
    });
    const keeper = createMlEffectifDoc({
      commentaires: "Reprise du dossier fusionné",
      identifiant_normalise: normalisePersonIdentifiant({ nom: "DURAND", prenom: "Léa", date_de_naissance }),
    });
    const orphelin = createMlEffectifDoc({
      soft_deleted: true,
      effectif_snapshot: { apprenant: { nom: "MARTIN", prenom: "Jade", date_de_naissance } },
    });
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>([donor, keeper, orphelin]));

    const report = await migrateAutreSituations({
      csvPath: writeCsv([
        [donor._id, "injoignable"],
        [keeper._id, "en projet sécurisé"],
        [orphelin._id, "injoignable"],
      ]),
      dryRun: false,
    });

    const situations = new Map(
      (await missionLocaleEffectifsDb().find({}).toArray()).map((e) => [e._id.toString(), e.situation] as const)
    );
    expect(situations.get(keeper._id.toString())).toBe(SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES);
    expect(situations.get(donor._id.toString())).toBe(SITUATION_ENUM.AUTRE);
    expect(situations.get(orphelin._id.toString())).toBe(SITUATION_ENUM.AUTRE);
    const logs = await missionLocaleEffectifsLogDb().find({}).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      mission_locale_effectif_id: keeper._id,
      commentaires: "Reprise du dossier fusionné",
    });
    expect(report.redirigesVersKeeper).toEqual([`${donor._id.toString()} (keeper ${keeper._id.toString()})`]);
    expect(report.dejaCibles).toEqual([keeper._id.toString()]);
    expect(report.softDeletedSansKeeper).toEqual([orphelin._id.toString()]);
  });

  it("ne journalise pas un dossier modifié par une ML pendant le passage", async () => {
    const doc = createMlEffectifDoc();
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>([doc]));
    const bulkWrite = Collection.prototype.bulkWrite;
    vi.spyOn(Collection.prototype, "bulkWrite").mockImplementationOnce(async function (
      this: Collection,
      ...args: Parameters<Collection["bulkWrite"]>
    ) {
      await missionLocaleEffectifsDb().updateOne({ _id: doc._id }, { $set: { situation: SITUATION_ENUM.RDV_PRIS } });
      return bulkWrite.apply(this, args);
    });

    const report = await migrateAutreSituations({ csvPath: writeCsv([[doc._id, "injoignable"]]), dryRun: false });

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.situation).toBe(SITUATION_ENUM.RDV_PRIS);
    expect(await missionLocaleEffectifsLogDb().countDocuments({})).toBe(0);
    expect(report.nonModifies).toEqual([doc._id.toString()]);
  });

  it("n'écrit rien en dry-run", async () => {
    const doc = createMlEffectifDoc();
    await missionLocaleEffectifsDb().insertMany(testDocs<IMissionLocaleEffectif>([doc]));

    await migrateAutreSituations({ csvPath: writeCsv([[doc._id, "à recontacter"]]), dryRun: true });

    const after = await missionLocaleEffectifsDb().findOne({ _id: doc._id });
    expect(after?.situation).toBe(SITUATION_ENUM.AUTRE);
    expect(after?.date_traitement).toEqual(DATE_TRAITEMENT);
    expect(await missionLocaleEffectifsLogDb().countDocuments({})).toBe(0);
  });
});
