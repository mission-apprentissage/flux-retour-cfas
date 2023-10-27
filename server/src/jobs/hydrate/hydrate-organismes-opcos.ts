import { PromisePool } from "@supercharge/promise-pool";

import parentLogger from "@/common/logger";
import { formationsCatalogueDb, organismesDb } from "@/common/model/collections";
import { __dirname } from "@/common/utils/esmUtils";
import { readJsonFromCsvFile } from "@/common/utils/fileUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";

const PATH_TO_OPCO2I_CSV = "opcos/2i.csv";

const jobLogger = parentLogger.child({
  module: "job:hydrate:opcos",
});

/**
 * Remplit le champ organismes.opcos.
 * Pour l'instant, uniquement 2i.
 */
export const hydrateOrganismesOPCOs = async () => {
  const logger = jobLogger.child({ opco: "2i" });

  const organismes2i = await organismesDb()
    .find(
      { opcos: "2i" },
      {
        projection: {
          uai: 1,
          siret: 1,
          opcos: 1,
        },
      }
    )
    .toArray();
  logger.info({ count: organismes2i.length }, "organismes existants");

  const codes_rncp = (readJsonFromCsvFile(getStaticFilePath(PATH_TO_OPCO2I_CSV), ";") as { code_rncp: string }[]).map(
    (row) => row.code_rncp
  );
  logger.info({ count: codes_rncp.length }, "rncp chargés");

  const formationsRNCP = await formationsCatalogueDb()
    .find(
      {
        rncp_code: {
          $in: codes_rncp,
        },
      },
      {
        projection: {
          etablissement_gestionnaire_siret: 1,
          etablissement_gestionnaire_uai: 1,
          etablissement_formateur_siret: 1,
          etablissement_formateur_uai: 1,
        },
      }
    )
    .toArray();
  logger.info({ count: formationsRNCP.length }, "formations correspondantes"); // ~6k

  const organismesRNCPMap = formationsRNCP.reduce((acc, formation) => {
    acc.set(`${formation.etablissement_gestionnaire_siret}-${formation.etablissement_gestionnaire_uai ?? null}`, {
      siret: formation.etablissement_gestionnaire_siret,
      uai: formation.etablissement_gestionnaire_uai ?? null,
    });
    acc.set(`${formation.etablissement_formateur_siret}-${formation.etablissement_formateur_uai ?? null}`, {
      siret: formation.etablissement_formateur_siret,
      uai: formation.etablissement_formateur_uai ?? null,
    });
    return acc;
  }, new Map<string, { siret: string; uai: string | null }>());

  logger.info({ count: organismesRNCPMap.size }, "organismes correspondants"); // ~1.6k

  await PromisePool.for([...organismesRNCPMap.values()])
    .handleError((err) => {
      throw err;
    })
    .process(async (organisme) => {
      await organismesDb().updateOne(
        {
          siret: organisme.siret,
          uai: organisme.uai as any,
        },
        {
          $addToSet: {
            opcos: "2i",
          },
        }
      );
    });

  const ancienOrganismes2i = organismes2i.filter(
    (organisme) => !organismesRNCPMap.has(`${organisme.siret}-${organisme.uai ?? null}`)
  );
  logger.info({ count: ancienOrganismes2i.length }, "nettoyage anciens organismes");

  await PromisePool.for(ancienOrganismes2i)
    .handleError((err) => {
      throw err;
    })
    .process(async (organisme) => {
      await organismesDb().updateOne(
        {
          siret: organisme.siret,
          uai: organisme.uai as any,
        },
        {
          $pull: {
            opcos: "2i",
          },
        }
      );
    });
};
