import type { IRechercheOrganismeResponse } from "api-alternance-sdk";
import { describe, expect, it } from "vitest";

import { modeAttribution } from "@/jobs/fiabilisation/uai-siret/updateFiabilisation";

type Resultat = NonNullable<IRechercheOrganismeResponse["resultat"]>;

const UAI = "0141866C";
const SIRET = "78071394700015";

const resultat = (correspondances: Resultat["correspondances"]) => ({ correspondances }) as Resultat;
const uai = (lui_meme: boolean, son_lieu = false) => ({ lui_meme, son_lieu });
const siret = (lui_meme: boolean, son_formateur = false) => ({ lui_meme, son_formateur, son_responsable: false });

describe("modeAttribution", () => {
  it("renvoie aucun sans résultat", () => {
    expect(modeAttribution(UAI, SIRET, null)).toBe("aucun");
  });

  it("renvoie exact quand l'UAI et le SIRET envoyés sont ceux du résultat", () => {
    expect(modeAttribution(UAI, SIRET, resultat({ uai: uai(true), siret: siret(true) }))).toBe("exact");
  });

  it("renvoie siret quand seule l'UAI est corrigée", () => {
    expect(modeAttribution(UAI, SIRET, resultat({ uai: uai(false, true), siret: siret(true) }))).toBe("siret");
    expect(modeAttribution(UAI, SIRET, resultat({ uai: null, siret: siret(true) }))).toBe("siret");
  });

  it("renvoie uai quand seul le SIRET est corrigé", () => {
    expect(modeAttribution(UAI, SIRET, resultat({ uai: uai(true), siret: siret(false, true) }))).toBe("uai");
    expect(modeAttribution(UAI, SIRET, resultat({ uai: uai(true), siret: null }))).toBe("uai");
  });

  it("renvoie lieu quand ni l'UAI ni le SIRET envoyés ne sont ceux du résultat", () => {
    expect(modeAttribution(UAI, SIRET, resultat({ uai: uai(false, true), siret: siret(false, true) }))).toBe("lieu");
    expect(modeAttribution(UAI, SIRET, resultat({ uai: uai(false, true), siret: null }))).toBe("lieu");
  });

  it("ne compte pas comme corrigé un identifiant qui n'a pas été envoyé", () => {
    expect(modeAttribution(null, SIRET, resultat({ uai: null, siret: siret(true) }))).toBe("exact");
    expect(modeAttribution(UAI, undefined, resultat({ uai: uai(true), siret: null }))).toBe("exact");
  });
});
