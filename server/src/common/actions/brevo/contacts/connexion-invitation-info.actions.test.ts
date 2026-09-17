import type { IMissionLocaleEffectif } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { missionLocaleEffectifsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

import { getConnexionInvitationInfoByEmail } from "./connexion-invitation-info.actions";
import {
  buildOrganisme,
  buildOrgaMl,
  buildOrgaOf,
  buildRupturant,
  buildUser,
  NOW,
  resetFixtureCounters,
} from "./fixtures";

useMongo();

describe("getConnexionInvitationInfoByEmail", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    resetFixtureCounters();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retourne null pour un email inconnu", async () => {
    const result = await getConnexionInvitationInfoByEmail("personne@nowhere.fr");
    expect(result).toBeNull();
  });

  it("retourne email + organisme:null + missionsLocales:[] pour un user non-OF (ML, ARML, …)", async () => {
    const orgaMl = buildOrgaMl("ML PARIS");
    const user = buildUser(orgaMl, { email: "agent@ml-paris.fr" });
    await organisationsDb().insertOne(testDoc<IOrganisation>(orgaMl));
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));

    const result = await getConnexionInvitationInfoByEmail("agent@ml-paris.fr");

    expect(result).toEqual({
      email: "agent@ml-paris.fr",
      organisme: null,
      missionsLocales: [],
    });
  });

  it("retourne email + organisme (sans ML) si l'OF n'a aucun rupturant", async () => {
    const orgaOf = buildOrgaOf();
    const organisme = buildOrganisme(orgaOf);
    const user = buildUser(orgaOf, { email: "sandrine@cfa.fr" });
    await organisationsDb().insertOne(testDoc<IOrganisation>(orgaOf));
    await organismesDb().insertOne(testDoc<IOrganisme>(organisme));
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));

    const result = await getConnexionInvitationInfoByEmail("sandrine@cfa.fr");

    expect(result).toEqual({
      email: "sandrine@cfa.fr",
      organisme: {
        nom: "Mon CFA",
        // La fixture ne met ni `numero`/`voie` ni `code_postal` → rue + code_postal null.
        adresse: { rue: null, code_postal: null, commune: "Paris" },
        uai: orgaOf.uai,
        siret: orgaOf.siret,
      },
      missionsLocales: [],
    });
  });

  it("retourne email + organisme: null si pas de match dans organismes (référentiel)", async () => {
    const orgaOf = buildOrgaOf();
    const user = buildUser(orgaOf, { email: "sandrine@cfa.fr" });
    await organisationsDb().insertOne(testDoc<IOrganisation>(orgaOf));
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));

    const result = await getConnexionInvitationInfoByEmail("sandrine@cfa.fr");

    expect(result).toEqual({
      email: "sandrine@cfa.fr",
      organisme: null,
      missionsLocales: [],
    });
  });

  it("happy path : retourne email + organisme + liste complète des ML triées par count desc", async () => {
    const orgaOf = buildOrgaOf();
    const organisme = buildOrganisme(orgaOf);
    const user = buildUser(orgaOf, { email: "sandrine@cfa.fr" });
    const mlA = buildOrgaMl("ML A", { adresse: { commune: "Arveyres", code_postal: "33500" } });
    const mlB = buildOrgaMl("ML B", { adresse: { commune: "Mérignac", code_postal: "33700" } });
    const mlC = buildOrgaMl("ML C", { adresse: { commune: "Bordeaux", code_postal: "33000" } });

    await organisationsDb().insertMany([
      testDoc<IOrganisation>(orgaOf),
      testDoc<IOrganisation>(mlA),
      testDoc<IOrganisation>(mlB),
      testDoc<IOrganisation>(mlC),
    ]);
    await organismesDb().insertOne(testDoc<IOrganisme>(organisme));
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));
    // ML A : 3 rupturants, ML B : 2, ML C : 1 — counts strictement décroissants
    await missionLocaleEffectifsDb().insertMany(
      [
        testDoc<IMissionLocaleEffectif>(buildRupturant(organisme._id, mlA._id)),
        testDoc<IMissionLocaleEffectif>(buildRupturant(organisme._id, mlA._id)),
        testDoc<IMissionLocaleEffectif>(buildRupturant(organisme._id, mlA._id)),
        testDoc<IMissionLocaleEffectif>(buildRupturant(organisme._id, mlB._id)),
        testDoc<IMissionLocaleEffectif>(buildRupturant(organisme._id, mlB._id)),
        testDoc<IMissionLocaleEffectif>(buildRupturant(organisme._id, mlC._id)),
      ],
      { bypassDocumentValidation: true }
    );

    const result = await getConnexionInvitationInfoByEmail("sandrine@cfa.fr");

    expect(result).not.toBeNull();
    expect(result?.email).toBe("sandrine@cfa.fr");
    expect(result?.organisme?.nom).toBe("Mon CFA");
    expect(result?.organisme?.siret).toBe(orgaOf.siret);
    expect(result?.organisme?.uai).toBe(orgaOf.uai);
    expect(result?.missionsLocales).toEqual([
      { nom: "ML A", adresse: { rue: null, code_postal: "33500", commune: "Arveyres" }, effectifs_count: 3 },
      { nom: "ML B", adresse: { rue: null, code_postal: "33700", commune: "Mérignac" }, effectifs_count: 2 },
      { nom: "ML C", adresse: { rue: null, code_postal: "33000", commune: "Bordeaux" }, effectifs_count: 1 },
    ]);
  });

  it("liste une ML dont la rupture date de plus de 180 jours", async () => {
    const orgaOf = buildOrgaOf();
    const organisme = buildOrganisme(orgaOf);
    const user = buildUser(orgaOf, { email: "sandrine@cfa.fr" });
    const ml = buildOrgaMl("ML ANCIENNE");

    await organisationsDb().insertMany([testDoc<IOrganisation>(orgaOf), testDoc<IOrganisation>(ml)]);
    await organismesDb().insertOne(testDoc<IOrganisme>(organisme));
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));
    await missionLocaleEffectifsDb().insertOne(
      testDoc<IMissionLocaleEffectif>(
        buildRupturant(organisme._id, ml._id, { date_rupture: new Date("2025-06-01T00:00:00.000Z") })
      ),
      { bypassDocumentValidation: true }
    );

    const result = await getConnexionInvitationInfoByEmail("sandrine@cfa.fr");

    expect(result?.missionsLocales).toEqual([{ nom: "ML ANCIENNE", adresse: null, effectifs_count: 1 }]);
  });

  it("liste une ML dont le dossier est déjà qualifié", async () => {
    const orgaOf = buildOrgaOf();
    const organisme = buildOrganisme(orgaOf);
    const user = buildUser(orgaOf, { email: "sandrine@cfa.fr" });
    const ml = buildOrgaMl("ML QUI A TRAITE");

    await organisationsDb().insertMany([testDoc<IOrganisation>(orgaOf), testDoc<IOrganisation>(ml)]);
    await organismesDb().insertOne(testDoc<IOrganisme>(organisme));
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));
    await missionLocaleEffectifsDb().insertOne(
      testDoc<IMissionLocaleEffectif>(
        buildRupturant(organisme._id, ml._id, {
          situation: SITUATION_ENUM.DEJA_ACCOMPAGNE,
          current_status: { value: "APPRENTI", date: NOW },
        })
      ),
      { bypassDocumentValidation: true }
    );

    const result = await getConnexionInvitationInfoByEmail("sandrine@cfa.fr");

    expect(result?.missionsLocales.map((ml) => ml.nom)).toEqual(["ML QUI A TRAITE"]);
  });

  it("exclut une ML pas encore activée sur le Tableau de bord", async () => {
    const orgaOf = buildOrgaOf();
    const organisme = buildOrganisme(orgaOf);
    const user = buildUser(orgaOf, { email: "sandrine@cfa.fr" });
    const mlActive = buildOrgaMl("ML ACTIVE");
    const { activated_at: _ignored, ...mlInactive } = buildOrgaMl("ML INACTIVE");
    void _ignored;

    await organisationsDb().insertMany([
      testDoc<IOrganisation>(orgaOf),
      testDoc<IOrganisation>(mlActive),
      testDoc<IOrganisation>(mlInactive),
    ]);
    await organismesDb().insertOne(testDoc<IOrganisme>(organisme));
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));
    await missionLocaleEffectifsDb().insertMany(
      [
        testDoc<IMissionLocaleEffectif>(buildRupturant(organisme._id, mlActive._id)),
        testDoc<IMissionLocaleEffectif>(buildRupturant(organisme._id, mlInactive._id)),
      ],
      { bypassDocumentValidation: true }
    );

    const result = await getConnexionInvitationInfoByEmail("sandrine@cfa.fr");

    expect(result?.missionsLocales.map((ml) => ml.nom)).toEqual(["ML ACTIVE"]);
  });

  it("retombe sur raison_sociale si organisme.nom est absent", async () => {
    const orgaOf = buildOrgaOf();
    // Omission de la propriété `nom` (plutôt que `undefined`) pour passer la
    // validation du schéma Mongo.
    const { nom: _ignored, ...organisme } = buildOrganisme(orgaOf);
    void _ignored;
    const user = buildUser(orgaOf, { email: "sandrine@cfa.fr" });
    await organisationsDb().insertOne(testDoc<IOrganisation>(orgaOf));
    await organismesDb().insertOne(testDoc<IOrganisme>(organisme));
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));

    const result = await getConnexionInvitationInfoByEmail("sandrine@cfa.fr");

    expect(result?.organisme?.nom).toBe("Mon CFA SARL");
  });
});
