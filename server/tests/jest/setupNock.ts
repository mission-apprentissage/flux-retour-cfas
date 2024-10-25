import nock from "nock";

import { nockExternalApis } from "../utils/nockApis/index";

const communes = {
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
    },
  ],
};

export const useNock = () => {
  beforeAll(() => {
    nock.disableNetConnect();
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
  });
  afterEach(() => {
    nock.cleanAll();
  });
  afterAll(() => {
    nock.enableNetConnect();
  });
};
