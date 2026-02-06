import type { IApiGetRoutes, IApiResponse } from "api-alternance-sdk";
import nock from "nock";
import { beforeAll, beforeEach, afterEach, afterAll } from "vitest";

import { nockExternalApis } from "../utils/nockApis/index";

const communes: Record<string, IApiResponse<IApiGetRoutes["/geographie/v1/commune/search"]>> = {
  "05109": [
    {
      nom: "Puy-Saint-Pierre",
      code: {
        insee: "05109",
        postaux: ["05100"],
      },
      departement: {
        nom: "Hautes-Alpes",
        codeInsee: "05",
      },
      region: {
        codeInsee: "93",
        nom: "Provence-Alpes-Côte d'Azur",
      },
      academie: {
        id: "A02",
        code: "02",
        nom: "Aix-Marseille",
      },
      localisation: {
        centre: {
          coordinates: [6.6047, 44.8974],
          type: "Point",
        },
        bbox: {
          coordinates: [
            [
              [6.581267, 44.880676],
              [6.628158, 44.880676],
              [6.628158, 44.914182],
              [6.581267, 44.914182],
              [6.581267, 44.880676],
            ],
          ],
          type: "Polygon",
        },
      },
      mission_locale: {
        id: 211,
        nom: "JEUNES HAUTES-ALPES",
        siret: "18053700300048",
        code: "05000",
        localisation: {
          geopoint: {
            coordinates: [6.0895089, 44.5622719],
            type: "Point",
          },
          adresse: "1 Cours du Vieux Moulin",
          cp: "05000",
          ville: "GAP ",
        },
        contact: {
          email: "info@mlj05.org",
          telephone: "04 92 53 00 00",
          siteWeb: "https://www.mj05.fr",
        },
      },
      anciennes: [],
      arrondissements: [],
    },
  ],
  "75001": [
    {
      nom: "Paris",
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
      departement: {
        nom: "Paris",
        codeInsee: "75",
      },
      region: {
        codeInsee: "11",
        nom: "Île-de-France",
      },
      academie: {
        id: "A01",
        code: "01",
        nom: "Paris",
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
            coordinates: [2.3740736, 48.8848179],
            type: "Point",
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
      anciennes: [],
      arrondissements: [],
    },
  ],
};

export const useNock = () => {
  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect("127.0.0.1");
  });
  beforeEach(() => {
    nockExternalApis();

    nock("https://api.apprentissage.beta.gouv.fr/api")
      .get("/geographie/v1/commune/search")
      .query({ code: "05109" })
      .reply(200, communes["05109"])
      .persist();
    nock("https://api.apprentissage.beta.gouv.fr/api")
      .get("/geographie/v1/commune/search")
      .query({ code: "75001" })
      .reply(200, communes["75001"])
      .persist();
    nock("https://api.apprentissage.beta.gouv.fr/api")
      .get("/geographie/v1/mission-locale")
      .query({ latitude: /^\d*\.?\d*$/, longitude: /^\d*\.?\d*$/, radius: /^\d*$/ })
      .reply(200, [communes["75001"][0].mission_locale])
      .persist();
  });
  afterEach(() => {
    nock.cleanAll();
  });
  afterAll(() => {
    nock.enableNetConnect();
  });
};
