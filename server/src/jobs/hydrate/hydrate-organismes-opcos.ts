import { AnyBulkWriteOperation } from "mongodb";
import { IOrganisme } from "shared/models";

import { formationV2Db, organismesDb } from "@/common/model/collections";
import { __dirname } from "@/common/utils/esmUtils";
import { readJsonFromCsvFile } from "@/common/utils/fileUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";

// le nom doit correspondre à la clé de l'opco et au nom du fichier CSV
// dans le dossier server/static/opcos
const OPCOS = ["2i", "ep", "akto", "atlas", "mobilite", "uniformation", "ocapiat", "afdas"];

function getOpcoParRncpCodeMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const opco of OPCOS) {
    const codes_rncp = (
      readJsonFromCsvFile(getStaticFilePath(`opcos/${opco}.csv`), ";") as { code_rncp: string }[]
    ).map((row) => row.code_rncp);

    for (const code_rncp of codes_rncp) {
      if (!map.has(code_rncp)) {
        map.set(code_rncp, []);
      }
      map.get(code_rncp)?.push(opco);
    }
  }

  return map;
}

/**
 * Remplit le champ organismes.opcos.
 * Pour l'instant, uniquement 2i, ep, akto et atlas.
 */
export const hydrateOrganismesOPCOs = async () => {
  const opcoParRncpCodeMap = getOpcoParRncpCodeMap();

  const cursor = organismesDb().find();

  let ops: AnyBulkWriteOperation<IOrganisme>[] = [];

  for await (const organisme of cursor) {
    const [rncpAsResponsable, rncpAsFormateur] = await Promise.all([
      formationV2Db()
        .aggregate<{
          _id: { siret: string; rncp: string };
        }>([
          {
            $match: {
              "identifiant.responsable_siret": organisme.siret,
              "identifiant.rncp": { $ne: null },
            },
          },
          {
            $group: {
              _id: {
                rncp: "$identifiant.rncp",
              },
            },
          },
        ])
        .toArray(),
      formationV2Db()
        .aggregate<{
          _id: { siret: string; rncp: string };
        }>([
          {
            $match: {
              "identifiant.formateur_siret": organisme.siret,
              "identifiant.rncp": { $ne: null },
            },
          },
          {
            $group: {
              _id: {
                rncp: "$identifiant.rncp",
              },
            },
          },
        ])
        .toArray(),
    ]);

    const organismeRncps: Set<string> = new Set([
      ...rncpAsResponsable.map(({ _id: { rncp } }) => rncp),
      ...rncpAsFormateur.map(({ _id: { rncp } }) => rncp),
    ]);
    const organismeOpcos: Set<string> = new Set();

    for (const rncp of organismeRncps) {
      const opcos = opcoParRncpCodeMap.get(rncp) ?? [];
      for (const opco of opcos) {
        organismeOpcos.add(opco);
      }
    }

    ops.push({
      updateOne: {
        filter: { _id: organisme._id },
        update: { $set: { opcos: Array.from(organismeOpcos) } },
      },
    });

    if (ops.length >= 1000) {
      await organismesDb().bulkWrite(ops);
      ops = [];
    }
  }

  if (ops.length > 0) {
    await organismesDb().bulkWrite(ops);
  }
};
