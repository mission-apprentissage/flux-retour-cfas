import { describe, expect, it } from "vitest";

import { champsEnErreurDeValidation } from "./requeteRefusee";

describe("champsEnErreurDeValidation", () => {
  it("lit le format en tableau", () => {
    const errorData = {
      validationError: [
        { instancePath: "/uai", message: "UAI checksum is invalid" },
        { instancePath: "/siret", message: "SIRET does not pass the Luhn algorithm" },
        { instancePath: "/siret", message: "SIRET does not match the format" },
      ],
    };
    expect(champsEnErreurDeValidation(errorData)).toEqual(new Set(["uai", "siret"]));
  });

  it("lit l'ancien format en objet", () => {
    const errorData = {
      validationError: { _errors: [], uai: { _errors: ["UAI checksum is invalid"] }, siret: { _errors: [] } },
    };
    expect(champsEnErreurDeValidation(errorData)).toEqual(new Set(["uai"]));
  });

  it("ignore les erreurs portant sur la racine de la requête", () => {
    expect(champsEnErreurDeValidation({ validationError: [{ instancePath: "", message: "x" }] })).toEqual(new Set());
    expect(champsEnErreurDeValidation({ validationError: { _errors: ["x"] } })).toEqual(new Set());
  });

  it.each([null, undefined, "erreur", 400, [], {}, { validationError: null }, { validationError: [null, 1, "x"] }])(
    "renvoie un ensemble vide pour un corps inattendu (%j)",
    (errorData) => {
      expect(champsEnErreurDeValidation(errorData)).toEqual(new Set());
    }
  );
});
