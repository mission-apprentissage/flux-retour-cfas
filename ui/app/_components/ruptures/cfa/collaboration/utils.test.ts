import { ACC_CONJOINT_MOTIF_ENUM } from "shared";
import { CFA_SITUATION_TYPE_ENUM, RQTH_DECLARE_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { describe, expect, it } from "vitest";

import { buildTunnelSteps } from "./tunnel/useTunnelSteps";
import { FormValues } from "./types";
import {
  buildAdresseRue,
  formatAdresseDisplay,
  isContactValid,
  isDatesRuptureValid,
  isObjectifsValid,
  isRentreeSansContratValid,
  isValidPhone,
  isValidEmail,
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
    situation_type: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
    risque_rupture: null,
    still_at_cfa: true,
    date_rupture: "2026-05-04",
    date_abandon: "",
    date_debut_formation: "",
    recherche_entreprise: "",
    motifs: [ACC_CONJOINT_MOTIF_ENUM.REORIENTATION],
    commentaires_par_motif: {},
    cause_rupture: "Raison de la rupture",
    referent_type: "me",
    referent_details: "",
    verified_info: baseVerifiedInfo,
    rqth_declare: RQTH_DECLARE_ENUM.NON_RENSEIGNE,
    responsable_legal: { nom: "", telephone: "", courriel: "" },
    note_complementaire: "",
    feedback_note: null,
    feedback_remarque: "",
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

  it("accepts valid DOM-TOM numbers", () => {
    expect(isValidPhone("0692123456")).toBe(true); // mobile Réunion
    expect(isValidPhone("0590123456")).toBe(true); // Guadeloupe
    // Format international ultramarin : rejeté par l'ancienne regex FR-only, désormais accepté
    expect(isValidPhone("+262692000001")).toBe(true);
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

describe("buildTunnelSteps", () => {
  it("branche A : risque de rupture puis objectifs", () => {
    expect(buildTunnelSteps(makeValues({ situation_type: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT }))).toEqual([
      "situation",
      "risqueRupture",
      "objectifs",
      "contact",
      "recap",
    ]);
  });

  it("branche B : maintien en formation puis dates de rupture", () => {
    expect(
      buildTunnelSteps(makeValues({ situation_type: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE, still_at_cfa: false }))
    ).toEqual(["situation", "maintienFormation", "datesRupture", "objectifs", "contact", "recap"]);
  });

  it("branche C : pas d'écran intermédiaire de statut", () => {
    expect(buildTunnelSteps(makeValues({ situation_type: CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT }))).toEqual([
      "situation",
      "rentreeSansContrat",
      "objectifs",
      "contact",
      "recap",
    ]);
  });

  it("s'arrête au premier écran tant que la branche n'est pas choisie", () => {
    expect(buildTunnelSteps(makeValues({ situation_type: null }))).toEqual(["situation"]);
  });
});

describe("isObjectifsValid", () => {
  it("valide avec un objectif sans commentaire requis", () => {
    expect(isObjectifsValid(makeValues({ motifs: [ACC_CONJOINT_MOTIF_ENUM.AUTRE] }))).toBe(true);
  });

  it("réorientation sans commentaire reste valide", () => {
    expect(isObjectifsValid(makeValues({ motifs: [ACC_CONJOINT_MOTIF_ENUM.REORIENTATION] }))).toBe(true);
  });

  it("invalide sans objectif", () => {
    expect(isObjectifsValid(makeValues({ motifs: [] }))).toBe(false);
  });

  it("invalide si un frein n'a pas de commentaire", () => {
    expect(isObjectifsValid(makeValues({ motifs: [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT] }))).toBe(false);
    expect(
      isObjectifsValid(
        makeValues({
          motifs: [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT],
          commentaires_par_motif: { [ACC_CONJOINT_MOTIF_ENUM.LOGEMENT]: "Pas de logement" },
        })
      )
    ).toBe(true);
  });

  it("invalide si la recherche d'emploi n'a pas de commentaire", () => {
    expect(isObjectifsValid(makeValues({ motifs: [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI] }))).toBe(false);
  });
});

describe("isDatesRuptureValid", () => {
  it("valide avec date de rupture et cause", () => {
    expect(isDatesRuptureValid(makeValues())).toBe(true);
  });

  it("invalide sans date de rupture", () => {
    expect(isDatesRuptureValid(makeValues({ date_rupture: "" }))).toBe(false);
  });

  it("invalide sans cause", () => {
    expect(isDatesRuptureValid(makeValues({ cause_rupture: "   " }))).toBe(false);
  });

  it("exige la date d'abandon quand le jeune a quitté le CFA", () => {
    expect(isDatesRuptureValid(makeValues({ still_at_cfa: false }))).toBe(false);
    expect(isDatesRuptureValid(makeValues({ still_at_cfa: false, date_abandon: "2026-05-06" }))).toBe(true);
  });

  it("invalide si l'abandon précède la rupture", () => {
    expect(isDatesRuptureValid(makeValues({ still_at_cfa: false, date_abandon: "2026-05-01" }))).toBe(false);
  });
});

describe("isRentreeSansContratValid", () => {
  it("exige la date de début de formation et la recherche d'entreprise", () => {
    expect(isRentreeSansContratValid(makeValues())).toBe(false);
    expect(
      isRentreeSansContratValid(
        makeValues({ date_debut_formation: "2026-01-06", recherche_entreprise: "12 candidatures" })
      )
    ).toBe(true);
  });
});

describe("isContactValid", () => {
  it("valide avec téléphone, adresse et référent", () => {
    expect(isContactValid(makeValues())).toBe(true);
  });

  it("invalide sans téléphone", () => {
    expect(isContactValid(makeValues({ verified_info: { ...baseVerifiedInfo, telephone: "" } }))).toBe(false);
  });

  it("invalide avec un téléphone mal formé", () => {
    expect(isContactValid(makeValues({ verified_info: { ...baseVerifiedInfo, telephone: "123" } }))).toBe(false);
  });

  it("n'exige pas la rue mais exige code postal et commune", () => {
    expect(isContactValid(makeValues({ verified_info: { ...baseVerifiedInfo, adresse_rue: "" } }))).toBe(true);
    expect(isContactValid(makeValues({ verified_info: { ...baseVerifiedInfo, adresse_commune: "" } }))).toBe(false);
    expect(isContactValid(makeValues({ verified_info: { ...baseVerifiedInfo, adresse_code_postal: "" } }))).toBe(false);
  });

  it("accepte un courriel vide mais refuse un courriel invalide", () => {
    expect(isContactValid(makeValues({ verified_info: { ...baseVerifiedInfo, courriel: "" } }))).toBe(true);
    expect(isContactValid(makeValues({ verified_info: { ...baseVerifiedInfo, courriel: "notanemail" } }))).toBe(false);
  });

  it("exige les coordonnées d'un référent autre", () => {
    expect(isContactValid(makeValues({ referent_type: null }))).toBe(false);
    expect(isContactValid(makeValues({ referent_type: "other", referent_details: "" }))).toBe(false);
    expect(isContactValid(makeValues({ referent_type: "other", referent_details: "Jean 0600000000" }))).toBe(true);
  });
});
