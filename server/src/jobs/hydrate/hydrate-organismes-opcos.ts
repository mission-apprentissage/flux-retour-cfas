import { PromisePool } from "@supercharge/promise-pool";

import { updateEffectifComputedFromOrganisme } from "@/common/actions/effectifs.actions";
import parentLogger from "@/common/logger";
import { formationsCatalogueDb, organismesDb } from "@/common/model/collections";
import { __dirname } from "@/common/utils/esmUtils";
import { readJsonFromCsvFile } from "@/common/utils/fileUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";

// le nom doit correspondre à la clé de l'opco et au nom du fichier CSV
// dans le dossier server/static/opcos
export const OPCOS = ["2i", "ep", "akto", "atlas", "mobilite"];

const jobLogger = parentLogger.child({
  module: "job:hydrate:opcos",
});

/**
 * Remplit le champ organismes.opcos.
 * Pour l'instant, uniquement 2i, ep, akto et atlas.
 */
export const hydrateOrganismesOPCOs = async () => {
  for (const opco of OPCOS) {
    const logger = jobLogger.child({ opco });

    const organismes = await organismesDb()
      .find(
        { opcos: opco },
        {
          projection: {
            uai: 1,
            siret: 1,
            opcos: 1,
          },
        }
      )
      .toArray();
    logger.info({ count: organismes.length }, "organismes existants");

    const codes_rncp = (
      readJsonFromCsvFile(getStaticFilePath(`opcos/${opco}.csv`), ";") as { code_rncp: string }[]
    ).map((row) => row.code_rncp);
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
        const { upsertedId } = await organismesDb().updateOne(
          {
            siret: organisme.siret,
            uai: organisme.uai as any,
          },
          {
            $addToSet: {
              opcos: opco,
            },
          }
        );
        if (upsertedId) {
          const organisme = await organismesDb().findOne({ _id: upsertedId });
          organisme && (await updateEffectifComputedFromOrganisme(organisme));
        }
      });

    const ancienOrganismes = organismes.filter(
      (organisme) => !organismesRNCPMap.has(`${organisme.siret}-${organisme.uai ?? null}`)
    );
    logger.info({ count: ancienOrganismes.length }, "nettoyage anciens organismes");

    await PromisePool.for(ancienOrganismes)
      .handleError((err) => {
        throw err;
      })
      .process(async (organisme) => {
        const { upsertedId } = await organismesDb().updateOne(
          {
            siret: organisme.siret,
            uai: organisme.uai as any,
          },
          {
            $pull: {
              opcos: opco,
            },
          }
        );

        if (upsertedId) {
          const organisme = await organismesDb().findOne({ _id: upsertedId });
          organisme && (await updateEffectifComputedFromOrganisme(organisme));
        }
      });
  }
};
