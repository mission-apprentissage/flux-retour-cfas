import { CONNAISSANCE_ML_ENUM, SITUATION_ENUM } from "shared";
import { describe, expect, it } from "vitest";

import { FormValues, mapFormToPayload } from "./MlSuiviDossierColumn.utils";

function makeValues(overrides: Partial<FormValues> = {}): FormValues {
  return {
    contactReussi: null,
    rdvPris: null,
    situationNon: null,
    situationNonContact: null,
    problemeRecontact: null,
    actionRecontact: null,
    situationJeune: null,
    commentaire: "",
    ...overrides,
  };
}

describe("mapFormToPayload - connaissance_ml mapping", () => {
  it("maps situationJeune='accompagne' to DEJA_ACCOMPAGNE_ACTIVEMENT + deja_connu=true", () => {
    const values = makeValues({ contactReussi: true, rdvPris: true, situationJeune: "accompagne" });
    const payload = mapFormToPayload(values, false, false);

    expect(payload.situation).toBe(SITUATION_ENUM.RDV_PRIS);
    expect(payload.connaissance_ml).toBe(CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT);
    expect(payload.deja_connu).toBe(true);
  });

  it("maps situationJeune='connu' to CONNU_NON_ACCOMPAGNE + deja_connu=true", () => {
    const values = makeValues({ contactReussi: true, rdvPris: true, situationJeune: "connu" });
    const payload = mapFormToPayload(values, false, false);

    expect(payload.connaissance_ml).toBe(CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE);
    expect(payload.deja_connu).toBe(true);
  });

  it("maps situationJeune='inconnu' to NON_CONNU + deja_connu=false", () => {
    const values = makeValues({ contactReussi: true, rdvPris: true, situationJeune: "inconnu" });
    const payload = mapFormToPayload(values, false, false);

    expect(payload.connaissance_ml).toBe(CONNAISSANCE_ML_ENUM.NON_CONNU);
    expect(payload.deja_connu).toBe(false);
  });

  it("does not write connaissance_ml nor deja_connu when situationJeune is null", () => {
    const values = makeValues({
      contactReussi: false,
      situationNonContact: "tentative_relancer",
      situationJeune: null,
    });
    const payload = mapFormToPayload(values, false, false);

    expect(payload.connaissance_ml).toBeUndefined();
    expect(payload.deja_connu).toBeUndefined();
  });

  it("skips connaissance_ml on recontacter flow with contactReussi=false", () => {
    const values = makeValues({
      contactReussi: false,
      problemeRecontact: "mauvaises_coordonnees",
      actionRecontact: "marquer_traite",
      situationJeune: "accompagne",
    });
    const payload = mapFormToPayload(values, true, false);

    expect(payload.connaissance_ml).toBeUndefined();
    expect(payload.deja_connu).toBeUndefined();
  });

  it("writes connaissance_ml on recontacter flow when contactReussi=true", () => {
    const values = makeValues({
      contactReussi: true,
      rdvPris: true,
      situationJeune: "connu",
    });
    const payload = mapFormToPayload(values, true, false);

    expect(payload.connaissance_ml).toBe(CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE);
    expect(payload.deja_connu).toBe(true);
  });

  it("derivation invariant: deja_connu = (connaissance_ml !== NON_CONNU)", () => {
    const cases: Array<{ situationJeune: string; expectedEnum: CONNAISSANCE_ML_ENUM; expectedBool: boolean }> = [
      {
        situationJeune: "accompagne",
        expectedEnum: CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT,
        expectedBool: true,
      },
      { situationJeune: "connu", expectedEnum: CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE, expectedBool: true },
      { situationJeune: "inconnu", expectedEnum: CONNAISSANCE_ML_ENUM.NON_CONNU, expectedBool: false },
    ];

    for (const { situationJeune, expectedEnum, expectedBool } of cases) {
      const payload = mapFormToPayload(
        makeValues({ contactReussi: true, rdvPris: true, situationJeune }),
        false,
        false
      );
      expect(payload.connaissance_ml).toBe(expectedEnum);
      expect(payload.deja_connu).toBe(expectedBool);
      expect(payload.deja_connu).toBe(payload.connaissance_ml !== CONNAISSANCE_ML_ENUM.NON_CONNU);
    }
  });
});
