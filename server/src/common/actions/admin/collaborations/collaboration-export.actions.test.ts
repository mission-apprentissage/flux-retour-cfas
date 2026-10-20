import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import type { IOrganisation, IOrganisme } from "shared/models";
import { generateMissionLocaleEffectifFixture } from "shared/models/fixtures/missionLocaleEffectif.fixture";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { getAnneeScolaireFromDate } from "shared/utils";
import { describe, expect, it } from "vitest";

import { effectifsDb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { formatDepartement, getCollaborationExportData } from "./collaboration-export.actions";

useMongo();

const CURRENT_ANNEE = getAnneeScolaireFromDate(new Date());
const ACTIVATED_AT = new Date("2026-02-01");
const ENVOI_AT = new Date("2026-03-01");

let counter = 0;

async function insertCompatibleActive(overrides: Partial<IOrganisme> = {}): Promise<IOrganisme> {
  counter += 1;
  const org = generateOrganismeFixture({
    _id: new ObjectId(),
    siret: `${10000000000000 + counter}`,
    uai: `010000${counter.toString().padStart(2, "0")}A`,
    nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
    ...overrides,
  });
  await organismesDb().insertOne(org, { bypassDocumentValidation: true });
  await effectifsDb().insertOne(
    { _id: new ObjectId(), organisme_id: org._id, annee_scolaire: CURRENT_ANNEE } as never,
    { bypassDocumentValidation: true }
  );
  await organisationsDb().insertOne({
    _id: new ObjectId(),
    type: "ORGANISME_FORMATION",
    created_at: new Date(),
    siret: org.siret,
    uai: null,
    organisme_id: org._id.toString(),
    ml_beta_activated_at: ACTIVATED_AT,
  } as IOrganisation);
  return org;
}

const insertDossierEnvoye = (organismeId: ObjectId, snapshot: { region?: string; departement?: string } = {}) =>
  missionLocaleEffectifsDb().insertOne(
    generateMissionLocaleEffectifFixture({
      organisme_id: organismeId,
      created_at: ENVOI_AT,
      reponse_at: ENVOI_AT,
      acc_conjoint: true,
      snapshot_region: snapshot.region,
      snapshot_departement: snapshot.departement,
    }),
    { bypassDocumentValidation: true }
  );

describe("formatDepartement", () => {
  it("renvoie le libellé du département, Non renseigné sinon", () => {
    expect(formatDepartement("59")).toBe("Nord");
    expect(formatDepartement("2A")).toBe("Corse-du-Sud");
    expect(formatDepartement("974")).toBe("La Réunion");
    expect(formatDepartement("99")).toBe("Non renseigné");
    expect(formatDepartement(null)).toBe("Non renseigné");
    expect(formatDepartement(undefined)).toBe("Non renseigné");
  });
});

describe("getCollaborationExportData", () => {
  it("renseigne le département du CFA sur les quatre feuilles, avec repli sur le snapshot", async () => {
    const nord = await insertCompatibleActive({
      nom: "CFA Nord",
      adresse: { region: "32", departement: "59" } as never,
    });
    const sansAdresse = await insertCompatibleActive({ nom: "CFA Sans adresse" });
    const sansRien = await insertCompatibleActive({ nom: "CFA Sans rien" });
    await insertDossierEnvoye(nord._id as ObjectId);
    await insertDossierEnvoye(sansAdresse._id as ObjectId, { region: "32", departement: "59" });
    await insertDossierEnvoye(sansRien._id as ObjectId);

    const data = await getCollaborationExportData();

    expect(data.cfa_compatibles).toEqual([
      { siret: nord.siret, nom: "CFA Nord", region: "Hauts-de-France", departement: "Nord", departement_code: "59" },
      {
        siret: sansAdresse.siret,
        nom: "CFA Sans adresse",
        region: "Non renseigné",
        departement: "Non renseigné",
        departement_code: null,
      },
      {
        siret: sansRien.siret,
        nom: "CFA Sans rien",
        region: "Non renseigné",
        departement: "Non renseigné",
        departement_code: null,
      },
    ]);

    expect(
      data.cfa_actives.map(({ nom, region, departement, departement_code }) => [
        nom,
        region,
        departement,
        departement_code,
      ])
    ).toEqual([
      ["CFA Nord", "Hauts-de-France", "Nord", "59"],
      ["CFA Sans adresse", "Non renseigné", "Non renseigné", null],
      ["CFA Sans rien", "Non renseigné", "Non renseigné", null],
    ]);

    expect(data.cfa_with_collab).toEqual([
      {
        siret: nord.siret,
        nom: "CFA Nord",
        region: "Hauts-de-France",
        departement: "Nord",
        departement_code: "59",
        nb_collaborations: 1,
      },
      {
        siret: sansAdresse.siret,
        nom: "CFA Sans adresse",
        region: "Hauts-de-France",
        departement: "Nord",
        departement_code: "59",
        nb_collaborations: 1,
      },
      {
        siret: sansRien.siret,
        nom: "CFA Sans rien",
        region: "Non renseigné",
        departement: "Non renseigné",
        departement_code: null,
        nb_collaborations: 1,
      },
    ]);

    const details = [...data.details_collaborations].sort((a, b) => (a.nom_cfa ?? "").localeCompare(b.nom_cfa ?? ""));
    expect(details.map((d) => [d.nom_cfa, d.region_cfa, d.departement_cfa, d.departement_code_cfa])).toEqual([
      ["CFA Nord", "Hauts-de-France", "Nord", "59"],
      ["CFA Sans adresse", "Hauts-de-France", "Nord", "59"],
      ["CFA Sans rien", "Non renseigné", "Non renseigné", null],
    ]);
  });
});
