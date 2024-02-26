import { sortAlphabeticallyBy } from "../utils/sortAlphabetically";

/**
 * Liste des régions du territoire national
 * https://fr.wikipedia.org/wiki/Code_officiel_g%C3%A9ographique
 */
export const REGIONS = [
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
    code: "05",
    nom: "Saint-Pierre-et-Miquelon",
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
  {
    nom: "Saint-Martin",
    code: "978",
  },
  {
    nom: "Saint-Barthélemy",
    code: "977",
  },
  {
    nom: "Collectivité d'outre-mer",
    code: "00",
  },
] as const;

type IRegions = typeof REGIONS;
export type IRegion = IRegions[number];
export type IRegionCode = IRegion["code"];

export const REGIONS_BY_CODE: Record<IRegionCode, IRegion> = REGIONS.reduce<Record<IRegionCode, IRegion>>(
  (acc, region) => {
    acc[region.code] = region;
    return acc;
  },
  {} as Record<IRegionCode, IRegion>
);

export const DEPARTEMENTS = [
  {
    nom: "Ain",
    code: "01",
    uaiCode: "01",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "10",
      nom: "Lyon",
    },
  },
  {
    nom: "Aisne",
    code: "02",
    uaiCode: "02",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
    academie: {
      code: "20",
      nom: "Amiens",
    },
  },
  {
    nom: "Allier",
    code: "03",
    uaiCode: "03",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "6",
      nom: "Clermont-Ferrand",
    },
  },
  {
    nom: "Alpes-de-Haute-Provence",
    code: "04",
    uaiCode: "04",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "2",
      nom: "Aix-Marseille",
    },
  },
  {
    nom: "Hautes-Alpes",
    code: "05",
    uaiCode: "05",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "2",
      nom: "Aix-Marseille",
    },
  },
  {
    nom: "Alpes-Maritimes",
    code: "06",
    uaiCode: "06",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "23",
      nom: "Nice",
    },
  },
  {
    nom: "Ardèche",
    code: "07",
    uaiCode: "07",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "8",
      nom: "Grenoble",
    },
  },
  {
    nom: "Ardennes",
    code: "08",
    uaiCode: "08",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "19",
      nom: "Reims",
    },
  },
  {
    nom: "Ariège",
    code: "09",
    uaiCode: "09",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Aube",
    code: "10",
    uaiCode: "10",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "19",
      nom: "Reims",
    },
  },
  {
    nom: "Aude",
    code: "11",
    uaiCode: "11",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "11",
      nom: "Montpellier",
    },
  },
  {
    nom: "Aveyron",
    code: "12",
    uaiCode: "12",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Bouches-du-Rhône",
    code: "13",
    uaiCode: "13",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "2",
      nom: "Aix-Marseille",
    },
  },
  {
    nom: "Calvados",
    code: "14",
    uaiCode: "14",
    region: {
      code: "28",
      nom: "Normandie",
    },
    academie: {
      code: "70",
      nom: "Normandie",
    },
  },
  {
    nom: "Cantal",
    code: "15",
    uaiCode: "15",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "6",
      nom: "Clermont-Ferrand",
    },
  },
  {
    nom: "Charente",
    code: "16",
    uaiCode: "16",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "13",
      nom: "Poitiers",
    },
  },
  {
    nom: "Charente-Maritime",
    code: "17",
    uaiCode: "17",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "13",
      nom: "Poitiers",
    },
  },
  {
    nom: "Cher",
    code: "18",
    uaiCode: "18",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Corrèze",
    code: "19",
    uaiCode: "19",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "22",
      nom: "Limoges",
    },
  },
  {
    nom: "Côte-d'Or",
    code: "21",
    uaiCode: "21",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "7",
      nom: "Dijon",
    },
  },
  {
    nom: "Côtes-d'Armor",
    code: "22",
    uaiCode: "22",
    region: {
      code: "53",
      nom: "Bretagne",
    },
    academie: {
      code: "14",
      nom: "Rennes",
    },
  },
  {
    nom: "Creuse",
    code: "23",
    uaiCode: "23",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "22",
      nom: "Limoges",
    },
  },
  {
    nom: "Dordogne",
    code: "24",
    uaiCode: "24",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "4",
      nom: "Bordeaux",
    },
  },
  {
    nom: "Doubs",
    code: "25",
    uaiCode: "25",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "3",
      nom: "Besançon",
    },
  },
  {
    nom: "Drôme",
    code: "26",
    uaiCode: "26",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "8",
      nom: "Grenoble",
    },
  },
  {
    nom: "Eure",
    code: "27",
    uaiCode: "27",
    region: {
      code: "28",
      nom: "Normandie",
    },
    academie: {
      code: "70",
      nom: "Normandie",
    },
  },
  {
    nom: "Eure-et-Loir",
    code: "28",
    uaiCode: "28",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Finistère",
    code: "29",
    uaiCode: "29",
    region: {
      code: "53",
      nom: "Bretagne",
    },
    academie: {
      code: "14",
      nom: "Rennes",
    },
  },
  {
    nom: "Corse-du-Sud",
    code: "2A",
    uaiCode: "620",
    region: {
      code: "94",
      nom: "Corse",
    },
    academie: {
      code: "27",
      nom: "Corse",
    },
  },
  {
    nom: "Haute-Corse",
    code: "2B",
    uaiCode: "720",
    region: {
      code: "94",
      nom: "Corse",
    },
    academie: {
      code: "27",
      nom: "Corse",
    },
  },
  {
    nom: "Gard",
    code: "30",
    uaiCode: "30",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "11",
      nom: "Montpellier",
    },
  },
  {
    nom: "Haute-Garonne",
    code: "31",
    uaiCode: "31",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Gers",
    code: "32",
    uaiCode: "32",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Gironde",
    code: "33",
    uaiCode: "33",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "4",
      nom: "Bordeaux",
    },
  },
  {
    nom: "Hérault",
    code: "34",
    uaiCode: "34",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "11",
      nom: "Montpellier",
    },
  },
  {
    nom: "Ille-et-Vilaine",
    code: "35",
    uaiCode: "35",
    region: {
      code: "53",
      nom: "Bretagne",
    },
    academie: {
      code: "14",
      nom: "Rennes",
    },
  },
  {
    nom: "Indre",
    code: "36",
    uaiCode: "36",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Indre-et-Loire",
    code: "37",
    uaiCode: "37",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Isère",
    code: "38",
    uaiCode: "38",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "8",
      nom: "Grenoble",
    },
  },
  {
    nom: "Jura",
    code: "39",
    uaiCode: "39",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "3",
      nom: "Besançon",
    },
  },
  {
    nom: "Landes",
    code: "40",
    uaiCode: "40",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "4",
      nom: "Bordeaux",
    },
  },
  {
    nom: "Loir-et-Cher",
    code: "41",
    uaiCode: "41",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Loire",
    code: "42",
    uaiCode: "42",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "10",
      nom: "Lyon",
    },
  },
  {
    nom: "Haute-Loire",
    code: "43",
    uaiCode: "43",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "6",
      nom: "Clermont-Ferrand",
    },
  },
  {
    nom: "Loire-Atlantique",
    code: "44",
    uaiCode: "44",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
    academie: {
      code: "17",
      nom: "Nantes",
    },
  },
  {
    nom: "Loiret",
    code: "45",
    uaiCode: "45",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Lot",
    code: "46",
    uaiCode: "46",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Lot-et-Garonne",
    code: "47",
    uaiCode: "47",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "4",
      nom: "Bordeaux",
    },
  },
  {
    nom: "Lozère",
    code: "48",
    uaiCode: "48",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "11",
      nom: "Montpellier",
    },
  },
  {
    nom: "Maine-et-Loire",
    code: "49",
    uaiCode: "49",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
    academie: {
      code: "17",
      nom: "Nantes",
    },
  },
  {
    nom: "Manche",
    code: "50",
    uaiCode: "50",
    region: {
      code: "28",
      nom: "Normandie",
    },
    academie: {
      code: "70",
      nom: "Normandie",
    },
  },
  {
    nom: "Marne",
    code: "51",
    uaiCode: "51",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "19",
      nom: "Reims",
    },
  },
  {
    nom: "Haute-Marne",
    code: "52",
    uaiCode: "52",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "19",
      nom: "Reims",
    },
  },
  {
    nom: "Mayenne",
    code: "53",
    uaiCode: "53",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
    academie: {
      code: "17",
      nom: "Nantes",
    },
  },
  {
    nom: "Meurthe-et-Moselle",
    code: "54",
    uaiCode: "54",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "12",
      nom: "Nancy-Metz",
    },
  },
  {
    nom: "Meuse",
    code: "55",
    uaiCode: "55",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "12",
      nom: "Nancy-Metz",
    },
  },
  {
    nom: "Morbihan",
    code: "56",
    uaiCode: "56",
    region: {
      code: "53",
      nom: "Bretagne",
    },
    academie: {
      code: "14",
      nom: "Rennes",
    },
  },
  {
    nom: "Moselle",
    code: "57",
    uaiCode: "57",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "12",
      nom: "Nancy-Metz",
    },
  },
  {
    nom: "Nièvre",
    code: "58",
    uaiCode: "58",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "7",
      nom: "Dijon",
    },
  },
  {
    nom: "Nord",
    code: "59",
    uaiCode: "59",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
    academie: {
      code: "9",
      nom: "Lille",
    },
  },
  {
    nom: "Oise",
    code: "60",
    uaiCode: "60",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
    academie: {
      code: "20",
      nom: "Amiens",
    },
  },
  {
    nom: "Orne",
    code: "61",
    uaiCode: "61",
    region: {
      code: "28",
      nom: "Normandie",
    },
    academie: {
      code: "70",
      nom: "Normandie",
    },
  },
  {
    nom: "Pas-de-Calais",
    code: "62",
    uaiCode: "62",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
    academie: {
      code: "9",
      nom: "Lille",
    },
  },
  {
    nom: "Puy-de-Dôme",
    code: "63",
    uaiCode: "63",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "6",
      nom: "Clermont-Ferrand",
    },
  },
  {
    nom: "Pyrénées-Atlantiques",
    code: "64",
    uaiCode: "64",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "4",
      nom: "Bordeaux",
    },
  },
  {
    nom: "Hautes-Pyrénées",
    code: "65",
    uaiCode: "65",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Pyrénées-Orientales",
    code: "66",
    uaiCode: "66",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "11",
      nom: "Montpellier",
    },
  },
  {
    nom: "Bas-Rhin",
    code: "67",
    uaiCode: "67",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "15",
      nom: "Strasbourg",
    },
  },
  {
    nom: "Haut-Rhin",
    code: "68",
    uaiCode: "68",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "15",
      nom: "Strasbourg",
    },
  },
  {
    nom: "Rhône",
    code: "69",
    uaiCode: "69",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "10",
      nom: "Lyon",
    },
  },
  {
    nom: "Haute-Saône",
    code: "70",
    uaiCode: "70",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "3",
      nom: "Besançon",
    },
  },
  {
    nom: "Saône-et-Loire",
    code: "71",
    uaiCode: "71",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "7",
      nom: "Dijon",
    },
  },
  {
    nom: "Sarthe",
    code: "72",
    uaiCode: "72",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
    academie: {
      code: "17",
      nom: "Nantes",
    },
  },
  {
    nom: "Savoie",
    code: "73",
    uaiCode: "73",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "8",
      nom: "Grenoble",
    },
  },
  {
    nom: "Haute-Savoie",
    code: "74",
    uaiCode: "74",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "8",
      nom: "Grenoble",
    },
  },
  {
    nom: "Paris",
    code: "75",
    uaiCode: "75",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "1",
      nom: "Paris",
    },
  },
  {
    nom: "Seine-Maritime",
    code: "76",
    uaiCode: "76",
    region: {
      code: "28",
      nom: "Normandie",
    },
    academie: {
      code: "70",
      nom: "Normandie",
    },
  },
  {
    nom: "Seine-et-Marne",
    code: "77",
    uaiCode: "77",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "24",
      nom: "Créteil",
    },
  },
  {
    nom: "Yvelines",
    code: "78",
    uaiCode: "78",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "25",
      nom: "Versailles",
    },
  },
  {
    nom: "Deux-Sèvres",
    code: "79",
    uaiCode: "79",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "13",
      nom: "Poitiers",
    },
  },
  {
    nom: "Somme",
    code: "80",
    uaiCode: "80",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
    academie: {
      code: "20",
      nom: "Amiens",
    },
  },
  {
    nom: "Tarn",
    code: "81",
    uaiCode: "81",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Tarn-et-Garonne",
    code: "82",
    uaiCode: "82",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Var",
    code: "83",
    uaiCode: "83",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "23",
      nom: "Nice",
    },
  },
  {
    nom: "Vaucluse",
    code: "84",
    uaiCode: "84",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "2",
      nom: "Aix-Marseille",
    },
  },
  {
    nom: "Vendée",
    code: "85",
    uaiCode: "85",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
    academie: {
      code: "17",
      nom: "Nantes",
    },
  },
  {
    nom: "Vienne",
    code: "86",
    uaiCode: "86",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "13",
      nom: "Poitiers",
    },
  },
  {
    nom: "Haute-Vienne",
    code: "87",
    uaiCode: "87",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "22",
      nom: "Limoges",
    },
  },
  {
    nom: "Vosges",
    code: "88",
    uaiCode: "88",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "12",
      nom: "Nancy-Metz",
    },
  },
  {
    nom: "Yonne",
    code: "89",
    uaiCode: "89",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "7",
      nom: "Dijon",
    },
  },
  {
    nom: "Territoire de Belfort",
    code: "90",
    uaiCode: "90",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "3",
      nom: "Besançon",
    },
  },
  {
    nom: "Essonne",
    code: "91",
    uaiCode: "91",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "25",
      nom: "Versailles",
    },
  },
  {
    nom: "Hauts-de-Seine",
    code: "92",
    uaiCode: "92",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "25",
      nom: "Versailles",
    },
  },
  {
    nom: "Seine-Saint-Denis",
    code: "93",
    uaiCode: "93",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "24",
      nom: "Créteil",
    },
  },
  {
    nom: "Val-de-Marne",
    code: "94",
    uaiCode: "94",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "24",
      nom: "Créteil",
    },
  },
  {
    nom: "Val-d'Oise",
    code: "95",
    uaiCode: "95",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "25",
      nom: "Versailles",
    },
  },
  {
    nom: "Guadeloupe",
    code: "971",
    uaiCode: "971",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Martinique",
    code: "972",
    uaiCode: "972",
    region: {
      code: "02",
      nom: "Martinique",
    },
    academie: {
      code: "31",
      nom: "Martinique",
    },
  },
  {
    nom: "Guyane",
    code: "973",
    uaiCode: "973",
    region: {
      code: "03",
      nom: "Guyane",
    },
    academie: {
      code: "33",
      nom: "Guyane",
    },
  },
  {
    nom: "La Réunion",
    code: "974",
    uaiCode: "974",
    region: {
      code: "04",
      nom: "La Réunion",
    },
    academie: {
      code: "28",
      nom: "La Réunion",
    },
  },
  {
    nom: "Saint-Pierre-et-Miquelon",
    code: "975",
    uaiCode: "975",
    region: {
      code: "05",
      nom: "Saint-Pierre-et-Miquelon",
    },
    academie: {
      code: "44",
      nom: "Saint-Pierre-et-Miquelon",
    },
  },
  {
    nom: "Mayotte",
    code: "976",
    uaiCode: "976",
    region: {
      code: "06",
      nom: "Mayotte",
    },
    academie: {
      code: "43",
      nom: "Mayotte",
    },
  },
  {
    nom: "Saint-Barthelemy",
    code: "977",
    uaiCode: "977",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Saint-Martin",
    code: "978",
    uaiCode: "978",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Terres australes et antarctique",
    code: "984",
    uaiCode: "984",
    region: {
      // TODO
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      // TODO
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Wallis et Futuna",
    code: "986",
    uaiCode: "986",
    region: {
      code: "02",
      nom: "Martinique",
    },
    academie: {
      code: "31",
      nom: "Martinique",
    },
  },
  {
    nom: "Polynésie française",
    code: "987",
    uaiCode: "987",
    region: {
      // TODO
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      // TODO
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Nouvelle Calédonie",
    code: "988",
    uaiCode: "988",
    region: {
      // TODO
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      // TODO
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Ile de Clipperton",
    code: "989",
    uaiCode: "989",
    region: {
      // TODO
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      // TODO
      code: "32",
      nom: "Guadeloupe",
    },
  },
] as const satisfies Array<{
  nom: string;
  code: string;
  uaiCode: string;
  region: Pick<IRegion, "nom" | "code">;
  academie: IAcademie;
}>;

type IDepartements = typeof DEPARTEMENTS;
export type IDepartement = IDepartements[number];
export type IDepartmentCode = IDepartement["code"];

export const DEPARTEMENTS_BY_CODE: Record<IDepartmentCode, IDepartement> = DEPARTEMENTS.reduce(
  (acc, departement) => {
    acc[departement.code] = departement;
    return acc;
  },
  {} as Record<IDepartmentCode, IDepartement>
);

export const ACADEMIES = [
  { nom: "Paris", code: "1" },
  { nom: "Aix-Marseille", code: "2" },
  { nom: "Besançon", code: "3" },
  { nom: "Bordeaux", code: "4" },
  { nom: "Clermont-Ferrand", code: "6" },
  { nom: "Dijon", code: "7" },
  { nom: "Grenoble", code: "8" },
  { nom: "Lille", code: "9" },
  { nom: "Lyon", code: "10" },
  { nom: "Montpellier", code: "11" },
  { nom: "Nancy-Metz", code: "12" },
  { nom: "Poitiers", code: "13" },
  { nom: "Rennes", code: "14" },
  { nom: "Strasbourg", code: "15" },
  { nom: "Toulouse", code: "16" },
  { nom: "Nantes", code: "17" },
  { nom: "Orléans-Tours", code: "18" },
  { nom: "Reims", code: "19" },
  { nom: "Amiens", code: "20" },
  { nom: "Limoges", code: "22" },
  { nom: "Nice", code: "23" },
  { nom: "Créteil", code: "24" },
  { nom: "Versailles", code: "25" },
  { nom: "Corse", code: "27" },
  { nom: "La Réunion", code: "28" },
  { nom: "Martinique", code: "31" },
  { nom: "Guadeloupe", code: "32" },
  { nom: "Guyane", code: "33" },
  { nom: "Mayotte", code: "43" },
  { nom: "Saint-Pierre-et-Miquelon", code: "44" },
  { nom: "Normandie", code: "70" },
  { nom: "Saint-Barthélemy", code: "77" },
  { nom: "Saint-Martin", code: "78" },
] as const;
type IAcademies = typeof ACADEMIES;
export type IAcademie = IAcademies[number];
export type IAcademieCode = IAcademie["code"];

export const ACADEMIES_BY_CODE: Record<IAcademieCode, IAcademie> = ACADEMIES.reduce(
  (acc, academie) => {
    acc[academie.code] = academie;
    return acc;
  },
  {} as Record<IAcademieCode, IAcademie>
);

export const TERRITOIRE_TYPE = {
  REGION: "region",
  DEPARTEMENT: "departement",
  ACADEMIE: "academie",
};

/**
 * Généré avec la commande :
 * xlsx-cli ZE2020_au_01-01-2023.xlsx --sheet-index=0 2>/dev/null | tail -n+7 | head -n-1 | jq -Rn 'reduce inputs as $line ([]; . + [$line | split(",") | {code: .[0], nom: .[1]} ])' > bassins_emploi.json
 */
export const BASSINS_EMPLOI = [
  {
    code: "0051",
    nom: "Alençon",
  },
  {
    code: "0052",
    nom: "Arles",
  },
  {
    code: "0053",
    nom: "Avignon",
  },
  {
    code: "0054",
    nom: "Beauvais",
  },
  {
    code: "0055",
    nom: "Bollène-Pierrelatte",
  },
  {
    code: "0056",
    nom: "Cosne-Cours-sur-Loire",
  },
  {
    code: "0057",
    nom: "Dreux",
  },
  {
    code: "0058",
    nom: "La Vallée de la Bresle-Vimeu",
  },
  {
    code: "0059",
    nom: "Mâcon",
  },
  {
    code: "0060",
    nom: "Nevers",
  },
  {
    code: "0061",
    nom: "Nogent-le-Rotrou",
  },
  {
    code: "0062",
    nom: "Redon",
  },
  {
    code: "0063",
    nom: "Ussel",
  },
  {
    code: "0064",
    nom: "Valréas",
  },
  {
    code: "0101",
    nom: "Côte sous le vent",
  },
  {
    code: "0102",
    nom: "Est Grande Terre",
  },
  {
    code: "0103",
    nom: "Marie-Galante",
  },
  {
    code: "0104",
    nom: "Région Pointoise",
  },
  {
    code: "0105",
    nom: "Sud Basse-Terre",
  },
  {
    code: "0201",
    nom: "Le Centre-Atlantique",
  },
  {
    code: "0202",
    nom: "Le Centre agglomération",
  },
  {
    code: "0203",
    nom: "Le Nord-Atlantique",
  },
  {
    code: "0204",
    nom: "Le Nord-Caraibe",
  },
  {
    code: "0205",
    nom: "Le Sud",
  },
  {
    code: "0206",
    nom: "Le Sud-Caraibe",
  },
  {
    code: "0301",
    nom: "Est-littoral",
  },
  {
    code: "0302",
    nom: "Ouest-Guyanais",
  },
  {
    code: "0303",
    nom: "Savanes",
  },
  {
    code: "0401",
    nom: "L'Est",
  },
  {
    code: "0402",
    nom: "L'Ouest",
  },
  {
    code: "0403",
    nom: "Le Nord",
  },
  {
    code: "0404",
    nom: "Le Sud",
  },
  {
    code: "0601",
    nom: "Mayotte",
  },
  {
    code: "1101",
    nom: "Cergy-Vexin",
  },
  {
    code: "1102",
    nom: "Coulommiers",
  },
  {
    code: "1103",
    nom: "Etampes",
  },
  {
    code: "1104",
    nom: "Evry",
  },
  {
    code: "1105",
    nom: "Fontainebleau-Nemours",
  },
  {
    code: "1106",
    nom: "Marne-la-Vallée",
  },
  {
    code: "1107",
    nom: "Meaux",
  },
  {
    code: "1108",
    nom: "Melun",
  },
  {
    code: "1109",
    nom: "Paris",
  },
  {
    code: "1110",
    nom: "Provins",
  },
  {
    code: "1111",
    nom: "Rambouillet",
  },
  {
    code: "1112",
    nom: "Roissy",
  },
  {
    code: "1113",
    nom: "Saclay",
  },
  {
    code: "1114",
    nom: "Seine-Yvelinoise",
  },
  {
    code: "1115",
    nom: "Versailles-Saint-Quentin",
  },
  {
    code: "2401",
    nom: "Blois",
  },
  {
    code: "2402",
    nom: "Bourges",
  },
  {
    code: "2403",
    nom: "Chartres",
  },
  {
    code: "2404",
    nom: "Châteaudun",
  },
  {
    code: "2405",
    nom: "Châteauroux",
  },
  {
    code: "2406",
    nom: "Chinon",
  },
  {
    code: "2407",
    nom: "Gien",
  },
  {
    code: "2408",
    nom: "Loches",
  },
  {
    code: "2409",
    nom: "Montargis",
  },
  {
    code: "2410",
    nom: "Orléans",
  },
  {
    code: "2411",
    nom: "Pithiviers",
  },
  {
    code: "2412",
    nom: "Romorantin-Lanthenay",
  },
  {
    code: "2413",
    nom: "Tours",
  },
  {
    code: "2414",
    nom: "Vendôme",
  },
  {
    code: "2415",
    nom: "Vierzon",
  },
  {
    code: "2701",
    nom: "Autun",
  },
  {
    code: "2702",
    nom: "Auxerre",
  },
  {
    code: "2703",
    nom: "Avallon",
  },
  {
    code: "2704",
    nom: "Beaune",
  },
  {
    code: "2705",
    nom: "Belfort",
  },
  {
    code: "2706",
    nom: "Besançon",
  },
  {
    code: "2707",
    nom: "Chalon-sur-Saône",
  },
  {
    code: "2708",
    nom: "Charolais",
  },
  {
    code: "2709",
    nom: "Châtillon-Montbard",
  },
  {
    code: "2710",
    nom: "Creusot-Montceau",
  },
  {
    code: "2711",
    nom: "Dijon",
  },
  {
    code: "2712",
    nom: "Dole",
  },
  {
    code: "2713",
    nom: "Lons-le-Saunier",
  },
  {
    code: "2714",
    nom: "Montbéliard",
  },
  {
    code: "2715",
    nom: "Pontarlier",
  },
  {
    code: "2716",
    nom: "Saint-Claude",
  },
  {
    code: "2717",
    nom: "Sens",
  },
  {
    code: "2718",
    nom: "Vesoul",
  },
  {
    code: "2801",
    nom: "Argentan",
  },
  {
    code: "2802",
    nom: "Avranches",
  },
  {
    code: "2803",
    nom: "Bernay",
  },
  {
    code: "2804",
    nom: "Caen",
  },
  {
    code: "2805",
    nom: "Cherbourg en Cotentin",
  },
  {
    code: "2806",
    nom: "Coutances",
  },
  {
    code: "2807",
    nom: "Dieppe-Caux maritime",
  },
  {
    code: "2808",
    nom: "Evreux",
  },
  {
    code: "2809",
    nom: "Flers",
  },
  {
    code: "2810",
    nom: "Granville",
  },
  {
    code: "2811",
    nom: "Honfleur Pont-Audemer",
  },
  {
    code: "2812",
    nom: "L'Aigle",
  },
  {
    code: "2813",
    nom: "Le Havre",
  },
  {
    code: "2814",
    nom: "Lisieux",
  },
  {
    code: "2815",
    nom: "Rouen",
  },
  {
    code: "2816",
    nom: "Saint-Lô",
  },
  {
    code: "2817",
    nom: "Vernon-Gisors",
  },
  {
    code: "2818",
    nom: "Vire Normandie",
  },
  {
    code: "2819",
    nom: "Yvetot-Vallée du Commerce",
  },
  {
    code: "3201",
    nom: "Abbeville",
  },
  {
    code: "3202",
    nom: "Amiens",
  },
  {
    code: "3203",
    nom: "Arras",
  },
  {
    code: "3204",
    nom: "Berck",
  },
  {
    code: "3205",
    nom: "Béthune",
  },
  {
    code: "3206",
    nom: "Boulogne-sur-Mer",
  },
  {
    code: "3207",
    nom: "Calais",
  },
  {
    code: "3208",
    nom: "Cambrai",
  },
  {
    code: "3209",
    nom: "Château-Thierry",
  },
  {
    code: "3210",
    nom: "Compiègne",
  },
  {
    code: "3211",
    nom: "Creil",
  },
  {
    code: "3212",
    nom: "Douai",
  },
  {
    code: "3213",
    nom: "Dunkerque",
  },
  {
    code: "3214",
    nom: "Laon",
  },
  {
    code: "3215",
    nom: "Lens",
  },
  {
    code: "3216",
    nom: "Lille",
  },
  {
    code: "3217",
    nom: "Maubeuge",
  },
  {
    code: "3218",
    nom: "Roubaix-Tourcoing",
  },
  {
    code: "3219",
    nom: "Saint-Omer",
  },
  {
    code: "3220",
    nom: "Saint-Quentin",
  },
  {
    code: "3221",
    nom: "Soissons",
  },
  {
    code: "3222",
    nom: "Valenciennes",
  },
  {
    code: "4401",
    nom: "Bar-le-Duc",
  },
  {
    code: "4402",
    nom: "Châlons-en-Champagne",
  },
  {
    code: "4403",
    nom: "Charleville-Mézières",
  },
  {
    code: "4404",
    nom: "Chaumont",
  },
  {
    code: "4405",
    nom: "Colmar",
  },
  {
    code: "4406",
    nom: "Épernay",
  },
  {
    code: "4407",
    nom: "Épinal",
  },
  {
    code: "4408",
    nom: "Forbach",
  },
  {
    code: "4409",
    nom: "Haguenau",
  },
  {
    code: "4410",
    nom: "Metz",
  },
  {
    code: "4411",
    nom: "Mulhouse",
  },
  {
    code: "4412",
    nom: "Nancy",
  },
  {
    code: "4413",
    nom: "Reims",
  },
  {
    code: "4414",
    nom: "Remiremont",
  },
  {
    code: "4415",
    nom: "Romilly-sur-Seine",
  },
  {
    code: "4416",
    nom: "Saint-Avold",
  },
  {
    code: "4417",
    nom: "Saint-Dié-des-Vosges",
  },
  {
    code: "4418",
    nom: "Saint-Louis",
  },
  {
    code: "4419",
    nom: "Sarrebourg",
  },
  {
    code: "4420",
    nom: "Sarreguemines",
  },
  {
    code: "4421",
    nom: "Sedan",
  },
  {
    code: "4422",
    nom: "Sélestat",
  },
  {
    code: "4423",
    nom: "Strasbourg",
  },
  {
    code: "4424",
    nom: "Thionville",
  },
  {
    code: "4425",
    nom: "Troyes",
  },
  {
    code: "4426",
    nom: "Verdun",
  },
  {
    code: "4427",
    nom: "Vitry-le-François Saint-Dizier",
  },
  {
    code: "5201",
    nom: "Ancenis",
  },
  {
    code: "5202",
    nom: "Angers",
  },
  {
    code: "5203",
    nom: "Challans",
  },
  {
    code: "5204",
    nom: "Château-Gontier",
  },
  {
    code: "5205",
    nom: "Châteaubriant",
  },
  {
    code: "5206",
    nom: "Cholet",
  },
  {
    code: "5207",
    nom: "Fontenay-le-Comte",
  },
  {
    code: "5208",
    nom: "La Ferté-Bernard",
  },
  {
    code: "5209",
    nom: "La Flèche",
  },
  {
    code: "5210",
    nom: "La Roche-sur-Yon",
  },
  {
    code: "5211",
    nom: "Laval",
  },
  {
    code: "5212",
    nom: "Le Mans",
  },
  {
    code: "5213",
    nom: "Les Herbiers-Montaigu",
  },
  {
    code: "5214",
    nom: "Les Sables-d'Olonne",
  },
  {
    code: "5215",
    nom: "Mayenne",
  },
  {
    code: "5216",
    nom: "Nantes",
  },
  {
    code: "5217",
    nom: "Pornic",
  },
  {
    code: "5218",
    nom: "Sablé-sur-Sarthe",
  },
  {
    code: "5219",
    nom: "Saint-Nazaire",
  },
  {
    code: "5220",
    nom: "Saumur",
  },
  {
    code: "5221",
    nom: "Segré-en-Anjou Bleu",
  },
  {
    code: "5301",
    nom: "Auray",
  },
  {
    code: "5302",
    nom: "Brest",
  },
  {
    code: "5303",
    nom: "Carhaix-Plouguer",
  },
  {
    code: "5304",
    nom: "Dinan",
  },
  {
    code: "5305",
    nom: "Fougères",
  },
  {
    code: "5306",
    nom: "Guingamp",
  },
  {
    code: "5307",
    nom: "Lamballe-Armor",
  },
  {
    code: "5308",
    nom: "Lannion",
  },
  {
    code: "5309",
    nom: "Lorient",
  },
  {
    code: "5310",
    nom: "Morlaix",
  },
  {
    code: "5311",
    nom: "Ploërmel",
  },
  {
    code: "5312",
    nom: "Pontivy-Loudéac",
  },
  {
    code: "5313",
    nom: "Quimper",
  },
  {
    code: "5314",
    nom: "Quimperlé",
  },
  {
    code: "5315",
    nom: "Rennes",
  },
  {
    code: "5316",
    nom: "Saint-Brieuc",
  },
  {
    code: "5317",
    nom: "Saint-Malo",
  },
  {
    code: "5318",
    nom: "Vannes",
  },
  {
    code: "5319",
    nom: "Vitré",
  },
  {
    code: "7501",
    nom: "Agen",
  },
  {
    code: "7502",
    nom: "Angoulême",
  },
  {
    code: "7503",
    nom: "Bayonne",
  },
  {
    code: "7504",
    nom: "Bergerac",
  },
  {
    code: "7505",
    nom: "Bordeaux",
  },
  {
    code: "7506",
    nom: "Bressuire",
  },
  {
    code: "7507",
    nom: "Brive-la-Gaillarde",
  },
  {
    code: "7508",
    nom: "Châtellerault",
  },
  {
    code: "7509",
    nom: "Cognac",
  },
  {
    code: "7510",
    nom: "Dax",
  },
  {
    code: "7511",
    nom: "Guéret",
  },
  {
    code: "7512",
    nom: "La Rochelle",
  },
  {
    code: "7513",
    nom: "La Teste-de-Buch",
  },
  {
    code: "7514",
    nom: "Langon",
  },
  {
    code: "7515",
    nom: "Lesparre-Médoc",
  },
  {
    code: "7516",
    nom: "Libourne",
  },
  {
    code: "7517",
    nom: "Limoges",
  },
  {
    code: "7518",
    nom: "Marmande",
  },
  {
    code: "7519",
    nom: "Mont-de-Marsan",
  },
  {
    code: "7520",
    nom: "Niort",
  },
  {
    code: "7521",
    nom: "Oloron-Sainte-Marie",
  },
  {
    code: "7522",
    nom: "Pau",
  },
  {
    code: "7523",
    nom: "Périgueux",
  },
  {
    code: "7524",
    nom: "Poitiers",
  },
  {
    code: "7525",
    nom: "Rochefort",
  },
  {
    code: "7526",
    nom: "Royan",
  },
  {
    code: "7527",
    nom: "Saint-Junien",
  },
  {
    code: "7528",
    nom: "Saintes",
  },
  {
    code: "7529",
    nom: "Sarlat-La-Canéda",
  },
  {
    code: "7530",
    nom: "Thouars",
  },
  {
    code: "7531",
    nom: "Tulle",
  },
  {
    code: "7532",
    nom: "Villeneuve-sur-Lot",
  },
  {
    code: "7601",
    nom: "Agde-Pézenas",
  },
  {
    code: "7602",
    nom: "Albi",
  },
  {
    code: "7603",
    nom: "Alès-Le Vigan",
  },
  {
    code: "7604",
    nom: "Auch",
  },
  {
    code: "7605",
    nom: "Bagnols-sur-Cèze",
  },
  {
    code: "7606",
    nom: "Béziers",
  },
  {
    code: "7607",
    nom: "Cahors",
  },
  {
    code: "7608",
    nom: "Carcassonne-Limoux",
  },
  {
    code: "7609",
    nom: "Castelsarrasin-Moissac",
  },
  {
    code: "7610",
    nom: "Castres-Mazamet",
  },
  {
    code: "7611",
    nom: "Figeac-Villefranche",
  },
  {
    code: "7612",
    nom: "Foix-Pamiers",
  },
  {
    code: "7613",
    nom: "Mende",
  },
  {
    code: "7614",
    nom: "Millau",
  },
  {
    code: "7615",
    nom: "Montauban",
  },
  {
    code: "7616",
    nom: "Montpellier",
  },
  {
    code: "7617",
    nom: "Narbonne",
  },
  {
    code: "7618",
    nom: "Nîmes",
  },
  {
    code: "7619",
    nom: "Nord-du-Lot",
  },
  {
    code: "7620",
    nom: "Perpignan",
  },
  {
    code: "7621",
    nom: "Rodez",
  },
  {
    code: "7622",
    nom: "Saint-Gaudens",
  },
  {
    code: "7623",
    nom: "Sète",
  },
  {
    code: "7624",
    nom: "Tarbes-Lourdes",
  },
  {
    code: "7625",
    nom: "Toulouse",
  },
  {
    code: "8401",
    nom: "Annecy",
  },
  {
    code: "8402",
    nom: "Aubenas",
  },
  {
    code: "8403",
    nom: "Aurillac",
  },
  {
    code: "8404",
    nom: "Belley",
  },
  {
    code: "8405",
    nom: "Bourg en Bresse",
  },
  {
    code: "8406",
    nom: "Bourgoin-Jallieu",
  },
  {
    code: "8407",
    nom: "Chambéry",
  },
  {
    code: "8408",
    nom: "Clermont-Ferrand",
  },
  {
    code: "8409",
    nom: "Grenoble",
  },
  {
    code: "8410",
    nom: "Issoire",
  },
  {
    code: "8411",
    nom: "La Maurienne",
  },
  {
    code: "8412",
    nom: "La Plaine du Forez",
  },
  {
    code: "8413",
    nom: "La Tarentaise",
  },
  {
    code: "8414",
    nom: "La Vallée de l'Arve",
  },
  {
    code: "8415",
    nom: "Le Chablais",
  },
  {
    code: "8416",
    nom: "Le Genevois Français",
  },
  {
    code: "8417",
    nom: "Le Livradois",
  },
  {
    code: "8418",
    nom: "Le Mont Blanc",
  },
  {
    code: "8419",
    nom: "Le Puy en Velay",
  },
  {
    code: "8420",
    nom: "Les Sources de la Loire",
  },
  {
    code: "8421",
    nom: "Lyon",
  },
  {
    code: "8422",
    nom: "Montélimar",
  },
  {
    code: "8423",
    nom: "Montluçon",
  },
  {
    code: "8424",
    nom: "Moulins",
  },
  {
    code: "8425",
    nom: "Oyonnax",
  },
  {
    code: "8426",
    nom: "Roanne",
  },
  {
    code: "8427",
    nom: "Romans sur Isère",
  },
  {
    code: "8428",
    nom: "Saint Etienne",
  },
  {
    code: "8429",
    nom: "Saint Flour",
  },
  {
    code: "8430",
    nom: "Tarare",
  },
  {
    code: "8431",
    nom: "Valence",
  },
  {
    code: "8432",
    nom: "Vichy",
  },
  {
    code: "8433",
    nom: "Vienne-Annonay",
  },
  {
    code: "8434",
    nom: "Villefranche-sur-Saône",
  },
  {
    code: "8435",
    nom: "Voiron",
  },
  {
    code: "9301",
    nom: "Aix-en-Provence",
  },
  {
    code: "9302",
    nom: "Briançon",
  },
  {
    code: "9303",
    nom: "Brignoles",
  },
  {
    code: "9304",
    nom: "Cannes",
  },
  {
    code: "9305",
    nom: "Carpentras",
  },
  {
    code: "9306",
    nom: "Cavaillon",
  },
  {
    code: "9307",
    nom: "Digne-les-Bains",
  },
  {
    code: "9308",
    nom: "Draguignan",
  },
  {
    code: "9309",
    nom: "Fréjus",
  },
  {
    code: "9310",
    nom: "Gap",
  },
  {
    code: "9311",
    nom: "Manosque",
  },
  {
    code: "9312",
    nom: "Marseille",
  },
  {
    code: "9313",
    nom: "Martigues-Salon",
  },
  {
    code: "9314",
    nom: "Menton",
  },
  {
    code: "9315",
    nom: "Nice",
  },
  {
    code: "9316",
    nom: "Orange",
  },
  {
    code: "9317",
    nom: "Sainte-Maxime",
  },
  {
    code: "9318",
    nom: "Toulon",
  },
  {
    code: "9401",
    nom: "Ajaccio",
  },
  {
    code: "9402",
    nom: "Bastia",
  },
  {
    code: "9403",
    nom: "Calvi",
  },
  {
    code: "9404",
    nom: "Corte",
  },
  {
    code: "9405",
    nom: "Ghisonaccia",
  },
  {
    code: "9406",
    nom: "Porto-Vecchio",
  },
  {
    code: "9407",
    nom: "Propriano",
  },
];

type IBassinsEmplois = typeof BASSINS_EMPLOI;
type IBassinsEmploi = IBassinsEmplois[number];
type IBassinsEmploiCode = IBassinsEmploi["code"];

export const BASSIN_EMPLOI_BY_CODE = BASSINS_EMPLOI.reduce(
  (acc, bassinEmploi) => {
    acc[bassinEmploi.code] = bassinEmploi;
    return acc;
  },
  {} as Record<IBassinsEmploiCode, IBassinsEmploi>
);

export const REGIONS_SORTED = sortAlphabeticallyBy("nom", REGIONS).map((region) => {
  return { ...region, type: TERRITOIRE_TYPE.REGION };
});

export const DEPARTEMENTS_SORTED = sortAlphabeticallyBy("code", DEPARTEMENTS).map((departement) => {
  return { ...departement, type: TERRITOIRE_TYPE.DEPARTEMENT };
});

export const ACADEMIES_SORTED = sortAlphabeticallyBy("nom", Object.values(ACADEMIES)).map((academie) => {
  return { ...academie, type: TERRITOIRE_TYPE.ACADEMIE };
});

export const BASSINS_EMPLOI_SORTED = sortAlphabeticallyBy("nom", BASSINS_EMPLOI);
