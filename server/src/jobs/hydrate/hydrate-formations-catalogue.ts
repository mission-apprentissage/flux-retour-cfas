import { IncomingMessage } from "node:http";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { setTimeout as sleep } from "node:timers/promises";

import axios from "axios";
import type { AnyBulkWriteOperation } from "mongodb";
import { IFormationCatalogue, zFormationCatalogue } from "shared/models/data/formationsCatalogue.model";
import { chain } from "stream-chain";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/stream-array.js";
import { z } from "zod";

import parentLogger from "@/common/logger";
import { formationsCatalogueDb } from "@/common/model/collections";
import { createErrorAggregator } from "@/common/utils/errorAggregator";
import config from "@/config";

const logger = parentLogger.child({
  module: "job:hydrate:formations-catalogue",
});

const INSERT_BATCH_SIZE = 1_000;
const MARGE_LIMITE = 1_000;
const ECART_TOLERE = 0.005;
const PAUSES_ENTRE_TENTATIVES_MS = [30_000, 120_000];
const DELAI_INACTIVITE_MS = 10_000;

const champsDuSchema = (schema: z.AnyZodObject, prefixe = ""): string[] =>
  Object.entries(schema.shape).flatMap(([champ, type]) => {
    let base = type as z.ZodTypeAny;
    while (base instanceof z.ZodOptional || base instanceof z.ZodNullable) {
      base = base.unwrap();
    }
    return base instanceof z.ZodObject ? champsDuSchema(base, `${prefixe}${champ}.`) : [`${prefixe}${champ}`];
  });

const CHAMPS_DU_SCHEMA = JSON.stringify(
  Object.fromEntries(champsDuSchema(zFormationCatalogue).map((champ) => [champ, 1]))
);

type IResultatImport = {
  recues: number;
  importees: number;
  rejetees: number;
  cles: Set<string>;
};

export type IOptionsImportCatalogue = {
  pausesEntreTentativesMs?: number[];
  delaiInactiviteMs?: number;
};

const urlCatalogue = (chemin: string) => `${config.mnaCatalogApi.endpoint}/v1/entity/${chemin}`;

const compterFormationsCatalogue = async (delaiInactiviteMs: number): Promise<number> => {
  const { data } = await axios.get<unknown>(urlCatalogue("formations/count"), {
    params: { query: "{}" },
    timeout: delaiInactiviteMs,
  });
  if (typeof data !== "number" || !Number.isInteger(data) || data <= 0) {
    throw new Error(`Nombre de formations du catalogue invalide : ${JSON.stringify(data)}`);
  }
  return data;
};

const importerFormations = async (limit: number, delaiInactiviteMs: number): Promise<IResultatImport> => {
  const res = await axios.get<IncomingMessage>(urlCatalogue("formations.json"), {
    responseType: "stream",
    timeout: delaiInactiviteMs,
    params: { limit, select: CHAMPS_DU_SCHEMA },
  });

  const errors = createErrorAggregator("hydrate-formations-catalogue");
  const resultat: IResultatImport = { recues: 0, importees: 0, rejetees: 0, cles: new Set() };
  let lot: IFormationCatalogue[] = [];

  const ecrireLot = async () => {
    if (lot.length === 0) {
      return;
    }
    const ops = lot.map(
      ({ _id, ...formation }): AnyBulkWriteOperation<IFormationCatalogue> => ({
        updateOne: {
          filter: { cle_ministere_educatif: formation.cle_ministere_educatif },
          update: { $set: formation, $setOnInsert: { _id } },
          upsert: true,
        },
      })
    );
    lot = [];
    try {
      await formationsCatalogueDb().bulkWrite(ops, { ordered: false });
      resultat.importees += ops.length;
    } catch (err) {
      logger.error({ err }, "insertion formation échouée");
      errors.record(err);
    }
  };

  const ecriture = new Writable({
    objectMode: true,
    write({ value }: { value: unknown }, _encoding, callback) {
      resultat.recues++;
      const cle = (value as { cle_ministere_educatif?: unknown } | null)?.cle_ministere_educatif;
      if (typeof cle === "string") {
        resultat.cles.add(cle);
      }

      const formation = zFormationCatalogue.safeParse(value);
      if (!formation.success) {
        resultat.rejetees++;
        errors.record(formation.error);
        callback();
        return;
      }

      lot.push(formation.data);
      if (lot.length < INSERT_BATCH_SIZE) {
        callback();
        return;
      }
      ecrireLot().then(() => callback(), callback);
    },
    final(callback) {
      ecrireLot().then(() => callback(), callback);
    },
  });

  await pipeline(res.data, chain([parser(), streamArray()]), ecriture);

  errors.ok(resultat.importees);
  errors.flush();
  return resultat;
};

const verifierTotal = (total: number, limit: number, recues: number) => {
  if (recues >= limit) {
    throw new Error(`Export du catalogue tronqué : ${recues} formations reçues pour une limite de ${limit}`);
  }
  if ((total - recues) / total > ECART_TOLERE) {
    throw new Error(`Export du catalogue incomplet : ${recues} formations reçues sur ${total}`);
  }
  if (recues !== total) {
    logger.warn({ total, recues }, "écart entre le comptage et l'export du catalogue");
  }
};

const depublierFormationsAbsentes = async (clesRecues: Set<string>): Promise<number> => {
  const absentes: string[] = [];
  const publiees = formationsCatalogueDb().find(
    { published: true },
    { projection: { _id: 0, cle_ministere_educatif: 1 } }
  );
  for await (const { cle_ministere_educatif } of publiees) {
    if (!clesRecues.has(cle_ministere_educatif)) {
      absentes.push(cle_ministere_educatif);
    }
  }

  let depubliees = 0;
  for (let i = 0; i < absentes.length; i += INSERT_BATCH_SIZE) {
    const { modifiedCount } = await formationsCatalogueDb().updateMany(
      { cle_ministere_educatif: { $in: absentes.slice(i, i + INSERT_BATCH_SIZE) } },
      { $set: { published: false } }
    );
    depubliees += modifiedCount;
  }
  return depubliees;
};

/**
 * Ce job récupère toutes les formations du catalogue et les insert en brut dans la collection formationsCatalogue
 * en vue d'une future utilisation.
 */
export const hydrateFormationsCatalogue = async ({
  pausesEntreTentativesMs = PAUSES_ENTRE_TENTATIVES_MS,
  delaiInactiviteMs = DELAI_INACTIVITE_MS,
}: IOptionsImportCatalogue = {}) => {
  logger.info("récupération des formations depuis le catalogue");
  const total = await compterFormationsCatalogue(delaiInactiviteMs);
  const limit = total + MARGE_LIMITE;

  let resultat: IResultatImport | null = null;
  let derniereErreur: unknown = null;
  for (let tentative = 0; tentative <= pausesEntreTentativesMs.length && !resultat; tentative++) {
    if (tentative > 0) {
      logger.warn(
        { err: derniereErreur, tentative: tentative + 1 },
        "flux du catalogue interrompu, nouvelle tentative"
      );
      await sleep(pausesEntreTentativesMs[tentative - 1]);
    }
    try {
      resultat = await importerFormations(limit, delaiInactiviteMs);
    } catch (err) {
      derniereErreur = err;
    }
  }
  if (!resultat) {
    throw new Error(`Import du catalogue interrompu après ${pausesEntreTentativesMs.length + 1} tentatives`, {
      cause: derniereErreur,
    });
  }

  verifierTotal(total, limit, resultat.recues);
  const depubliees = await depublierFormationsAbsentes(resultat.cles);

  const bilan = {
    total,
    recues: resultat.recues,
    importees: resultat.importees,
    rejetees: resultat.rejetees,
    depubliees,
  };
  logger.info(bilan, "import du catalogue terminé");
  return bilan;
};
