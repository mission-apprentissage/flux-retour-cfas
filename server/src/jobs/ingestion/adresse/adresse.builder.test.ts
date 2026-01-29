import type { ICommune } from "api-alternance-sdk";
import { describe, it, expect, vi } from "vitest";

import { getCommune } from "@/common/apis/apiAlternance/apiAlternance";

import { buildAdresse } from "./adresse.builder";

vi.mock("@/common/apis/apiAlternance/apiAlternance");

describe("buildAdresse", () => {
  const parisInfo: ICommune = {
    code: {
      insee: "75056",
      postaux: [
        "75001",
        "75002",
        "75003",
        "75004",
        "75005",
        "75006",
        "75007",
        "75008",
        "75009",
        "75010",
        "75011",
        "75012",
        "75013",
        "75014",
        "75015",
        "75016",
        "75017",
        "75018",
        "75019",
        "75020",
        "75116",
      ],
    },
    academie: {
      nom: "Paris",
      id: "A01",
      code: "01",
    },
    anciennes: [],
    arrondissements: [
      {
        code: "75101",
        nom: "Paris 1er Arrondissement",
      },
      {
        code: "75102",
        nom: "Paris 2e Arrondissement",
      },
      {
        code: "75103",
        nom: "Paris 3e Arrondissement",
      },
      {
        code: "75104",
        nom: "Paris 4e Arrondissement",
      },
      {
        code: "75105",
        nom: "Paris 5e Arrondissement",
      },
      {
        code: "75106",
        nom: "Paris 6e Arrondissement",
      },
      {
        code: "75107",
        nom: "Paris 7e Arrondissement",
      },
      {
        code: "75108",
        nom: "Paris 8e Arrondissement",
      },
      {
        code: "75109",
        nom: "Paris 9e Arrondissement",
      },
      {
        code: "75110",
        nom: "Paris 10e Arrondissement",
      },
      {
        code: "75111",
        nom: "Paris 11e Arrondissement",
      },
      {
        code: "75112",
        nom: "Paris 12e Arrondissement",
      },
      {
        code: "75113",
        nom: "Paris 13e Arrondissement",
      },
      {
        code: "75114",
        nom: "Paris 14e Arrondissement",
      },
      {
        code: "75115",
        nom: "Paris 15e Arrondissement",
      },
      {
        code: "75116",
        nom: "Paris 16e Arrondissement",
      },
      {
        code: "75117",
        nom: "Paris 17e Arrondissement",
      },
      {
        code: "75118",
        nom: "Paris 18e Arrondissement",
      },
      {
        code: "75119",
        nom: "Paris 19e Arrondissement",
      },
      {
        code: "75120",
        nom: "Paris 20e Arrondissement",
      },
    ],
    departement: {
      nom: "Paris",
      codeInsee: "75",
    },
    localisation: {
      centre: {
        coordinates: [2.347, 48.8589],
        type: "Point",
      },
      bbox: {
        coordinates: [
          [
            [2.224219, 48.815562],
            [2.469851, 48.815562],
            [2.469851, 48.902148],
            [2.224219, 48.902148],
            [2.224219, 48.815562],
          ],
        ],
        type: "Polygon",
      },
    },
    mission_locale: {
      id: 609,
      nom: "DE PARIS",
      siret: "53132862300149",
      code: "75018",
      localisation: {
        geopoint: {
          type: "Point",
          coordinates: [2.3740736, 48.8848179],
        },
        adresse: "22 rue Pajol",
        cp: "75018",
        ville: "PARIS",
      },
      contact: {
        email: "contact@missionlocaledeparis.fr",
        telephone: "0179970000",
        siteWeb: "https://www.missionlocale.paris/",
      },
    },
    nom: "Paris",
    region: {
      codeInsee: "11",
      nom: "Île-de-France",
    },
  };

  it("devrait retourner null si code_postal_apprenant et code_commune_insee_apprenant sont tous les deux null", async () => {
    const dossier = {};

    const result = await buildAdresse(dossier);
    expect(result).toBeNull();
  });

  it("devrait retourner null si getCommune retourne null", async () => {
    const dossier = {
      adresse_apprenant: "123 Rue de Paris",
      code_postal_apprenant: "75019",
      code_commune_insee_apprenant: "75056",
    };

    vi.mocked(getCommune).mockResolvedValue(null);

    const result = await buildAdresse(dossier);
    expect(result).toBeNull();
    expect(getCommune).toHaveBeenCalledWith({
      codeInsee: "75056",
      codePostal: "75019",
    });
  });

  it("devrait retourner l'adresse correcte si getCommune retourne des données valides", async () => {
    const dossier = {
      adresse_apprenant: "123 Rue de Paris",
      code_postal_apprenant: "75019",
      code_commune_insee_apprenant: "75056",
    };

    vi.mocked(getCommune).mockResolvedValue(parisInfo);

    const result = await buildAdresse(dossier);
    expect(result).toEqual({
      label: "123 Rue de Paris",
      code_postal: "75019",
      code_commune_insee: "75056",
      commune: "Paris",
      code_academie: "01",
      code_departement: "75",
      code_region: "11",
      mission_locale_id: 609,
    });
    expect(getCommune).toHaveBeenCalledWith({
      codeInsee: "75056",
      codePostal: "75019",
    });
  });

  it("devrait utiliser le premier code postal de communeInfo si code_postal_apprenant est null", async () => {
    const dossier = {
      adresse_apprenant: "123 Rue de Paris",
      code_commune_insee_apprenant: "75056",
    };

    vi.mocked(getCommune).mockResolvedValue(parisInfo);

    const result = await buildAdresse(dossier);
    expect(result).toEqual({
      label: "123 Rue de Paris",
      code_postal: "75001",
      code_commune_insee: "75056",
      commune: "Paris",
      code_academie: "01",
      code_departement: "75",
      code_region: "11",
      mission_locale_id: 609,
    });
    expect(getCommune).toHaveBeenCalledWith({
      codeInsee: "75056",
    });
  });

  it("devrait retourner label null si adresse_apprenant est null mais les autres champs sont valides", async () => {
    const dossier = {
      code_postal_apprenant: "75001",
      code_commune_insee_apprenant: "75056",
    };

    vi.mocked(getCommune).mockResolvedValue(parisInfo);

    const result = await buildAdresse(dossier);
    expect(result).toEqual({
      label: null,
      code_postal: "75001",
      code_commune_insee: "75056",
      commune: "Paris",
      code_academie: "01",
      code_departement: "75",
      code_region: "11",
      mission_locale_id: 609,
    });
    expect(getCommune).toHaveBeenCalledWith({
      codeInsee: "75056",
      codePostal: "75001",
    });
  });

  it("devrait retourner l'adresse correcte si code_commune_insee_apprenant est null mais code_postal_apprenant est valide", async () => {
    const dossier = {
      adresse_apprenant: "123 Rue de Lyon",
      code_postal_apprenant: "75019",
    };

    vi.mocked(getCommune).mockResolvedValue(parisInfo);

    const result = await buildAdresse(dossier);
    expect(result).toEqual({
      label: "123 Rue de Lyon",
      code_postal: "75019",
      code_commune_insee: "75056",
      commune: "Paris",
      code_academie: "01",
      code_departement: "75",
      code_region: "11",
      mission_locale_id: 609,
    });
    expect(getCommune).toHaveBeenCalledWith({
      codePostal: "75019",
    });
  });
});
