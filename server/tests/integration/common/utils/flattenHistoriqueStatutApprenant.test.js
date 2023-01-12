import { strict as assert } from "assert";
import { flattenHistoriqueStatutApprenant } from "../../../../src/common/utils/flattenHistoriqueStatutApprenant.js";

describe("flattenHistoriqueStatutApprenant", () => {
  it("Vérifie qu'un historique est renvoyé vide", async () => {
    const input = [];
    const expectedOutput = [];
    assert.deepEqual(flattenHistoriqueStatutApprenant(input), expectedOutput);
  });
  it("Vérifie qu'un historique de valeur undefined renvoie []", async () => {
    const input = undefined;
    const expectedOutput = [];
    assert.deepEqual(flattenHistoriqueStatutApprenant(input), expectedOutput);
  });
  it("Vérifie qu'un historique avec un seul élément n'est pas modifié", async () => {
    const input = [
      {
        valeur_statut: 3,
        date_statut: "2020-11-01T06:37:01.881Z",
      },
    ];
    assert.deepEqual(flattenHistoriqueStatutApprenant(input), input);
  });
  it("Vérifie qu'un historique avec une séquence de statuts identiques conserve uniquement le premier élément", async () => {
    const input = [
      {
        valeur_statut: 3,
        date_statut: "2020-11-01T06:37:01.881Z",
      },
      {
        valeur_statut: 3,
        date_statut: "2020-11-02T06:42:26.907Z",
      },
      {
        valeur_statut: 3,
        date_statut: "2020-11-03T06:42:00.547Z",
      },
    ];
    const expectedOutput = [input[0]];
    assert.deepEqual(flattenHistoriqueStatutApprenant(input), expectedOutput);
  });
  it("Vérifie qu'un historique avec plusieurs séquences de statuts identiques conserve uniquement le premier élément de chaque séquence", async () => {
    const input = [
      {
        valeur_statut: 1,
        date_statut: "2020-10-01T06:37:01.881Z",
      },
      {
        valeur_statut: 1,
        date_statut: "2020-10-02T06:37:01.881Z",
      },
      {
        valeur_statut: 1,
        date_statut: "2020-10-03T06:37:01.881Z",
      },
      {
        valeur_statut: 3,
        date_statut: "2020-11-01T06:37:01.881Z",
      },
      {
        valeur_statut: 3,
        date_statut: "2020-11-02T06:42:26.907Z",
      },
      {
        valeur_statut: 1,
        date_statut: "2020-12-09T08:30:22.199Z",
      },
      {
        valeur_statut: 3,
        date_statut: "2020-12-10T07:57:21.574Z",
      },
      {
        valeur_statut: 3,
        date_statut: "2020-12-11T08:21:08.315Z",
      },
      {
        valeur_statut: 0,
        date_statut: "2020-12-12T07:48:32.326Z",
      },
      {
        valeur_statut: 0,
        date_statut: "2020-12-13T07:48:32.326Z",
      },
      {
        valeur_statut: 0,
        date_statut: "2020-12-14T07:48:32.326Z",
      },
    ];
    const expectedOutput = [input[0], input[3], input[5], input[6], input[8]];
    assert.deepEqual(flattenHistoriqueStatutApprenant(input), expectedOutput);
  });
});
