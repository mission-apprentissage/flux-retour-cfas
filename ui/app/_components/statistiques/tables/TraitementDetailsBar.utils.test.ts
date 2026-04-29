import type { ITraitementDetails } from "shared/models/data/nationalStats.model";
import { describe, expect, it } from "vitest";

import { regroupV1ToV2 } from "./TraitementDetailsBar.utils";

function makeDetails(overrides: Partial<ITraitementDetails> = {}): ITraitementDetails {
  return {
    rdv_pris: 0,
    nouveau_projet: 0,
    contacte_sans_retour: 0,
    injoignables: 0,
    coordonnees_incorrectes: 0,
    autre_avec_contact: 0,
    cherche_contrat: 0,
    reorientation: 0,
    ne_veut_pas_accompagnement: 0,
    ne_souhaite_pas_etre_recontacte: 0,
    ...overrides,
  };
}

describe("regroupV1ToV2", () => {
  it("passes through rdv_pris unchanged", () => {
    const out = regroupV1ToV2(makeDetails({ rdv_pris: 12 }));
    expect(out.rdv_pris).toBe(12);
  });

  it("maps nouveau_projet to projet_pro_securise", () => {
    const out = regroupV1ToV2(makeDetails({ nouveau_projet: 7 }));
    expect(out.projet_pro_securise).toBe(7);
  });

  it("sums ne_veut_pas_accompagnement + ne_souhaite_pas_etre_recontacte + cherche_contrat + reorientation into ne_souhaite_pas_accompagnement", () => {
    const out = regroupV1ToV2(
      makeDetails({
        ne_veut_pas_accompagnement: 3,
        ne_souhaite_pas_etre_recontacte: 5,
        cherche_contrat: 4,
        reorientation: 2,
      })
    );
    expect(out.ne_souhaite_pas_accompagnement).toBe(14);
  });

  it("maps contacte_sans_retour to a_recontacter", () => {
    const out = regroupV1ToV2(makeDetails({ contacte_sans_retour: 5 }));
    expect(out.a_recontacter).toBe(5);
  });

  it("sums injoignables + coordonnees_incorrectes into injoignable", () => {
    const out = regroupV1ToV2(makeDetails({ injoignables: 6, coordonnees_incorrectes: 4 }));
    expect(out.injoignable).toBe(10);
  });

  it("maps autre_avec_contact to autre (V2 narrow bucket)", () => {
    const out = regroupV1ToV2(makeDetails({ autre_avec_contact: 2 }));
    expect(out.autre).toBe(2);
  });
});
