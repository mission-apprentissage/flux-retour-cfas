import ExcelJs from "exceljs";
import { CATALOGUE_CHAMPS_TELEVERSEMENT } from "shared/constants";
import { beforeEach, describe, expect, it } from "vitest";

import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp } from "@tests/utils/testUtils";

describe("Modèle Excel de l'import par fichier", () => {
  useMongo();

  let classeur: ExcelJs.Workbook;
  let statut: number;
  let typeContenu: string;

  beforeEach(async () => {
    const { httpClient } = await initTestApp();
    const response = await httpClient.get("/api/v1/televersement/modele-excel", { responseType: "arraybuffer" });
    statut = response.status;
    typeContenu = String(response.headers["content-type"]);
    classeur = new ExcelJs.Workbook();
    await classeur.xlsx.load(response.data);
  });

  it("se télécharge sans être connecté", () => {
    expect(statut).toBe(200);
    expect(typeContenu).toContain("spreadsheetml");
  });

  it("a des en-têtes lisibles, sans les colonnes SIFA, et le nom technique en note", () => {
    const saisie = classeur.getWorksheet("Effectifs");
    const champs = CATALOGUE_CHAMPS_TELEVERSEMENT.filter((champ) => !champ.sifa);
    const enTetes = (saisie?.getRow(1).values as unknown[]).slice(1);

    expect(enTetes).toEqual(champs.map(({ libelle }) => libelle));
    expect(enTetes).not.toContain("Dernière situation");
    expect(String(saisie?.getRow(1).getCell(1).note)).toContain("nom_apprenant");
    expect(saisie?.actualRowCount).toBe(1);
    expect(saisie?.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
  });

  it("propose des listes pour le sexe et les colonnes Oui ou Non, et replie les colonnes facultatives", () => {
    const saisie = classeur.getWorksheet("Effectifs");
    const enTetes = (saisie?.getRow(1).values as unknown[]).slice(1);
    const colonne = (cle: string) =>
      saisie?.getColumn(
        enTetes.indexOf(CATALOGUE_CHAMPS_TELEVERSEMENT.find((champ) => champ.cle === cle)?.libelle) + 1
      );

    expect(saisie?.getCell(`${colonne("sexe_apprenant")?.letter}2`).dataValidation).toMatchObject({
      type: "list",
      formulae: ['"F,M"'],
    });
    expect(saisie?.getCell(`${colonne("rqth_apprenant")?.letter}100`).dataValidation).toMatchObject({
      formulae: ['"Oui,Non"'],
    });
    expect(colonne("adresse_apprenant")).toMatchObject({ hidden: true, outlineLevel: 1 });
    expect(colonne("nom_apprenant")).toMatchObject({ hidden: false, outlineLevel: 0 });
  });

  it("explique chaque colonne dans une feuille Aide", () => {
    const aide = classeur.getWorksheet("Aide");
    const lignes = aide?.getSheetValues().slice(2) as unknown[][];

    expect(lignes).toHaveLength(CATALOGUE_CHAMPS_TELEVERSEMENT.filter((champ) => !champ.sifa).length);
    expect(lignes.find((ligne) => ligne[2] === "tel_apprenant")?.[3]).toBe("Obligatoire, ou à défaut : Email");
  });
});
