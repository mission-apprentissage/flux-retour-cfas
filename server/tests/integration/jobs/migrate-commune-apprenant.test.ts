import type { ICommune } from "api-alternance-sdk";
import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { communesVoiesDb, effectifsDb, effectifsDECADb, missionLocaleEffectifsDb } from "@/common/model/collections";
import { clearCache } from "@/common/utils/cacheUtils";
import { migrateCommuneApprenant } from "@/jobs/migration/migrate-commune-apprenant";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

vi.mock("@/common/apis/apiAlternance/client", () => ({
  apiAlternanceClient: { geographie: { rechercheCommune: vi.fn() } },
}));

function commune(insee: string, nom: string, missionLocaleId: number): ICommune {
  return {
    nom,
    code: { insee, postaux: ["02100"] },
    anciennes: [],
    arrondissements: [],
    departement: { nom: "Aisne", codeInsee: "02" },
    region: { nom: "Hauts-de-France", codeInsee: "32" },
    academie: { id: "A20", code: "20", nom: "Amiens" },
    localisation: {
      centre: { type: "Point", coordinates: [3.28, 49.84] },
      bbox: { type: "Polygon", coordinates: [] },
    },
    mission_locale: { id: missionLocaleId } as ICommune["mission_locale"],
  };
}

const adresseDevinee = {
  code_postal: "02100",
  code_insee: "02288",
  commune: "Essigny-le-Petit",
  departement: "02",
  region: "32",
  academie: "20",
  mission_locale_id: 486,
} as const;

async function insererEffectif(adresse: Record<string, unknown>) {
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme() };
  const effectif = { _id: new ObjectId(), ...(await createSampleEffectif({ organisme, apprenant: { adresse } })) };
  await effectifsDb().insertOne(testDoc<IEffectif>(effectif));
  return effectif;
}

async function insererEffectifDECA(adresse: Record<string, unknown>) {
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme() };
  const effectif = {
    _id: new ObjectId(),
    deca_raw_id: new ObjectId(),
    ...(await createSampleEffectif({ organisme, apprenant: { adresse }, source: SOURCE_APPRENANT.DECA })),
  };
  await effectifsDECADb().insertOne(testDoc<IEffectifDECA>(effectif));
  return effectif;
}

async function insererDossierMl(effectif: { _id: ObjectId }) {
  const dossier = {
    _id: new ObjectId(),
    mission_locale_id: new ObjectId(),
    effectif_id: effectif._id,
    effectif_snapshot: effectif,
    effectif_snapshot_date: new Date(),
    created_at: new Date(),
    current_status: { value: null, date: null },
    brevo: { token: null, token_created_at: null },
    soft_deleted: false,
  };
  await missionLocaleEffectifsDb().insertOne(testDoc<IMissionLocaleEffectif>(dossier));
  return dossier;
}

describe("migrateCommuneApprenant", () => {
  useMongo();

  beforeEach(async () => {
    clearCache();
    vi.mocked(apiAlternanceClient.geographie.rechercheCommune).mockResolvedValue([
      commune("02288", "Essigny-le-Petit", 486),
      commune("02525", "Morcourt", 999),
      commune("02691", "Saint-Quentin", 486),
    ]);
    await communesVoiesDb().insertOne({
      _id: "02100",
      communes: [
        { code_insee: "02691", nom: "Saint-Quentin", population: 52813 },
        { code_insee: "02288", nom: "Essigny-le-Petit", population: 345 },
        { code_insee: "02525", nom: "Morcourt", population: 500 },
      ],
      voies: [
        { nom: "rue sentier", code_insee: ["02691"] },
        { nom: "rue maurice duverget", code_insee: ["02525"] },
        { nom: "rue ecoles", code_insee: ["02288"] },
      ],
      updated_at: new Date(),
    });
  });

  it("corrige la commune devinée d'un effectif ERP et le snapshot de son dossier ML", async () => {
    const effectif = await insererEffectif({ ...adresseDevinee, complete: "138 rue du Sentier" });
    const dossier = await insererDossierMl(effectif);

    const { rapport, changementsMl } = await migrateCommuneApprenant({ dryRun: false });

    const apres = await effectifsDb().findOne({ _id: effectif._id });
    expect(apres?.apprenant.adresse).toMatchObject({
      code_postal: "02100",
      code_insee: "02691",
      commune: "Saint-Quentin",
      mission_locale_id: 486,
      complete: "138 rue du Sentier",
    });
    const dossierApres = await missionLocaleEffectifsDb().findOne({ _id: dossier._id });
    expect(dossierApres?.effectif_snapshot.apprenant.adresse).toMatchObject({
      code_insee: "02691",
      commune: "Saint-Quentin",
    });
    expect(dossierApres?.mission_locale_id).toEqual(dossier.mission_locale_id);
    expect(rapport.effectifs).toMatchObject({ devines: 1, modifies: 1, snapshots_ml: 1, changements_ml: 0 });
    expect(rapport.effectifs.methodes.voie).toBe(1);
    expect(changementsMl).toEqual([]);
  });

  it("corrige un effectif DECA à partir du numéro et de la voie et signale le changement de ML", async () => {
    const effectif = await insererEffectifDECA({ ...adresseDevinee, numero: 24, voie: "RUE MAURICE DUVERGET" });

    const { rapport, changementsMl } = await migrateCommuneApprenant({ dryRun: false });

    expect((await effectifsDECADb().findOne({ _id: effectif._id }))?.apprenant.adresse).toMatchObject({
      code_insee: "02525",
      commune: "Morcourt",
      mission_locale_id: 999,
    });
    expect(rapport.effectifsDECA.changements_ml).toBe(1);
    expect(changementsMl).toEqual([{ effectif_id: effectif._id, ancien_ml_id: 486, nouveau_ml_id: 999 }]);
  });

  it("ne touche pas une commune transmise par l'ERP", async () => {
    const effectif = await insererEffectif({
      ...adresseDevinee,
      code_insee: "02525",
      commune: "Morcourt",
      complete: "138 rue du Sentier",
    });

    const { rapport } = await migrateCommuneApprenant({ dryRun: false });

    expect((await effectifsDb().findOne({ _id: effectif._id }))?.apprenant.adresse?.code_insee).toBe("02525");
    expect(rapport.effectifs).toMatchObject({ examines: 1, devines: 0, modifies: 0 });
  });

  it("laisse inchangée une commune devinée que l'adresse confirme", async () => {
    await insererEffectif({ ...adresseDevinee, complete: "3 rue des Écoles" });

    const { rapport } = await migrateCommuneApprenant({ dryRun: false });

    expect(rapport.effectifs).toMatchObject({ devines: 1, inchanges: 1, modifies: 0 });
  });

  it("n'écrit rien en simulation", async () => {
    const effectif = await insererEffectif({ ...adresseDevinee, complete: "138 rue du Sentier" });

    const { rapport } = await migrateCommuneApprenant({ dryRun: true });

    expect((await effectifsDb().findOne({ _id: effectif._id }))?.apprenant.adresse?.code_insee).toBe("02288");
    expect(rapport.effectifs.modifies).toBe(1);
  });

  it("refuse de tourner sans référentiel", async () => {
    await communesVoiesDb().deleteMany({});

    await expect(migrateCommuneApprenant({ dryRun: true })).rejects.toThrow(/hydrate:communes-voies/);
  });
});
