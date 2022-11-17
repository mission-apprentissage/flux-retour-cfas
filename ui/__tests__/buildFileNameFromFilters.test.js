import { buildFileName } from "../common/utils/buildFileNameFromFilters";

it("builds file name with no filters", () => {
  const base = "nom_fichier";
  const filters = {};
  expect(buildFileName(base, filters)).toEqual("nom_fichier.csv");
});

it("builds file name with departement in filters", () => {
  const base = "nom_fichier";
  const filters = {
    departement: { nom: "Seine-et-Marne" },
  };
  expect(buildFileName(base, filters)).toEqual("nom_fichier_departement_Seine-et-Marne.csv");
});

it("builds file name with departement and date in filters", () => {
  const base = "nom_fichier";
  const filters = {
    departement: { nom: "Seine-et-Marne" },
    date: new Date("2022-01-15T13:00:00.000Z"),
  };
  expect(buildFileName(base, filters)).toEqual("nom_fichier_departement_Seine-et-Marne_2022-01-15T13:00:00.000Z.csv");
});

it("builds file name with region and date in filters", () => {
  const base = "nom_fichier";
  const filters = { region: { nom: "Bretagne" }, date: new Date("2022-01-15T13:00:00.000Z") };
  expect(buildFileName(base, filters)).toEqual("nom_fichier_region_Bretagne_2022-01-15T13:00:00.000Z.csv");
});

it("builds file name with region, uai and date in filters", () => {
  const base = "nom_fichier";
  const filters = {
    region: { nom: "Bretagne" },
    cfa: { uai_etablissement: "0090019X" },
    date: new Date("2022-01-15T13:00:00.000Z"),
  };
  expect(buildFileName(base, filters)).toEqual("nom_fichier_uai_0090019X_2022-01-15T13:00:00.000Z.csv");
});

it("builds file name with departement, uai and date in filters", () => {
  const base = "nom_fichier";
  const filters = {
    region: { nom: "Bretagne" },
    cfa: { uai_etablissement: "0090019X" },
    date: new Date("2022-01-15T13:00:00.000Z"),
  };
  expect(buildFileName(base, filters)).toEqual("nom_fichier_uai_0090019X_2022-01-15T13:00:00.000Z.csv");
});

it("builds file name with formation in filters", () => {
  const base = "nom_fichier";
  const filters = {
    formation: { cfd: "50025524" },
  };
  expect(buildFileName(base, filters)).toEqual("nom_fichier_cfd_50025524.csv");
});

it("builds file name with formation and departement and date in filters", () => {
  const base = "nom_fichier";
  const filters = {
    formation: { cfd: "50025524" },
    departement: { nom: "Seine-et-Marne" },
    date: new Date("2022-01-15T13:00:00.000Z"),
  };
  expect(buildFileName(base, filters)).toEqual(
    "nom_fichier_departement_Seine-et-Marne_cfd_50025524_2022-01-15T13:00:00.000Z.csv"
  );
});

it("builds file name with reseau in filters", () => {
  const base = "nom_fichier";
  const filters = {
    reseau: { nom: "MFR" },
  };
  expect(buildFileName(base, filters)).toEqual("nom_fichier_reseau_MFR.csv");
});

it("builds file name with reseau and departement and date in filters", () => {
  const base = "nom_fichier";
  const filters = {
    reseau: { nom: "MFR" },
    departement: { nom: "Seine-et-Marne" },
    date: new Date("2022-01-15T13:00:00.000Z"),
  };
  expect(buildFileName(base, filters)).toEqual(
    "nom_fichier_departement_Seine-et-Marne_reseau_MFR_2022-01-15T13:00:00.000Z.csv"
  );
});
