import { ObjectId } from "mongodb";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { describe, it, expect } from "vitest";

import { formationV2Db, organismesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { hydrateOrganismesOPCOs } from "./hydrate-organismes-opcos";

useMongo();

// RNCP présents dans server/static/opcos
const RNCP_2I = "RNCP10536";
const RNCP_EP = "RNCP1019";
const RNCP_QUATRE_OPCOS = "RNCP35150";

const SIRET_1 = "19350030300014";
const SIRET_2 = "26590673500120";
const SIRET_3 = "13002975400020";

const insertFormation = (identifiant: { rncp: string | null; responsable_siret?: string; formateur_siret?: string }) =>
  formationV2Db().insertOne({
    _id: new ObjectId(),
    identifiant: {
      cfd: null,
      responsable_uai: null,
      formateur_uai: null,
      responsable_siret: null,
      formateur_siret: null,
      ...identifiant,
    },
    draft: false,
  });

const getOpcos = async (siret: string) =>
  (await organismesDb().find({ siret }).toArray()).map(({ opcos }) => opcos?.toSorted());

describe("hydrateOrganismesOPCOs", () => {
  it("renseigne les opcos d'un organisme responsable", async () => {
    await organismesDb().insertOne(generateOrganismeFixture({ siret: SIRET_1 }));
    await insertFormation({ rncp: RNCP_2I, responsable_siret: SIRET_1 });

    await hydrateOrganismesOPCOs();

    expect(await getOpcos(SIRET_1)).toEqual([["2i"]]);
  });

  it("renseigne les opcos d'un organisme formateur uniquement", async () => {
    await organismesDb().insertOne(generateOrganismeFixture({ siret: SIRET_2 }));
    await insertFormation({ rncp: RNCP_EP, responsable_siret: SIRET_1, formateur_siret: SIRET_2 });

    await hydrateOrganismesOPCOs();

    expect(await getOpcos(SIRET_2)).toEqual([["ep"]]);
  });

  it("cumule les opcos des rôles responsable et formateur, sans doublon", async () => {
    await organismesDb().insertOne(generateOrganismeFixture({ siret: SIRET_1 }));
    await insertFormation({ rncp: RNCP_2I, responsable_siret: SIRET_1 });
    await insertFormation({ rncp: RNCP_EP, formateur_siret: SIRET_1 });
    await insertFormation({ rncp: RNCP_QUATRE_OPCOS, responsable_siret: SIRET_1, formateur_siret: SIRET_1 });

    await hydrateOrganismesOPCOs();

    expect(await getOpcos(SIRET_1)).toEqual([["2i", "akto", "atlas", "ep"]]);
  });

  it("met un tableau vide quand les formations n'ont aucun rncp connu des opcos", async () => {
    await organismesDb().insertOne(generateOrganismeFixture({ siret: SIRET_1, opcos: ["akto"] }));
    await insertFormation({ rncp: "RNCP99999", responsable_siret: SIRET_1 });
    await insertFormation({ rncp: null, responsable_siret: SIRET_1 });

    await hydrateOrganismesOPCOs();

    expect(await getOpcos(SIRET_1)).toEqual([[]]);
  });

  it("ne modifie pas un organisme sans formation v2", async () => {
    await organismesDb().insertMany([
      generateOrganismeFixture({ siret: SIRET_1 }),
      generateOrganismeFixture({ siret: SIRET_3, opcos: ["akto"] }),
      generateOrganismeFixture({ siret: SIRET_2 }),
    ]);
    await insertFormation({ rncp: RNCP_2I, responsable_siret: SIRET_1 });

    await hydrateOrganismesOPCOs();

    expect(await getOpcos(SIRET_3)).toEqual([["akto"]]);
    expect(await getOpcos(SIRET_2)).toEqual([undefined]);
  });

  it("applique les mêmes opcos à tous les organismes partageant un siret", async () => {
    await organismesDb().insertMany([
      generateOrganismeFixture({ siret: SIRET_1, uai: "0631408N" }),
      generateOrganismeFixture({ siret: SIRET_1, uai: "0851372E" }),
    ]);
    await insertFormation({ rncp: RNCP_2I, responsable_siret: SIRET_1 });

    await hydrateOrganismesOPCOs();

    expect(await getOpcos(SIRET_1)).toEqual([["2i"], ["2i"]]);
  });
});
