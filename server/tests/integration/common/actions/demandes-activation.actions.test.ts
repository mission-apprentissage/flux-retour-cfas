import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import { refusAvecMail } from "shared/models/data/demandesActivationCfa.model";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { generateFormationCatalogueFixture } from "shared/models/fixtures/formationsCatalogue.fixture";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { describe, expect, it } from "vitest";

import { evaluerDemande, lireHorodatage } from "@/common/actions/admin/demandes-activation.actions";
import {
  effectifsDb,
  formationsCatalogueDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

useMongo();

const SIRET = "13002374000439";
const UAI = "0442095L";

async function insererOrganisme(overrides: Partial<IOrganisme> = {}, effectifs = 1) {
  const organisme = generateOrganismeFixture({
    _id: new ObjectId(),
    siret: SIRET,
    uai: UAI,
    nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
    ferme: false,
    ...overrides,
  });
  await organismesDb().insertOne(organisme, { bypassDocumentValidation: true });
  for (let i = 0; i < effectifs; i++) {
    await effectifsDb().insertOne(
      testDoc<IEffectif>({
        _id: new ObjectId(),
        organisme_id: organisme._id,
        annee_scolaire: getActiveAnneesScolaires(new Date())[0],
      }),
      { bypassDocumentValidation: true }
    );
  }
  return organisme;
}

async function insererOrganisation(organismeId: ObjectId) {
  const organisationId = new ObjectId();
  await organisationsDb().insertOne(
    testDoc<IOrganisation>({
      _id: organisationId,
      type: "ORGANISME_FORMATION",
      siret: SIRET,
      uai: UAI,
      organisme_id: organismeId.toString(),
      created_at: new Date(),
    }),
    { bypassDocumentValidation: true }
  );
  return organisationId;
}

async function insererCompte(email: string, organisationId: ObjectId) {
  const id = new ObjectId();
  await usersMigrationDb().insertOne(
    { _id: id, email, organisation_id: organisationId, account_status: "CONFIRMED", created_at: new Date() } as never,
    { bypassDocumentValidation: true }
  );
  return id;
}

const evaluer = (email: string, overrides: Partial<Parameters<typeof evaluerDemande>[0]> = {}) =>
  evaluerDemande({ email_saisi: email, siret_saisi: SIRET, ...overrides });

describe("evaluerDemande", () => {
  describe("SIRET", () => {
    it("retient l'organisme ouvert du SIRET saisi, ou corrigé", async () => {
      const organisme = await insererOrganisme();

      expect(await evaluer("direction@cfa.fr")).toMatchObject({
        siret: SIRET,
        uai: UAI,
        organisme_id: organisme._id,
        motifs: [],
        branche: "activation",
      });
      expect(await evaluer("direction@cfa.fr", { siret_saisi: "123", siret_corrige: SIRET })).toMatchObject({
        organisme_id: organisme._id,
        motifs: [],
      });
    });

    it("signale un SIRET mal formé ou inconnu", async () => {
      expect((await evaluer("direction@cfa.fr", { siret_saisi: "1300237400043" })).motifs).toEqual(["siret_mal_forme"]);
      expect((await evaluer("direction@cfa.fr")).motifs).toEqual(["siret_inconnu"]);
    });

    it("propose l'organisme ouvert de même UAI quand le SIRET saisi est fermé", async () => {
      await insererOrganisme({ ferme: true });
      await insererOrganisme({ siret: "13002374000447" });

      expect(await evaluer("direction@cfa.fr")).toMatchObject({ motifs: ["ferme"], siret_propose: "13002374000447" });
    });

    it("retient, sur un SIRET multi-UAI, l'UAI qui porte des effectifs", async () => {
      await insererOrganisme({ uai: "0442096M" }, 0);
      const avecEffectifs = await insererOrganisme({ uai: "0442097N" }, 3);

      expect(await evaluer("direction@cfa.fr")).toMatchObject({ uai: "0442097N", organisme_id: avecEffectifs._id });
    });

    it("signale un établissement sans UAI", async () => {
      await insererOrganisme({ uai: null });

      expect((await evaluer("direction@cfa.fr")).motifs).toEqual(["sans_uai"]);
    });
  });

  describe("email et compte", () => {
    it("signale un email mal formé et une messagerie grand public", async () => {
      await insererOrganisme();

      expect((await evaluer("direction@")).motifs).toEqual(["email_mal_forme"]);
      expect((await evaluer("cfa.direction@gmail.com")).motifs).toEqual(["messagerie_grand_public"]);
    });

    it("avertit d'un domaine jamais vu, sans bloquer", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      await insererCompte("collegue@cfa-connu.fr", organisationId);

      expect(await evaluer("direction@cfa-connu.fr")).toMatchObject({ domaine_inconnu: false, motifs: [] });
      expect(await evaluer("direction@leolgrange.org")).toMatchObject({ domaine_inconnu: true, motifs: [] });
    });

    it("passe en compte existant le demandeur qui a un compte dans l'organisation", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@cfa.fr", organisationId);

      expect(await evaluer("direction@cfa.fr")).toMatchObject({
        organisation_id: organisationId,
        user_id: compteId,
        branche: "compte_existant",
      });
    });

    it("évalue l'email corrigé à la place de l'email saisi", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@cfa-connu.fr", organisationId);

      expect(await evaluer("cécilerenaud")).toMatchObject({ email: "cécilerenaud", motifs: ["email_mal_forme"] });
      expect(await evaluer("cécilerenaud", { email_corrige: "direction@cfa-connu.fr" })).toMatchObject({
        email: "direction@cfa-connu.fr",
        motifs: [],
        domaine_inconnu: false,
        user_id: compteId,
        branche: "compte_existant",
      });
    });

    it("refuse le demandeur dont le compte est rattaché à une autre organisation", async () => {
      await insererOrganisme();
      const compteId = await insererCompte("direction@cfa.fr", new ObjectId());

      expect(await evaluer("direction@cfa.fr")).toMatchObject({
        user_id: compteId,
        motifs: ["compte_autre_organisation"],
        branche: "refus",
      });
    });
  });

  describe("conditions d'activation", () => {
    it("accepte un CFA qui a des formateurs tiers au catalogue", async () => {
      await insererOrganisme();
      await formationsCatalogueDb().insertOne(
        generateFormationCatalogueFixture({
          etablissement_gestionnaire_siret: SIRET,
          etablissement_gestionnaire_uai: UAI,
          etablissement_formateur_siret: "13002374000447",
          etablissement_formateur_uai: "0442096M",
          published: true,
        })
      );

      expect((await evaluer("direction@cfa.fr")).branche).toBe("activation");
    });

    it("distingue un responsable pur d'une nature inconnue", async () => {
      await insererOrganisme({ nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE });
      expect((await evaluer("direction@cfa.fr")).motifs).toEqual(["responsable_pur"]);

      await organismesDb().updateOne({ siret: SIRET }, { $set: { nature: NATURE_ORGANISME_DE_FORMATION.INCONNUE } });
      expect((await evaluer("direction@cfa.fr")).motifs).toEqual(["nature_inconnue"]);
    });

    it("signale un CFA sans effectif et compte ses effectifs", async () => {
      await insererOrganisme({}, 0);
      expect(await evaluer("direction@cfa.fr")).toMatchObject({
        motifs: ["aucun_effectif"],
        effectifs_erp: 0,
        effectifs_deca: 0,
      });
    });
  });

  describe("adresse grand public", () => {
    it("refuse sans mail une adresse grand public, puis accepte l'adresse corrigée", async () => {
      await insererOrganisme();

      expect(await evaluer("cfa.direction@gmail.com")).toMatchObject({
        motifs: ["messagerie_grand_public"],
        branche: "refus",
      });
      expect(await evaluer("cfa.direction@gmail.com", { email_corrige: "direction@cfa.fr" })).toMatchObject({
        email: "direction@cfa.fr",
        motifs: [],
        branche: "activation",
      });
    });
  });
});

describe("lireHorodatage", () => {
  it("lit l'horodateur du formulaire, matin et après-midi, avec son fuseau", () => {
    expect(lireHorodatage("2026/10/16 3:45:45 PM UTC+3")).toEqual(new Date("2026-10-16T12:45:45.000Z"));
    expect(lireHorodatage("2026/10/16 12:05:00 AM UTC+2")).toEqual(new Date("2026-10-15T22:05:00.000Z"));
    expect(lireHorodatage("16/10/2026 15:45")).toBeNull();
  });
});

describe("refusAvecMail", () => {
  it.each([
    ["aucun_effectif", true],
    ["siret_inconnu", true],
    ["sans_uai", true],
    ["siret_mal_forme", false],
    ["email_mal_forme", false],
    ["messagerie_grand_public", false],
    ["responsable_pur", false],
    ["nature_inconnue", false],
    ["compte_autre_organisation", false],
    ["ferme", false],
  ] as const)("classe le motif %s : refus avec mail = %s", (motif, avecMail) => {
    expect(refusAvecMail([motif])).toBe(avecMail);
  });
});
