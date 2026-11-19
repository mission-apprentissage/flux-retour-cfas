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

function aggregateSiretRncp(role: "responsable" | "formateur") {
  return formationV2Db().aggregate<{ _id: { siret: string; rncp: string } }>(
    [
      { $match: { [`identifiant.${role}_siret`]: { $ne: null }, "identifiant.rncp": { $ne: null } } },
      { $group: { _id: { siret: `$identifiant.${role}_siret`, rncp: "$identifiant.rncp" } } },
    ],
    { allowDiskUse: true }
  );
}

/**
 * Remplit le champ organismes.opcos.
 * Les agrégations sont globales : formationV2 n'est pas indexée par siret, une agrégation par organisme
 * reviendrait à un scan complet de la collection pour chacun d'eux.
 * Les organismes sans formation v2 ne sont pas modifiés.
 */
export const hydrateOrganismesOPCOs = async () => {
  const opcoParRncpCodeMap = getOpcoParRncpCodeMap();

  const opcosParSiret = new Map<string, Set<string>>();

  for (const role of ["responsable", "formateur"] as const) {
    for await (const {
      _id: { siret, rncp },
    } of aggregateSiretRncp(role)) {
      if (!opcosParSiret.has(siret)) {
        opcosParSiret.set(siret, new Set());
      }
      for (const opco of opcoParRncpCodeMap.get(rncp) ?? []) {
        opcosParSiret.get(siret)?.add(opco);
      }
    }
  }

  let ops: AnyBulkWriteOperation<IOrganisme>[] = [];

  for (const [siret, opcos] of opcosParSiret) {
    ops.push({
      updateMany: {
        filter: { siret },
        update: { $set: { opcos: Array.from(opcos) } },
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
