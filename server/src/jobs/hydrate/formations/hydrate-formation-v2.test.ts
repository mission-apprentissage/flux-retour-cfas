import {
  cfdCodeFixtures,
  generateFormationFixture,
  rncpCodeFixtures,
  siretFixtures,
  uaiFixtures,
} from "api-alternance-sdk/fixtures";
import { ObjectId, Sort } from "mongodb";
import { IFormationV2 } from "shared/models";
import { beforeEach, describe, it, expect, vi } from "vitest";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { formationV2Db } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { hydrateFormationV2 } from "./hydrate-formation-v2";

vi.mock("@/common/apis/apiAlternance/client");

useMongo();

const cfd1 = cfdCodeFixtures[13512840];
const cfd2 = cfdCodeFixtures[20512008];
const rncp1 = rncpCodeFixtures.RNCP10013;
const rncp2 = rncpCodeFixtures.RNCP36092;
const siret1 = siretFixtures[19350030300014];
const siret2 = siretFixtures[26590673500120];
const uai1 = uaiFixtures["0631408N"];
const uai2 = uaiFixtures["0851372E"];

const apiFormationsFixtures = [
  generateFormationFixture({
    certification: { valeur: { identifiant: { cfd: cfd1, rncp: rncp1 } }, connue: true },
    responsable: { organisme: { identifiant: { siret: siret1, uai: uai1 } }, connu: true },
    formateur: { organisme: { identifiant: { siret: siret2, uai: uai2 } }, connu: false },
    statut: {
      catalogue: "publié",
    },
  }),
  generateFormationFixture({
    certification: { valeur: { identifiant: { cfd: cfd2, rncp: rncp2 } }, connue: true },
    responsable: { organisme: { identifiant: { siret: siret1, uai: uai1 } }, connu: true },
    formateur: { organisme: { identifiant: { siret: siret2, uai: uai2 } }, connu: false },
    statut: {
      catalogue: "publié",
    },
  }),
  generateFormationFixture({
    certification: { valeur: { identifiant: { cfd: cfd2, rncp: rncp2 } }, connue: true },
    responsable: { organisme: { identifiant: { siret: siret1, uai: uai1 } }, connu: true },
    formateur: { organisme: { identifiant: { siret: siret1, uai: uai1 } }, connu: false },
    statut: {
      catalogue: "publié",
    },
  }),
  generateFormationFixture({
    certification: { valeur: { identifiant: { cfd: null, rncp: rncp2 } }, connue: true },
    responsable: { organisme: { identifiant: { siret: siret2, uai: uai2 } }, connu: true },
    formateur: { organisme: { identifiant: { siret: siret2, uai: uai2 } }, connu: false },
    statut: {
      catalogue: "archivé",
    },
  }),
  generateFormationFixture({
    certification: { valeur: { identifiant: { cfd: cfd1, rncp: null } }, connue: true },
    responsable: { organisme: { identifiant: { siret: siret2, uai: uai2 } }, connu: true },
    formateur: { organisme: { identifiant: { siret: siret2, uai: uai2 } }, connu: false },
    statut: {
      catalogue: "supprimé",
    },
  }),
];

const expectedFormations: Omit<IFormationV2, "_id" | "computed">[] = [
  {
    identifiant: {
      cfd: null,
      rncp: rncp2,
      responsable_siret: siret2,
      responsable_uai: uai2,
      formateur_siret: siret2,
      formateur_uai: uai2,
    },
    draft: false,
  },
  {
    identifiant: {
      cfd: cfd1,
      rncp: null,
      responsable_siret: siret2,
      responsable_uai: uai2,
      formateur_siret: siret2,
      formateur_uai: uai2,
    },
    draft: false,
  },
  {
    identifiant: {
      cfd: cfd1,
      rncp: rncp1,
      responsable_siret: siret1,
      responsable_uai: uai1,
      formateur_siret: siret2,
      formateur_uai: uai2,
    },
    draft: false,
  },
  {
    identifiant: {
      cfd: cfd2,
      rncp: rncp2,
      responsable_siret: siret1,
      responsable_uai: uai1,
      formateur_siret: siret1,
      formateur_uai: uai1,
    },
    draft: false,
  },
  {
    identifiant: {
      cfd: cfd2,
      rncp: rncp2,
      responsable_siret: siret1,
      responsable_uai: uai1,
      formateur_siret: siret2,
      formateur_uai: uai2,
    },
    draft: false,
  },
];

const sort: Sort = {
  "identifiant.cfd": 1,
  "identifiant.rncp": 1,
  "identifiant.responsable_siret": 1,
  "identifiant.responsable_uai": 1,
  "identifiant.formateur_siret": 1,
  "identifiant.formateur_uai": 1,
};

describe("hydrateFormationV2", () => {
  beforeEach(async () => {
    const mockCursor = [
      [apiFormationsFixtures[0], apiFormationsFixtures[1]],
      [apiFormationsFixtures[2], apiFormationsFixtures[3]],
      [apiFormationsFixtures[4]],
    ];

    vi.mocked(apiAlternanceClient.formation.recherche).mockImplementation(async function* () {
      for (const formations of mockCursor) {
        yield formations;
      }
    });
  });

  it("doit importer les formations depuis l'API alternance", async () => {
    await hydrateFormationV2();

    expect(apiAlternanceClient.formation.recherche).toHaveBeenCalledWith({
      page_size: 1_000,
      include_archived: "true",
    });

    const formations = await formationV2Db()
      .find({}, { projection: { _id: 0, computed: 0 }, sort })
      .toArray();

    expect(formations).toEqual(expectedFormations);
  });

  it("ne doit pas dupliquer les formations existantes", async () => {
    const initialFormations = expectedFormations.map((formation) => ({ ...formation, _id: new ObjectId() }));
    await formationV2Db().insertMany(initialFormations);

    await hydrateFormationV2();

    expect(apiAlternanceClient.formation.recherche).toHaveBeenCalledWith({
      page_size: 1_000,
      include_archived: "true",
    });

    const formations = await formationV2Db()
      .find({}, { projection: { computed: 0 }, sort })
      .toArray();

    expect(formations).toEqual(initialFormations);
  });
});
