import type { IOrganisationMissionLocale, IOrganisationOrganismeFormation } from "shared/models";
import { API_EFFECTIF_LISTE } from "shared/models/data/missionLocaleEffectif.model";
import { CFA_SUIVI_CATEGORY } from "shared/models/routes/organismes/cfa/cfa.api";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getCfaEffectifsEnRupture } from "@/common/actions/cfa/cfa-effectifs-ruptures.actions";
import { getCfaEffectifs } from "@/common/actions/cfa/cfa-effectifs.actions";
import { getCfaSuiviMissionLocale } from "@/common/actions/cfa/cfa-suivi-mission-locale.actions";
import {
  getAllEffectifsParMois,
  getEffectifsFusionnesByMissionLocaleId,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { normalisePersonIdentifiant } from "@/common/actions/personV2/personV2.actions";
import {
  effectifsDb,
  effectifsDECADb,
  modelDescriptors,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";
import { clearAllCollections, configureDbSchemaValidation } from "@/common/mongodb";
import { CATALOGUE } from "@/jobs/seed-recette/catalogue";
import type { SeedCase } from "@/jobs/seed-recette/catalogue/types";
import { CFA_HOST_CODES, type SeedRecetteHosts } from "@/jobs/seed-recette/hosts";
import { identite } from "@/jobs/seed-recette/identites";
import { seedRecette, type SeedRecetteReport } from "@/jobs/seed-recette/seed-recette";
import { startAndConnectMongodb, stopMongodb } from "@tests/utils/mongoUtils";

import { insertSeedRecetteHosts } from "./seed-recette.hosts";

const LISTES_FUSIONNEES = [
  API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER,
  API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER_PRIORITAIRE,
  API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER,
  API_EFFECTIF_LISTE.COLLAB_TRAITE,
] as const;

const PAGE = { page: 1, limit: 500, order: "asc" as const };

type Ligne = Record<string, unknown>;

const nomNormalise = (n: number) => {
  const { nom, prenom } = identite(n);
  return normalisePersonIdentifiant({ nom, prenom, date_de_naissance: new Date() });
};

const estLeCas = (n: number) => (ligne: Ligne) => {
  const attendu = nomNormalise(n);
  return (
    String(ligne.nom).toUpperCase() === attendu.nom &&
    String(ligne.prenom).toLowerCase() === attendu.prenom.toLowerCase()
  );
};

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

    for (const code of CFA_HOST_CODES) {
      const { organisationId, organismeId } = hosts.cfas[code];
      const organisation = (await organisationsDb().findOne({
        _id: organisationId,
      })) as IOrganisationOrganismeFormation;
      const isAllowedDeca = (await organismesDb().findOne({ _id: organismeId }))?.is_allowed_deca ?? false;

      const ruptures = await getCfaEffectifsEnRupture(organisation, isAllowedDeca, { ...PAGE, sort: "date_rupture" });
      listes.set(`${code}:ruptures`, ruptures.effectifs as unknown as Ligne[]);
      for (const category of [CFA_SUIVI_CATEGORY.COLLAB, CFA_SUIVI_CATEGORY.HORS_COLLAB]) {
        const suivi = await getCfaSuiviMissionLocale(organisation, isAllowedDeca, { ...PAGE, category, sort: "nom" });
        listes.set(`${code}:suivi:${category}`, suivi.effectifs as unknown as Ligne[]);
      }
      const effectifs = await getCfaEffectifs(organisation, isAllowedDeca, { ...PAGE, sort: "nom" });
      listes.set(`${code}:effectifs`, effectifs.effectifs as unknown as Ligne[]);
    }
  }, 60_000);

  afterAll(async () => {
    await stopMongodb();
  });

  it("crée un dossier ML par cas qui en attend un, et les comptes", () => {
    expect(report.crees?.missionLocaleEffectif).toBe(
      CATALOGUE.filter((c) => c.attendu.ml || c.attendu.cfa?.ruptures || c.attendu.cfa?.suivi).length
    );
    expect(report.crees?.usersMigration).toBe(7);
    expect(report.crees?.missionLocaleCfaInvitations).toBe(1);
  });

  const casMl = CATALOGUE.filter((c) => c.attendu.ml);
  it.each(casMl.map((c) => [c.code, c] as const))("ML — %s", (_code, seedCase: SeedCase) => {
    const attendu = seedCase.attendu.ml!;
    const trouve = (liste: string) => listes.get(`${attendu.ml}:${liste}`)?.find(estLeCas(seedCase.n));

    const aTraiter = trouve(API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER);
    const traite = trouve(API_EFFECTIF_LISTE.TRAITE);
    const prioritaire = trouve(API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER_PRIORITAIRE);
    const collab =
      trouve(API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER) ?? trouve(API_EFFECTIF_LISTE.COLLAB_TRAITE);

    expect(Boolean(aTraiter)).toBe(attendu.liste === "a_traiter_ou_recontacter");
    expect(Boolean(traite)).toBe(attendu.liste === "traite");
    expect(Boolean(prioritaire)).toBe(attendu.dansPrioritaires ?? false);
    expect(Boolean(collab)).toBe(attendu.dansCollaborations ?? false);

    if (aTraiter && attendu.indicateurs) {
      expect(aTraiter).toMatchObject(attendu.indicateurs);
    }
  });

  const casCfa = CATALOGUE.filter((c) => c.attendu.cfa);
  it.each(casCfa.map((c) => [c.code, c] as const))("CFA — %s", async (_code, seedCase: SeedCase) => {
    const attendu = seedCase.attendu.cfa!;
    const trouve = (liste: string) => listes.get(`${attendu.cfa}:${liste}`)?.find(estLeCas(seedCase.n));

    const rupture = trouve("ruptures");
    expect(rupture ? (rupture.is_transmis_auto ? "plus_45j" : "moins_45j") : null).toBe(attendu.ruptures);

    const collab = trouve(`suivi:${CFA_SUIVI_CATEGORY.COLLAB}`);
    const horsCollab = trouve(`suivi:${CFA_SUIVI_CATEGORY.HORS_COLLAB}`);
    expect(collab ? "collab" : horsCollab ? "hors_collab" : null).toBe(attendu.suivi ?? null);

    if (attendu.collabStatus) {
      expect(rupture?.collab_status ?? collab?.collab_status ?? horsCollab?.collab_status).toBe(attendu.collabStatus);
    }

    if (attendu.dansEffectifs) {
      expect(trouve("effectifs")).toBeDefined();
    }

    if (attendu.statutEffectif) {
      const { nom, prenom } = identite(seedCase.n);
      const effectif =
        (await effectifsDb().findOne({ "apprenant.nom": nom, "apprenant.prenom": prenom })) ??
        (await effectifsDECADb().findOne({ "apprenant.nom": nom, "apprenant.prenom": prenom }));
      expect(effectif?._computed?.statut?.en_cours).toBe(attendu.statutEffectif);
    }
  });
});
