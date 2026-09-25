import { IncomingMessage } from "node:http";
import { pipeline } from "node:stream";
import { createGunzip } from "node:zlib";

import axios, { isAxiosError } from "axios";
import { parse } from "csv-parse";
import type { AnyBulkWriteOperation } from "mongodb";
import type { ICommunesVoies } from "shared/models/data/communesVoies.model";

import parentLogger from "@/common/logger";
import { communesVoiesDb } from "@/common/model/collections";
import { normaliserVoie } from "@/common/services/commune/normaliserVoie";

const logger = parentLogger.child({ module: "job:hydrate:communes-voies" });

export const GEO_API_COMMUNES_URL = "https://geo.api.gouv.fr/communes";
export const BAN_ADRESSES_URL = "https://adresse.data.gouv.fr/data/ban/adresses/latest/csv";

const SEUIL_BAISSE_VOLUME = 0.9;

type GeoCommune = {
  code: string;
  nom: string;
  codesPostaux?: string[];
  population?: number;
  codeDepartement: string;
};

type BanLigne = {
  code_postal: string;
  code_insee: string;
  nom_voie: string;
  nom_ld: string;
};

type CodePostalEnCours = {
  communes: ICommunesVoies["communes"];
  departements: Set<string>;
  voies: Map<string, Set<string>>;
};

function codeInseeCommune(codeInsee: string): string {
  if (/^751\d\d$/.test(codeInsee)) return "75056";
  if (/^132\d\d$/.test(codeInsee)) return "13055";
  if (/^6938\d$/.test(codeInsee)) return "69123";
  return codeInsee;
}

async function fetchCommunes(): Promise<GeoCommune[]> {
  const { data } = await axios.get<GeoCommune[]>(GEO_API_COMMUNES_URL, {
    params: { fields: "code,nom,codesPostaux,population,codeDepartement", format: "json" },
    timeout: 120_000,
  });
  return data;
}

function indexerCodesPostauxAmbigus(communes: GeoCommune[]): Map<string, CodePostalEnCours> {
  const parCodePostal = new Map<string, GeoCommune[]>();
  for (const commune of communes) {
    for (const codePostal of commune.codesPostaux ?? []) {
      parCodePostal.set(codePostal, [...(parCodePostal.get(codePostal) ?? []), commune]);
    }
  }

  const ambigus = new Map<string, CodePostalEnCours>();
  for (const [codePostal, candidates] of parCodePostal) {
    if (candidates.length < 2) continue;
    ambigus.set(codePostal, {
      communes: candidates.map((c) => ({ code_insee: c.code, nom: c.nom, population: c.population ?? 0 })),
      departements: new Set(candidates.map((c) => c.codeDepartement)),
      voies: new Map(),
    });
  }
  return ambigus;
}

async function lireVoiesDepartement(departement: string, ambigus: Map<string, CodePostalEnCours>) {
  let res: { data: IncomingMessage };
  try {
    res = await axios.get<IncomingMessage>(`${BAN_ADRESSES_URL}/adresses-${departement}.csv.gz`, {
      responseType: "stream",
      timeout: 300_000,
    });
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      logger.warn({ departement }, "fichier BAN absent, département ignoré");
      return;
    }
    throw err;
  }

  const lignes = pipeline(
    res.data,
    createGunzip(),
    parse({ delimiter: ";", columns: true, relax_quotes: true }),
    () => {}
  );

  for await (const ligne of lignes as AsyncIterable<BanLigne>) {
    const codePostal = ambigus.get(ligne.code_postal);
    if (!codePostal) continue;

    const codeInsee = codeInseeCommune(ligne.code_insee);
    if (!codePostal.communes.some((c) => c.code_insee === codeInsee)) continue;

    for (const nom of [ligne.nom_voie, ligne.nom_ld]) {
      const voie = normaliserVoie(nom);
      if (!voie) continue;
      const codesInsee = codePostal.voies.get(voie) ?? new Set<string>();
      codesInsee.add(codeInsee);
      codePostal.voies.set(voie, codesInsee);
    }
  }
}

async function ecrireCodesPostauxComplets(
  ambigus: Map<string, CodePostalEnCours>,
  departementsTraites: Set<string>,
  updatedAt: Date
): Promise<number> {
  const ops: AnyBulkWriteOperation<ICommunesVoies>[] = [];

  for (const [codePostal, enCours] of ambigus) {
    if (![...enCours.departements].every((d) => departementsTraites.has(d))) continue;

    ops.push({
      replaceOne: {
        filter: { _id: codePostal },
        replacement: {
          communes: enCours.communes,
          voies: [...enCours.voies].map(([nom, codesInsee]) => ({ nom, code_insee: [...codesInsee].sort() })),
          updated_at: updatedAt,
        },
        upsert: true,
      },
    });
    ambigus.delete(codePostal);
  }

  if (ops.length > 0) {
    await communesVoiesDb().bulkWrite(ops, { ordered: false });
  }
  return ops.length;
}

export async function hydrateCommunesVoies() {
  const updatedAt = new Date();
  const nbAvant = await communesVoiesDb().countDocuments();

  const communes = await fetchCommunes();
  const ambigus = indexerCodesPostauxAmbigus(communes);
  const departements = [...new Set(communes.map((c) => c.codeDepartement))].sort();
  logger.info({ codesPostaux: ambigus.size, departements: departements.length }, "import des voies BAN");

  const departementsTraites = new Set<string>();
  let nbEcrits = 0;

  for (const departement of departements) {
    await lireVoiesDepartement(departement, ambigus);
    departementsTraites.add(departement);
    nbEcrits += await ecrireCodesPostauxComplets(ambigus, departementsTraites, updatedAt);
    logger.info({ departement, nbEcrits }, "département traité");
  }

  if (nbEcrits < nbAvant * SEUIL_BAISSE_VOLUME) {
    throw new Error(
      `hydrate:communes-voies : ${nbEcrits} codes postaux écrits contre ${nbAvant} auparavant, anciennes entrées conservées`
    );
  }

  const { deletedCount } = await communesVoiesDb().deleteMany({ updated_at: { $lt: updatedAt } });
  logger.info({ nbEcrits, supprimes: deletedCount }, "référentiel communesVoies à jour");
  return nbEcrits;
}
