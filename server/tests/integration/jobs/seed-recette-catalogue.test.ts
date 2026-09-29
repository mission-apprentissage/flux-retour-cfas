import type { IOrganisationMissionLocale } from "shared/models";
import { API_EFFECTIF_LISTE } from "shared/models/data/missionLocaleEffectif.model";
import { beforeAll, describe, expect, it, afterAll } from "vitest";

import {
  getAllEffectifsParMois,
  getEffectifsFusionnesByMissionLocaleId,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { organisationsDb, modelDescriptors } from "@/common/model/collections";
import { clearAllCollections, configureDbSchemaValidation } from "@/common/mongodb";
import { CATALOGUE } from "@/jobs/seed-recette/catalogue";
import type { SeedRecetteHosts } from "@/jobs/seed-recette/hosts";
import { seedRecette, type SeedRecetteReport } from "@/jobs/seed-recette/seed-recette";
import { startAndConnectMongodb, stopMongodb } from "@tests/utils/mongoUtils";

import { insertSeedRecetteHosts } from "./seed-recette.hosts";

const LISTES_FUSIONNEES = [
  API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER,
  API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER_PRIORITAIRE,
] as const;

type Ligne = Record<string, unknown>;

describe("catalogue du seed recette", () => {
  let hosts: SeedRecetteHosts;
  let report: SeedRecetteReport;
  const listes = new Map<string, Ligne[]>();

  beforeAll(async () => {
    await startAndConnectMongodb();
    await configureDbSchemaValidation(modelDescriptors);
    await clearAllCollections();
    hosts = await insertSeedRecetteHosts();
    report = await seedRecette({ hosts, env: "test" });

    for (const [code, id] of Object.entries(hosts.missionsLocales)) {
      const ml = (await organisationsDb().findOne({ _id: id })) as IOrganisationMissionLocale;
      for (const liste of LISTES_FUSIONNEES) {
        const { effectifs } = await getEffectifsFusionnesByMissionLocaleId(ml, liste);
        listes.set(`${code}:${liste}`, effectifs);
      }
      const { traite } = await getAllEffectifsParMois(ml);
      listes.set(
        `${code}:${API_EFFECTIF_LISTE.TRAITE}`,
        traite.flatMap((mois) => mois.data as Ligne[])
      );
    }
  }, 60_000);

  afterAll(async () => {
    await stopMongodb();
  });

  it("crée un dossier ML par cas du catalogue", () => {
    expect(report.crees?.missionLocaleEffectif).toBe(CATALOGUE.filter((c) => c.attendu.ml).length);
    expect(report.crees?.usersMigration).toBeGreaterThan(0);
  });

  it.each(CATALOGUE.filter((c) => c.attendu.ml).map((c) => [c.code, c] as const))("%s", (_code, seedCase) => {
    const attendu = seedCase.attendu.ml!;
    const trouve = (liste: string) =>
      listes.get(`${attendu.ml}:${liste}`)?.find((ligne) => ligne.nom === seedCase.code);

    const aTraiter = trouve(API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER);
    const traite = trouve(API_EFFECTIF_LISTE.TRAITE);
    const prioritaire = trouve(API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER_PRIORITAIRE);

    expect(Boolean(aTraiter)).toBe(attendu.liste === "a_traiter_ou_recontacter");
    expect(Boolean(traite)).toBe(attendu.liste === "traite");
    expect(Boolean(prioritaire)).toBe(attendu.dansPrioritaires ?? false);

    if (aTraiter && attendu.indicateurs) {
      expect(aTraiter).toMatchObject(attendu.indicateurs);
    }
  });
});
