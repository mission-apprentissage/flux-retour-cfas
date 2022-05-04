/**
 * Liste des régions du territoire national
 */
const REGIONS = [
  {
    nom: "Guadeloupe",
    code: "01",
  },
  {
    nom: "Martinique",
    code: "02",
  },
  {
    nom: "Guyane",
    code: "03",
  },
  {
    nom: "La Réunion",
    code: "04",
  },
  {
    nom: "Mayotte",
    code: "06",
  },
  {
    nom: "Île-de-France",
    code: "11",
    shortName: "idf",
  },
  {
    nom: "Centre-Val de Loire",
    code: "24",
    shortName: "cvl",
  },
  {
    nom: "Bourgogne-Franche-Comté",
    code: "27",
    shortName: "bfc",
  },
  {
    nom: "Normandie",
    code: "28",
  },
  {
    nom: "Hauts-de-France",
    code: "32",
    shortName: "hdf",
  },
  {
    nom: "Grand Est",
    code: "44",
  },
  {
    nom: "Pays de la Loire",
    code: "52",
    shortName: "pdl",
  },
  {
    nom: "Bretagne",
    code: "53",
  },
  {
    nom: "Nouvelle-Aquitaine",
    code: "75",
    shortName: "na",
  },
  {
    nom: "Occitanie",
    code: "76",
  },
  {
    nom: "Auvergne-Rhône-Alpes",
    code: "84",
    shortName: "ara",
  },
  {
    nom: "Provence-Alpes-Côte d'Azur",
    code: "93",
    shortName: "paca",
  },
  {
    nom: "Corse",
    code: "94",
  },
];

const DEPARTEMENTS = [
  {
    nom: "Ain",
    code: "01",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Aisne",
    code: "02",
    codeRegion: "32",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
  },
  {
    nom: "Allier",
    code: "03",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Alpes-de-Haute-Provence",
    code: "04",
    codeRegion: "93",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
  },
  {
    nom: "Hautes-Alpes",
    code: "05",
    codeRegion: "93",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
  },
  {
    nom: "Alpes-Maritimes",
    code: "06",
    codeRegion: "93",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
  },
  {
    nom: "Ardèche",
    code: "07",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Ardennes",
    code: "08",
    codeRegion: "44",
    region: {
      code: "44",
      nom: "Grand Est",
    },
  },
  {
    nom: "Ariège",
    code: "09",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Aube",
    code: "10",
    codeRegion: "44",
    region: {
      code: "44",
      nom: "Grand Est",
    },
  },
  {
    nom: "Aude",
    code: "11",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Aveyron",
    code: "12",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Bouches-du-Rhône",
    code: "13",
    codeRegion: "93",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
  },
  {
    nom: "Calvados",
    code: "14",
    codeRegion: "28",
    region: {
      code: "28",
      nom: "Normandie",
    },
  },
  {
    nom: "Cantal",
    code: "15",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Charente",
    code: "16",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Charente-Maritime",
    code: "17",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Cher",
    code: "18",
    codeRegion: "24",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
  },
  {
    nom: "Corrèze",
    code: "19",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Côte-d'Or",
    code: "21",
    codeRegion: "27",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
  },
  {
    nom: "Côtes-d'Armor",
    code: "22",
    codeRegion: "53",
    region: {
      code: "53",
      nom: "Bretagne",
    },
  },
  {
    nom: "Creuse",
    code: "23",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Dordogne",
    code: "24",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Doubs",
    code: "25",
    codeRegion: "27",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
  },
  {
    nom: "Drôme",
    code: "26",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Eure",
    code: "27",
    codeRegion: "28",
    region: {
      code: "28",
      nom: "Normandie",
    },
  },
  {
    nom: "Eure-et-Loir",
    code: "28",
    codeRegion: "24",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
  },
  {
    nom: "Finistère",
    code: "29",
    codeRegion: "53",
    region: {
      code: "53",
      nom: "Bretagne",
    },
  },
  {
    nom: "Corse-du-Sud",
    code: "2A",
    codeRegion: "94",
    region: {
      code: "94",
      nom: "Corse",
    },
  },
  {
    nom: "Haute-Corse",
    code: "2B",
    codeRegion: "94",
    region: {
      code: "94",
      nom: "Corse",
    },
  },
  {
    nom: "Gard",
    code: "30",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Haute-Garonne",
    code: "31",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Gers",
    code: "32",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Gironde",
    code: "33",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Hérault",
    code: "34",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Ille-et-Vilaine",
    code: "35",
    codeRegion: "53",
    region: {
      code: "53",
      nom: "Bretagne",
    },
  },
  {
    nom: "Indre",
    code: "36",
    codeRegion: "24",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
  },
  {
    nom: "Indre-et-Loire",
    code: "37",
    codeRegion: "24",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
  },
  {
    nom: "Isère",
    code: "38",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Jura",
    code: "39",
    codeRegion: "27",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
  },
  {
    nom: "Landes",
    code: "40",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Loir-et-Cher",
    code: "41",
    codeRegion: "24",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
  },
  {
    nom: "Loire",
    code: "42",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Haute-Loire",
    code: "43",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Loire-Atlantique",
    code: "44",
    codeRegion: "52",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
  },
  {
    nom: "Loiret",
    code: "45",
    codeRegion: "24",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
  },
  {
    nom: "Lot",
    code: "46",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Lot-et-Garonne",
    code: "47",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Lozère",
    code: "48",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Maine-et-Loire",
    code: "49",
    codeRegion: "52",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
  },
  {
    nom: "Manche",
    code: "50",
    codeRegion: "28",
    region: {
      code: "28",
      nom: "Normandie",
    },
  },
  {
    nom: "Marne",
    code: "51",
    codeRegion: "44",
    region: {
      code: "44",
      nom: "Grand Est",
    },
  },
  {
    nom: "Haute-Marne",
    code: "52",
    codeRegion: "44",
    region: {
      code: "44",
      nom: "Grand Est",
    },
  },
  {
    nom: "Mayenne",
    code: "53",
    codeRegion: "52",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
  },
  {
    nom: "Meurthe-et-Moselle",
    code: "54",
    codeRegion: "44",
    region: {
      code: "44",
      nom: "Grand Est",
    },
  },
  {
    nom: "Meuse",
    code: "55",
    codeRegion: "44",
    region: {
      code: "44",
      nom: "Grand Est",
    },
  },
  {
    nom: "Morbihan",
    code: "56",
    codeRegion: "53",
    region: {
      code: "53",
      nom: "Bretagne",
    },
  },
  {
    nom: "Moselle",
    code: "57",
    codeRegion: "44",
    region: {
      code: "44",
      nom: "Grand Est",
    },
  },
  {
    nom: "Nièvre",
    code: "58",
    codeRegion: "27",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
  },
  {
    nom: "Nord",
    code: "59",
    codeRegion: "32",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
  },
  {
    nom: "Oise",
    code: "60",
    codeRegion: "32",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
  },
  {
    nom: "Orne",
    code: "61",
    codeRegion: "28",
    region: {
      code: "28",
      nom: "Normandie",
    },
  },
  {
    nom: "Pas-de-Calais",
    code: "62",
    codeRegion: "32",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
  },
  {
    nom: "Puy-de-Dôme",
    code: "63",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Pyrénées-Atlantiques",
    code: "64",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Hautes-Pyrénées",
    code: "65",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Pyrénées-Orientales",
    code: "66",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Bas-Rhin",
    code: "67",
    codeRegion: "44",
    region: {
      code: "44",
      nom: "Grand Est",
    },
  },
  {
    nom: "Haut-Rhin",
    code: "68",
    codeRegion: "44",
    region: {
      code: "44",
      nom: "Grand Est",
    },
  },
  {
    nom: "Rhône",
    code: "69",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Haute-Saône",
    code: "70",
    codeRegion: "27",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
  },
  {
    nom: "Saône-et-Loire",
    code: "71",
    codeRegion: "27",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
  },
  {
    nom: "Sarthe",
    code: "72",
    codeRegion: "52",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
  },
  {
    nom: "Savoie",
    code: "73",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Haute-Savoie",
    code: "74",
    codeRegion: "84",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
  },
  {
    nom: "Paris",
    code: "75",
    codeRegion: "11",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
  },
  {
    nom: "Seine-Maritime",
    code: "76",
    codeRegion: "28",
    region: {
      code: "28",
      nom: "Normandie",
    },
  },
  {
    nom: "Seine-et-Marne",
    code: "77",
    codeRegion: "11",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
  },
  {
    nom: "Yvelines",
    code: "78",
    codeRegion: "11",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
  },
  {
    nom: "Deux-Sèvres",
    code: "79",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Somme",
    code: "80",
    codeRegion: "32",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
  },
  {
    nom: "Tarn",
    code: "81",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Tarn-et-Garonne",
    code: "82",
    codeRegion: "76",
    region: {
      code: "76",
      nom: "Occitanie",
    },
  },
  {
    nom: "Var",
    code: "83",
    codeRegion: "93",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
  },
  {
    nom: "Vaucluse",
    code: "84",
    codeRegion: "93",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
  },
  {
    nom: "Vendée",
    code: "85",
    codeRegion: "52",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
  },
  {
    nom: "Vienne",
    code: "86",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Haute-Vienne",
    code: "87",
    codeRegion: "75",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
  },
  {
    nom: "Vosges",
    code: "88",
    codeRegion: "44",
    region: {
      code: "44",
      nom: "Grand Est",
    },
  },
  {
    nom: "Yonne",
    code: "89",
    codeRegion: "27",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
  },
  {
    nom: "Territoire de Belfort",
    code: "90",
    codeRegion: "27",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
  },
  {
    nom: "Essonne",
    code: "91",
    codeRegion: "11",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
  },
  {
    nom: "Hauts-de-Seine",
    code: "92",
    codeRegion: "11",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
  },
  {
    nom: "Seine-Saint-Denis",
    code: "93",
    codeRegion: "11",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
  },
  {
    nom: "Val-de-Marne",
    code: "94",
    codeRegion: "11",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
  },
  {
    nom: "Val-d'Oise",
    code: "95",
    codeRegion: "11",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
  },
  {
    nom: "Guadeloupe",
    code: "971",
    codeRegion: "01",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Martinique",
    code: "972",
    codeRegion: "02",
    region: {
      code: "02",
      nom: "Martinique",
    },
  },
  {
    nom: "Guyane",
    code: "973",
    codeRegion: "03",
    region: {
      code: "03",
      nom: "Guyane",
    },
  },
  {
    nom: "La Réunion",
    code: "974",
    codeRegion: "04",
    region: {
      code: "04",
      nom: "La Réunion",
    },
  },
  {
    nom: "Mayotte",
    code: "976",
    codeRegion: "06",
    region: {
      code: "06",
      nom: "Mayotte",
    },
  },
];

module.exports = { REGIONS, DEPARTEMENTS };
