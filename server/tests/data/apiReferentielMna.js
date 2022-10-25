const INEXISTANT_UAI = "0000000X";
const SAMPLE_UAI_UNIQUE_ORGANISME = "0921500F";
const SAMPLE_UAI_MULTIPLES_ORGANISMES = "0771504X";
const sampleUniqueOrganismeFromReferentiel = {
  pagination: {
    page: 1,
    resultats_par_page: 10,
    nombre_de_page: 1,
    total: 1,
  },
  organismes: [
    {
      siret: "19921500500018",
      nature: "formateur",
      reseaux: [
        {
          code: "reseau1",
          label: "reseau1",
          sources: ["tableau-de-bord"],
          date_vue: "2022-10-12T04:08:45.574Z",
        },
        {
          code: "reseau1",
          label: "reseau1",
          sources: ["tableau-de-bord"],
          date_vue: "2022-10-12T04:08:45.574Z",
        },
      ],
      adresse: {
        academie: {
          code: "25",
          nom: "Versailles",
        },
        code_insee: "92062",
        code_postal: "92800",
        departement: {
          code: "92",
          nom: "Hauts-de-Seine",
        },
        geojson: {
          geometry: {
            coordinates: [2.237019, 48.882785],
            type: "Point",
          },
          properties: {
            score: 0.9685681818181818,
            source: "geo-adresse-api",
          },
          type: "Feature",
        },
        label: "26 Rue Lucien Voilin 92800 Puteaux",
        localite: "Puteaux",
        region: {
          code: "11",
          nom: "Île-de-France",
        },
      },
      raison_sociale: "LYCEE PROFESSIONNEL VOILIN",
      uai: SAMPLE_UAI_UNIQUE_ORGANISME,
    },
  ],
};

const sampleMultiplesOrganismesFromReferentiel = {
  pagination: {
    page: 1,
    resultats_par_page: 10,
    nombre_de_page: 1,
    total: 1,
  },
  organismes: [
    {
      siret: "19921500500099",
      nature: "formateur",
      reseaux: [
        {
          code: "reseau1",
          label: "reseau1",
          sources: ["tableau-de-bord"],
          date_vue: "2022-10-12T04:08:45.574Z",
        },
        {
          code: "reseau1",
          label: "reseau1",
          sources: ["tableau-de-bord"],
          date_vue: "2022-10-12T04:08:45.574Z",
        },
      ],
      adresse: {
        academie: {
          code: "25",
          nom: "Versailles",
        },
        code_insee: "92062",
        code_postal: "92800",
        departement: {
          code: "92",
          nom: "Hauts-de-Seine",
        },
        geojson: {
          geometry: {
            coordinates: [2.237019, 48.882785],
            type: "Point",
          },
          properties: {
            score: 0.9685681818181818,
            source: "geo-adresse-api",
          },
          type: "Feature",
        },
        label: "26 Rue Lucien Voilin 92800 Puteaux",
        localite: "Puteaux",
        region: {
          code: "11",
          nom: "Île-de-France",
        },
      },
      raison_sociale: "LYCEE PROFESSIONNEL VOILIN",
      uai: SAMPLE_UAI_MULTIPLES_ORGANISMES,
    },
    {
      siret: "19921500500098",
      nature: "formateur",
      reseaux: [
        {
          code: "reseau1",
          label: "reseau1",
          sources: ["tableau-de-bord"],
          date_vue: "2022-10-12T04:08:45.574Z",
        },
        {
          code: "reseau1",
          label: "reseau1",
          sources: ["tableau-de-bord"],
          date_vue: "2022-10-12T04:08:45.574Z",
        },
      ],
      adresse: {
        academie: {
          code: "25",
          nom: "Versailles",
        },
        code_insee: "92062",
        code_postal: "92800",
        departement: {
          code: "92",
          nom: "Hauts-de-Seine",
        },
        geojson: {
          geometry: {
            coordinates: [2.237019, 48.882785],
            type: "Point",
          },
          properties: {
            score: 0.9685681818181818,
            source: "geo-adresse-api",
          },
          type: "Feature",
        },
        label: "55 Rue Lucien Voilin 92800 Puteaux",
        localite: "Puteaux",
        region: {
          code: "11",
          nom: "Île-de-France",
        },
      },
      raison_sociale: "LYCEE PROFESSIONNEL VOILIN 2",
      uai: SAMPLE_UAI_MULTIPLES_ORGANISMES,
    },
  ],
};

module.exports = {
  INEXISTANT_UAI,
  SAMPLE_UAI_MULTIPLES_ORGANISMES,
  SAMPLE_UAI_UNIQUE_ORGANISME,
  sampleMultiplesOrganismesFromReferentiel,
  sampleUniqueOrganismeFromReferentiel,
};
