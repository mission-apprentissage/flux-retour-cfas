import { PromisePool } from "@supercharge/promise-pool";
import axios from "axios";
import { IRome } from "shared/models/data/rome.model";
import { read, utils } from "xlsx";

import parentLogger from "@/common/logger";
import { romeDb } from "@/common/model/collections";

const logger = parentLogger.child({
  module: "job:hydrate:rome",
});

/*
  Ce job construit l'arborescence des domaines et sous-domaines d'activité à partir du excel officiel téléchargeable
  depuis la page https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html

  Étapes :
  - récupération du fichier https://www.pole-emploi.fr/files/live/sites/PE/files/ROME_ArboPrincipale.xlsx
  - transformation pour récupérer chaque fiche métier avec les labels des catégories parentes
  - écriture dans la collection rome

  Note : ce fichier est l'équivalent du fichier `server/scripts/extract-arborescence-rome.ts` utilisé pour généré le fichier static frontend.
*/
export async function hydrateROME() {
  logger.info("récupération du fichier ROME_ArboPrincipale.xlsx");
  const res = await axios.get("https://www.pole-emploi.fr/files/live/sites/PE/files/ROME_ArboPrincipale.xlsx", {
    responseType: "arraybuffer",
  });
  if (res.status !== 200) {
    throw new Error(`Invalid response status. Expected 200 but received ${res.status}`);
  }

  logger.info("parsing du fichier");
  const workbook = read(res.data);
  const arboPrincipaleSheetName = workbook.SheetNames.find((name) => name.includes("Arbo Principale"));
  if (!arboPrincipaleSheetName) {
    throw new Error(`Onglet Arbo Principale non trouvée. Le fichier a sans doute changé de format.`);
  }
  const arboPrincipaleSheet = workbook.Sheets[arboPrincipaleSheetName];

  const rawJsonData = utils
    .sheet_to_json<Record<"familleMetier" | "domaineProfessionnel" | "numeroOrdre" | "name" | "codeOGR", any>>(
      arboPrincipaleSheet,
      {
        // exemple : A	11	01	Chauffeur / Chauffeuse de machines agricoles 11987
        header: ["familleMetier", "domaineProfessionnel", "numeroOrdre", "name", "codeOGR"],
      }
    )
    .slice(1); // removes the header

  logger.info("transformation des données");

  const arborescenceRome = rawJsonData.reduce((acc, row) => {
    // conditions ordonnées de la plus restrictive à la moins restrictive
    if (row.codeOGR !== " ") {
      // pas besoin des appellations de métiers
      // acc[row.familleMetier].children[row.domaineProfessionnel].children[row.numeroOrdre].children[row.codeOGR] = {
      //   id: `${row.familleMetier}${row.domaineProfessionnel}${row.numeroOrdre}-${row.codeOGR}`,
      //   codeOGR: row.codeOGR,
      //   name: row.name,
      // };
    } else if (row.numeroOrdre !== " ") {
      acc[row.familleMetier].children[row.domaineProfessionnel].children[row.numeroOrdre] = {
        id: `${row.familleMetier}${row.domaineProfessionnel}${row.numeroOrdre}`,
        name: row.name,
        // children: {},
      };
    } else if (row.domaineProfessionnel !== " ") {
      acc[row.familleMetier].children[row.domaineProfessionnel] = {
        id: `${row.familleMetier}${row.domaineProfessionnel}`,
        name: row.name,
        children: {},
      };
    } else {
      acc[row.familleMetier] = {
        id: row.familleMetier,
        name: row.name,
        children: {},
      };
    }
    return acc;
  }, {});

  // tri et transformation en tableau
  const famillesMetiers = Object.keys(arborescenceRome)
    .sort()
    .map((key) => {
      const famille = arborescenceRome[key];
      return {
        ...famille,
        children: Object.keys(famille.children)
          .sort()
          .map((key) => {
            const domaine = famille.children[key];
            return {
              ...domaine,
              children: Object.keys(domaine.children)
                .sort()
                .map((key) => domaine.children[key]),
            };
          }),
      };
    });

  const fichesROME: IRome[] = famillesMetiers
    .flatMap((famille) => {
      return famille.children.map((domaine) => {
        return domaine.children.map(
          (fiche) =>
            ({
              code: fiche.id,
              label_fiche: fiche.name,
              label_domaine: domaine.name,
              label_famille: famille.name,
            }) satisfies IRome
        );
      });
    })
    .flat();

  logger.info({ count: fichesROME.length }, "import des fiches rome");

  await PromisePool.for(fichesROME)
    .withConcurrency(50)
    .handleError(async (error) => {
      logger.error({ error: error }, "item error");
      throw error;
    })
    .process(async ({ code, ...fiche }) => {
      await romeDb().updateOne(
        {
          code,
        },
        {
          $set: fiche,
        },
        {
          upsert: true,
        }
      );
    });
}
