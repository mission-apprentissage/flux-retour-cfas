import { formatSiretInformation } from "./CfaInformationSection";

it("displays number of SIRET when multiple sous etablissements", () => {
  const input = [
    { siret_etablissement: "44492238900010", nom_etablissement: "CAEN  Organisation" },
    { siret_etablissement: "44492238900051", nom_etablissement: "LE HAVRE Organisation" },
    { siret_etablissement: "78071407700119", nom_etablissement: "LILLEBONNE Entreprise" },
    { siret_etablissement: "", nom_etablissement: "LE MANS Entreprise" },
    { siret_etablissement: "78071407700077", nom_etablissement: "LISIEUX Entreprise" },
    { siret_etablissement: "44492238900093", nom_etablissement: "LE MANS Organisation" },
  ];
  const expectedOutput = "6 SIRET pour cet organisme";

  expect(formatSiretInformation(input)).toEqual(expectedOutput);
});

it("displays SIRET when one sous etablissement", () => {
  const input = [{ siret_etablissement: "44492238900010", nom_etablissement: "CAEN  Organisation" }];
  const expectedOutput = "SIRET : 44492238900010";

  expect(formatSiretInformation(input)).toEqual(expectedOutput);
});

it("displays 'SIRET non renseigné' when one sous etablissement but has no SIRET", () => {
  const input = [{ siret_etablissement: "", nom_etablissement: "CAEN  Organisation" }];
  const expectedOutput = "SIRET non renseigné pour cet organisme";

  expect(formatSiretInformation(input)).toEqual(expectedOutput);
});
