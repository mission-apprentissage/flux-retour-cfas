import { ObjectId } from "bson";
import type { IOrganisationMissionLocale, IOrganisationOrganismeFormation, IOrganisme } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { beforeEach, describe, expect, it } from "vitest";

import { buildOrgaMl, buildOrgaOf, buildOrganisme } from "@/common/actions/brevo/contacts/fixtures";
import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import {
  buildDossierMl,
  buildEffectifDeca,
  buildEffectifErp,
  buildLog,
  buildPersonne,
  buildUser,
  jour,
  loadSeedContext,
  type SeedContext,
} from "@/jobs/seed-recette/factories";
import { CFA_HOST_CODES, type SeedRecetteHosts } from "@/jobs/seed-recette/hosts";
import { isSeedId } from "@/jobs/seed-recette/seed-ids";
import { useMongo } from "@tests/jest/setupMongo";

const NOW = new Date("2026-09-29T10:00:00.000Z");

async function insertHosts(): Promise<SeedRecetteHosts> {
  const mlA = buildOrgaMl("ML A", { ml_id: 569, activated_at: new Date("2026-04-01T00:00:00.000Z") });
  const { activated_at: _nonActivee, ...mlB } = buildOrgaMl("ML B", { ml_id: 39 });
  await organisationsDb().insertMany([mlA as IOrganisationMissionLocale, mlB as IOrganisationMissionLocale]);

  const cfas = {} as SeedRecetteHosts["cfas"];
  for (const code of CFA_HOST_CODES) {
    const orgaOf = buildOrgaOf();
    const organisme = buildOrganisme(orgaOf, {
      is_allowed_collab: code === "CFA_ON",
      adresse: { region: "11", departement: "94", commune: "Cachan" },
    });
    await organismesDb().insertOne(organisme as IOrganisme);
    await organisationsDb().insertOne({
      ...orgaOf,
      ...(code === "CFA_ON" ? { ml_beta_activated_at: new Date("2026-05-01T00:00:00.000Z") } : {}),
    } as IOrganisationOrganismeFormation);
    cfas[code] = { organisationId: orgaOf._id, organismeId: organisme._id };
  }

  return { missionsLocales: { ML_A: mlA._id, ML_B: mlB._id }, cfas };
}

const parcoursRupture = (ctx: SeedContext, joursDepuisRupture: number) => ({
  dateEntree: jour(ctx, -300),
  dateFin: jour(ctx, 400),
  contrats: [{ debut: jour(ctx, -290), fin: jour(ctx, 400), rupture: jour(ctx, -joursDepuisRupture) }],
});

describe("fabriques du seed recette", () => {
  useMongo();

  let ctx: SeedContext;

  beforeEach(async () => {
    const hosts = await insertHosts();
    ctx = await loadSeedContext(hosts, NOW);
  });

  it("construit une personne unique, mineure ou majeure, avec un téléphone hors WhatsApp", () => {
    const mineur = buildPersonne(ctx, { n: 3, nom: "A03 MINEUR", age: 17 });
    const rqth = buildPersonne(ctx, { n: 4, nom: "A04 RQTH", age: 28, rqth: true });

    expect(mineur.date_de_naissance > new Date("2008-09-29T00:00:00.000Z")).toBe(true);
    expect(mineur.date_de_naissance < new Date("2009-09-29T00:00:00.000Z")).toBe(true);
    expect(rqth.rqth).toBe(true);
    expect(mineur.telephone).toBe("0639980003");
    expect(mineur.courriel).toMatch(/@seed\.recette\.invalid$/);
  });

  it("produit un effectif ERP en rupture, accepté par le validateur Mongo", async () => {
    const personne = buildPersonne(ctx, { n: 1, nom: "A01 STANDARD", age: 20 });
    const effectif = await buildEffectifErp(ctx, {
      n: 1,
      cfa: "CFA_SANS",
      ml: "ML_A",
      personne,
      parcours: parcoursRupture(ctx, 60),
    });

    await effectifsDb().insertOne(effectif);

    expect(isSeedId(effectif._id)).toBe(true);
    expect(effectif.annee_scolaire).toBe("2025-2026");
    expect(effectif.apprenant.adresse?.mission_locale_id).toBe(569);
    expect(effectif._computed?.statut?.en_cours).toBe("RUPTURANT");
  });

  it("produit un effectif DECA compatible, accepté par le validateur Mongo", async () => {
    const personne = buildPersonne(ctx, { n: 2, nom: "A02 DECA", age: 20 });
    const effectif = await buildEffectifDeca(ctx, {
      n: 2,
      cfa: "CFA_SANS",
      ml: "ML_A",
      personne,
      parcours: parcoursRupture(ctx, 60),
    });

    await effectifsDECADb().insertOne(effectif);

    expect(effectif.is_deca_compatible).toBe(true);
    expect(effectif.source).toBe("DECA");
  });

  it("produit un dossier ML aligné sur la création réelle, accepté par le validateur Mongo", async () => {
    const personne = buildPersonne(ctx, { n: 1, nom: "A01 STANDARD", age: 20 });
    const effectif = await buildEffectifErp(ctx, {
      n: 1,
      cfa: "CFA_ON",
      ml: "ML_A",
      personne,
      parcours: parcoursRupture(ctx, 60),
    });
    const dossier = buildDossierMl(ctx, { n: 1, effectif, ml: "ML_A", cfa: "CFA_ON" });

    await effectifsDb().insertOne(effectif);
    await missionLocaleEffectifsDb().insertOne(dossier);

    expect(dossier.current_status).toEqual({ value: "RUPTURANT", date: jour(ctx, -60) });
    expect(dossier.date_rupture).toEqual(jour(ctx, -60));
    expect(dossier.created_at).toEqual(jour(ctx, -59));
    expect(dossier.identifiant_normalise).toEqual({
      nom: "A01 STANDARD",
      prenom: "Sacha",
      date_de_naissance: personne.date_de_naissance,
    });
    expect(dossier.computed).toEqual({
      organisme: { ml_beta_activated_at: new Date("2026-05-01T00:00:00.000Z"), is_allowed_collab: true },
      mission_locale: { activated_at: new Date("2026-04-01T00:00:00.000Z") },
    });
  });

  it("garde la date de rupture d'un jeune reparti en contrat", async () => {
    const personne = buildPersonne(ctx, { n: 11, nom: "A11 NOUVEAU CONTRAT", age: 20 });
    const effectif = await buildEffectifErp(ctx, {
      n: 11,
      cfa: "CFA_SANS",
      ml: "ML_A",
      personne,
      parcours: {
        dateEntree: jour(ctx, -300),
        dateFin: jour(ctx, 400),
        contrats: [
          { debut: jour(ctx, -290), fin: jour(ctx, 400), rupture: jour(ctx, -60) },
          { debut: jour(ctx, -20), fin: jour(ctx, 400) },
        ],
      },
    });
    const dossier = buildDossierMl(ctx, { n: 11, effectif, ml: "ML_A", cfa: "CFA_SANS" });

    expect(dossier.current_status.value).toBe("APPRENTI");
    expect(dossier.date_rupture).toEqual(jour(ctx, -60));
  });

  it("produit logs et comptes acceptés par le validateur Mongo", async () => {
    const user = buildUser(ctx, {
      n: 1,
      organisationId: new ObjectId(),
      prenom: "Claire",
      nom: "Conseil",
      fonction: "Conseillère",
      lastConnection: jour(ctx, -1),
    });
    const log = buildLog({
      n: 1,
      dossierId: new ObjectId(),
      createdAt: jour(ctx, -10),
      situation: SITUATION_ENUM.RDV_PRIS,
      created_by: user._id,
    });

    await usersMigrationDb().insertOne(user);
    await missionLocaleEffectifsLogDb().insertOne(log);

    expect(user.email).toBe("claire.conseil@seed.recette.invalid");
    expect(user.password).toMatch(/^\$6\$/);
  });
});
