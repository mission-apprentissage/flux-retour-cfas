const assert = require("assert").strict;
const { uniqueValues } = require("../../../../src/common/utils/miscUtils");

describe("uniqueValues", () => {
  it("Vérifie la récupération des combinaisons uniques pour des objets à 2 champs", async () => {
    const simpleArray = [
      { annee: "2020", libelle: "Test" },
      { annee: "2021", libelle: "Test" },
      { annee: "2020", libelle: "Test2" },
      { annee: "2021", libelle: "Test2" },
      { annee: "2020", libelle: "Test3" },
      { annee: "2020", libelle: "Test4" },
    ];

    const duplicatesArray = [
      { annee: "2020", libelle: "Test3" },
      { annee: "2020", libelle: "Test3" },
      { annee: "2020", libelle: "Test3" },
      { annee: "2020", libelle: "Test4" },
      { annee: "2020", libelle: "Test4" },
      { annee: "2020", libelle: "Test4" },
      { annee: "2020", libelle: "Test4" },
    ];

    const testArray = [...simpleArray, ...duplicatesArray];
    const uniqueArray = uniqueValues(testArray, ["annee", "libelle"]);

    // Check unique length
    assert.deepEqual(uniqueArray.length, simpleArray.length);
  });

  it("Vérifie la récupération des combinaisons uniques pour des objets à 3 champs", async () => {
    const simpleArray = [
      { annee: "2020", libelle: "Test", format: "Format1" },
      { annee: "2021", libelle: "Test", format: "Format1" },
      { annee: "2021", libelle: "Test", format: "Format2" },
      { annee: "2020", libelle: "Test2", format: "Format1" },
      { annee: "2021", libelle: "Test2", format: "Format1" },
      { annee: "2021", libelle: "Test2", format: "Format2" },
      { annee: "2021", libelle: "Test2", format: "Format3" },
      { annee: "2020", libelle: "Test3", format: "Format1" },
      { annee: "2020", libelle: "Test4", format: "Format1" },
    ];

    const duplicatesArray = [
      { annee: "2020", libelle: "Test3", format: "Format1" },
      { annee: "2021", libelle: "Test", format: "Format2" },
      { annee: "2020", libelle: "Test3", format: "Format1" },
      { annee: "2020", libelle: "Test3", format: "Format1" },
      { annee: "2020", libelle: "Test4", format: "Format1" },
      { annee: "2021", libelle: "Test2", format: "Format3" },
      { annee: "2020", libelle: "Test4", format: "Format1" },
      { annee: "2020", libelle: "Test4", format: "Format1" },
      { annee: "2020", libelle: "Test4", format: "Format1" },
    ];

    const testArray = [...simpleArray, ...duplicatesArray];
    const uniqueArray = uniqueValues(testArray, ["annee", "libelle", "format"]);

    // Check unique length
    assert.deepEqual(uniqueArray.length, simpleArray.length);
  });
});
