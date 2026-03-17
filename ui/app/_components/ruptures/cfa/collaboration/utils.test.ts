import { ACC_CONJOINT_MOTIF_ENUM } from "shared";
import { describe, expect, it } from "vitest";

import { FormValues } from "./types";
import {
  buildAdresseRue,
  formatAdresseDisplay,
  isSection1Valid,
  isSection3Valid,
  isSection4Valid,
  isSection5Valid,
  isValidPhone,
  isValidEmail,
  computeProgress,
} from "./utils";

const baseVerifiedInfo = {
  telephone: "0612345678",
  courriel: "test@test.fr",
  adresse_rue: "12 rue de Paris",
  adresse_code_postal: "75001",
  adresse_commune: "Paris",
  formation_libelle: "BTS Info",
  date_fin_formation: "31/12/2026",
};

function makeValues(overrides: Partial<FormValues> = {}): FormValues {
  return {
    still_at_cfa: true,
    motifs: [ACC_CONJOINT_MOTIF_ENUM.REORIENTATION],
    commentaires_par_motif: {},
    cause_rupture: "Raison de la rupture",
    referent_type: "me",
    referent_details: "",
    verified_info: baseVerifiedInfo,
    note_complementaire: "",
    ...overrides,
  };
}

describe("buildAdresseRue", () => {
  it("builds from numero + voie", () => {
    expect(buildAdresseRue({ numero: "12", voie: "rue de Paris" })).toBe("12 rue de Paris");
  });

  it("includes repetition_voie", () => {
    expect(buildAdresseRue({ numero: "12", repetition_voie: "bis", voie: "rue X" })).toBe("12 bis rue X");
  });

  it("falls back to complete", () => {
    expect(buildAdresseRue({ complete: "Full address" })).toBe("Full address");
  });

  it("returns empty for null", () => {
    expect(buildAdresseRue(null)).toBe("");
    expect(buildAdresseRue(undefined)).toBe("");
  });
});

describe("formatAdresseDisplay", () => {
  it("formats full address", () => {
    expect(
      formatAdresseDisplay({
        ...baseVerifiedInfo,
        adresse_rue: "12 rue X",
        adresse_commune: "Paris",
        adresse_code_postal: "75001",
      })
    ).toBe("12 rue X, Paris (75001)");
  });

  it("handles missing code postal", () => {
    expect(
      formatAdresseDisplay({
        ...baseVerifiedInfo,
        adresse_rue: "12 rue X",
        adresse_commune: "Paris",
        adresse_code_postal: "",
      })
    ).toBe("12 rue X, Paris");
  });
});

describe("isSection1Valid", () => {
  it("valid with simple motif (no freins)", () => {
    expect(isSection1Valid(makeValues({ motifs: [ACC_CONJOINT_MOTIF_ENUM.REORIENTATION] }))).toBe(true);
  });

  it("invalid when still_at_cfa is null", () => {
    expect(isSection1Valid(makeValues({ still_at_cfa: null }))).toBe(false);
  });

  it("invalid when no motifs", () => {
    expect(isSection1Valid(makeValues({ motifs: [] }))).toBe(false);
  });

  it("invalid when frein motif lacks comment", () => {
    expect(
      isSection1Valid(
        makeValues({
          motifs: [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT],
          commentaires_par_motif: {},
        })
      )
    ).toBe(false);
  });

  it("valid when frein motif has comment", () => {
    expect(
      isSection1Valid(
        makeValues({
          motifs: [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT],
          commentaires_par_motif: { [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT]: "Pas de logement" },
        })
      )
    ).toBe(true);
  });

  it("invalid when RECHERCHE_EMPLOI lacks comment", () => {
    expect(
      isSection1Valid(
        makeValues({
          motifs: [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI],
          commentaires_par_motif: {},
        })
      )
    ).toBe(false);
  });
});

describe("isSection3Valid", () => {
  it("valid with non-empty cause", () => {
    expect(isSection3Valid(makeValues())).toBe(true);
  });

  it("invalid with empty/whitespace cause", () => {
    expect(isSection3Valid(makeValues({ cause_rupture: "   " }))).toBe(false);
  });
});

describe("isSection4Valid", () => {
  it("valid with referent_type me", () => {
    expect(isSection4Valid(makeValues({ referent_type: "me" }))).toBe(true);
  });

  it("valid with referent_type other and details", () => {
    expect(isSection4Valid(makeValues({ referent_type: "other", referent_details: "Jean 0600000000" }))).toBe(true);
  });

  it("invalid with referent_type null", () => {
    expect(isSection4Valid(makeValues({ referent_type: null }))).toBe(false);
  });

  it("invalid with referent_type other but empty details", () => {
    expect(isSection4Valid(makeValues({ referent_type: "other", referent_details: "" }))).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("accepts valid French mobile numbers", () => {
    expect(isValidPhone("0612345678")).toBe(true);
    expect(isValidPhone("06 12 34 56 78")).toBe(true);
    expect(isValidPhone("+33612345678")).toBe(true);
    expect(isValidPhone("+33 6 12 34 56 78")).toBe(true);
    expect(isValidPhone("0033612345678")).toBe(true);
  });

  it("accepts valid French landline numbers", () => {
    expect(isValidPhone("0145678901")).toBe(true);
    expect(isValidPhone("01 45 67 89 01")).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("abcdefghij")).toBe(false);
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("00112345678")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("test@example.fr")).toBe(true);
    expect(isValidEmail("jean.dupont@mail.com")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@no-local.com")).toBe(false);
    expect(isValidEmail("no-domain@")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isSection5Valid", () => {
  it("valid with all required fields filled", () => {
    expect(isSection5Valid(makeValues())).toBe(true);
  });

  it("invalid when telephone is empty", () => {
    expect(isSection5Valid(makeValues({ verified_info: { ...baseVerifiedInfo, telephone: "" } }))).toBe(false);
  });

  it("invalid when telephone format is wrong", () => {
    expect(isSection5Valid(makeValues({ verified_info: { ...baseVerifiedInfo, telephone: "123" } }))).toBe(false);
  });

  it("invalid when adresse_rue is empty", () => {
    expect(isSection5Valid(makeValues({ verified_info: { ...baseVerifiedInfo, adresse_rue: "" } }))).toBe(false);
  });

  it("courriel is not required", () => {
    expect(isSection5Valid(makeValues({ verified_info: { ...baseVerifiedInfo, courriel: "" } }))).toBe(true);
  });

  it("invalid when courriel is filled but has wrong format", () => {
    expect(isSection5Valid(makeValues({ verified_info: { ...baseVerifiedInfo, courriel: "notanemail" } }))).toBe(false);
  });

  it("valid when courriel has correct format", () => {
    expect(isSection5Valid(makeValues({ verified_info: { ...baseVerifiedInfo, courriel: "test@test.fr" } }))).toBe(
      true
    );
  });
});

describe("computeProgress", () => {
  it("returns 0 for empty form", () => {
    expect(
      computeProgress(
        makeValues({
          still_at_cfa: null,
          motifs: [],
          cause_rupture: "",
          referent_type: null,
          verified_info: {
            telephone: "",
            courriel: "",
            adresse_rue: "",
            adresse_code_postal: "",
            adresse_commune: "",
            formation_libelle: "",
            date_fin_formation: "",
          },
        })
      )
    ).toBe(0);
  });

  it("returns 100 for fully filled form", () => {
    expect(computeProgress(makeValues())).toBe(100);
  });

  it("accounts for frein comments in total", () => {
    const values = makeValues({
      motifs: [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT, ACC_CONJOINT_MOTIF_ENUM.REORIENTATION],
      commentaires_par_motif: {},
    });
    const progress = computeProgress(values);
    expect(progress).toBeLessThan(100);
  });

  it("accounts for referent_details when type is other", () => {
    const withDetails = computeProgress(makeValues({ referent_type: "other", referent_details: "Jean" }));
    const withoutDetails = computeProgress(makeValues({ referent_type: "other", referent_details: "" }));
    expect(withDetails).toBeGreaterThan(withoutDetails);
  });
});
