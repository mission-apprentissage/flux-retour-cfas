import { ObjectId } from "mongodb";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { describe, it, expect, beforeEach } from "vitest";

import { organismesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { isTransmissionAuthorizedForOrganismes } from "./organismes.actions";

useMongo();

// Hiérarchie de test :
//   responsable --(organismesFormateurs)--> formateur
//   formateur   --(organismesResponsables)--> responsable
// + un organisme tiers sans aucun lien.
const responsableId = new ObjectId();
const formateurId = new ObjectId();
const tiersId = new ObjectId();

const responsable = generateOrganismeFixture({
  _id: responsableId,
  siret: "13002975400020",
  uai: "0597114M",
  organismesFormateurs: [{ siret: "42334912500066", uai: "0133336F", _id: formateurId }],
});

const formateur = generateOrganismeFixture({
  _id: formateurId,
  siret: "42334912500066",
  uai: "0133336F",
  organismesResponsables: [{ siret: "13002975400020", uai: "0597114M", _id: responsableId }],
});

const tiers = generateOrganismeFixture({
  _id: tiersId,
  siret: "19240007500011",
  uai: "0932751K",
});

// Même établissement que le formateur (même UAI), fiche distincte, sans relation peuplée.
const sameUaiId = new ObjectId();
const sameUai = generateOrganismeFixture({
  _id: sameUaiId,
  siret: "55204944776279",
  uai: "0133336F", // = formateur.uai
});

// Même entité juridique que le formateur (même SIRET), UAI distinct, sans relation peuplée.
const sameSiretId = new ObjectId();
const sameSiret = generateOrganismeFixture({
  _id: sameSiretId,
  siret: "42334912500066", // = formateur.siret
  uai: "0751234A",
});

describe("isTransmissionAuthorizedForOrganismes", () => {
  beforeEach(async () => {
    await organismesDb().insertMany([responsable, formateur, tiers, sameUai, sameSiret]);
  });

  it("autorise l'auto-transmission (la clé est le formateur visé)", async () => {
    expect(await isTransmissionAuthorizedForOrganismes(formateurId, formateurId, responsableId)).toBe(true);
  });

  it("autorise le responsable à transmettre pour son formateur", async () => {
    expect(await isTransmissionAuthorizedForOrganismes(responsableId, formateurId, responsableId)).toBe(true);
  });

  it("autorise quand seul le responsable déclaré est rattaché à la clé", async () => {
    // clé = formateur, formateur visé inconnu de la clé, mais responsable visé = la clé
    expect(await isTransmissionAuthorizedForOrganismes(formateurId, tiersId, formateurId)).toBe(true);
  });

  it("refuse une clé tierce sans lien avec le formateur ni le responsable", async () => {
    expect(await isTransmissionAuthorizedForOrganismes(tiersId, formateurId, responsableId)).toBe(false);
  });

  it("autorise une clé partageant l'UAI du formateur (même établissement, fiche distincte)", async () => {
    // pas de relation entre sameUai et le formateur, seul l'UAI est commun
    expect(await isTransmissionAuthorizedForOrganismes(sameUaiId, formateurId, responsableId)).toBe(true);
  });

  it("autorise une clé partageant le SIRET du formateur (même entité juridique)", async () => {
    expect(await isTransmissionAuthorizedForOrganismes(sameSiretId, formateurId, responsableId)).toBe(true);
  });

  it("refuse quand ni formateur ni responsable ne sont définis", async () => {
    expect(await isTransmissionAuthorizedForOrganismes(formateurId, undefined, undefined)).toBe(false);
  });
});
