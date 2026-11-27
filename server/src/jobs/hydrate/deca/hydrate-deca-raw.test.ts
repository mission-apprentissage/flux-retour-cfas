import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { getAnneesScolairesAImporter } from "./hydrate-deca-raw";

const maintenant = new Date("2026-11-18T00:00:00Z");

const contrat = (date_debut_formation: string, date_fin_formation: string, date_fin_contrat: string | null) => ({
  _id: new ObjectId().toString(),
  formation: { date_debut_formation: new Date(date_debut_formation), date_fin_formation: new Date(date_fin_formation) },
  date_fin_contrat: date_fin_contrat ? new Date(date_fin_contrat) : null,
});

describe("getAnneesScolairesAImporter()", () => {
  it("garde toutes les années d'un contrat récent", () => {
    expect(getAnneesScolairesAImporter(contrat("2025-09-01", "2027-06-30", "2027-08-31"), maintenant)).toStrictEqual([
      "2025-2026",
      "2026-2027",
    ]);
  });

  it("ignore un contrat fini depuis plus de deux ans, sur toutes ses années", () => {
    expect(getAnneesScolairesAImporter(contrat("2022-09-01", "2024-06-30", "2024-08-31"), maintenant)).toStrictEqual(
      []
    );
  });

  it("garde un contrat fini depuis moins de deux ans", () => {
    expect(getAnneesScolairesAImporter(contrat("2023-09-01", "2025-06-30", "2025-01-15"), maintenant)).toStrictEqual([
      "2023-2024",
      "2024-2025",
    ]);
  });

  it("garde une année active malgré une fin de contrat ancienne", () => {
    expect(getAnneesScolairesAImporter(contrat("2025-09-01", "2026-06-30", "2020-08-31"), maintenant)).toStrictEqual([
      "2025-2026",
    ]);
  });

  it("refuse des dates de formation incohérentes", () => {
    expect(() => getAnneesScolairesAImporter(contrat("2026-09-01", "2025-06-30", null), maintenant)).toThrow(
      "Les dates de début et de fin de formation sont incorrectes"
    );
  });
});
