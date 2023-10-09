import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PromisePool } from "@supercharge/promise-pool";
import AdmZip from "adm-zip";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

import parentLogger from "@/common/logger";
import { Rncp } from "@/common/model/@types/Rncp";
import { rncpDb } from "@/common/model/collections";
import { stripEmptyFields } from "@/common/utils/miscUtils";

const logger = parentLogger.child({
  module: "job:hydrate:rncp",
});

/*
  Ce job récupère un export du RNCP pour le mettre dans la collection rncp.
  Contient pour l'instant uniquement les associations RNCP -> codes ROME.
  L'origine des données est "export fiches rncp v3" téléchargées depuis la page https://www.data.gouv.fr/fr/datasets/repertoire-national-des-certifications-professionnelles-et-repertoire-specifique/

  Étapes :
  - récupération du fichier zip export-fiches-rncp-v3 du jour : "https://static.data.gouv.fr/resources/repertoire-national-des-certifications-professionnelles-et-repertoire-specifique/20230830-020022/export-fiches-rncp-v3-0-2023-08-30.zip"
  - décompression zip
  - parsing du xml
  - récupération de la correspondance RNCP -> codes ROME + autres attributs
  - écriture dans la collection rncp
*/
export async function hydrateRNCP() {
  let res = await axios.get(
    `https://www.data.gouv.fr/api/2/datasets/5eebbc067a14b6fecc9c9976/resources/?page=1&type=update&page_size=10&q=`
  );
  if (res.status !== 200) {
    throw new Error(`Invalid response status. Expected 200 but received ${res.status}`);
  }
  const resourceRncpV3 = res.data.data.find((resource) => resource.title.includes("export-fiches-rncp-v3"));
  if (!resourceRncpV3) {
    throw new Error(`Ressource non trouvée dans la liste`);
  }
  logger.info(`téléchargement de : ${resourceRncpV3.url}`);

  res = await axios.get(resourceRncpV3.url, {
    responseType: "arraybuffer",
  });
  if (res.status !== 200) {
    throw new Error(`Invalid response status. Expected 200 but received ${res.status}`);
  }

  const tempZipFilePath = join(tmpdir(), "fiches-rncp.zip");
  await writeFile(tempZipFilePath, res.data);

  const zip = new AdmZip(tempZipFilePath);
  const zipEntries = zip.getEntries();

  // l'archive contient seulement un fichier : export_fiches_RNCP_V3_0_2023-08-30.xml
  const entry = zipEntries.find((entry) => entry.name.includes(".xml"));
  if (!entry) {
    throw new Error("Fichier non trouvé. Le format a dû changer");
  }
  const zipData = entry.getData();
  unlink(tempZipFilePath);

  const parser = new XMLParser({
    isArray(tagName, jPath) {
      // force un tableau plutôt qu'un objet si jamais un seul élément
      return ["FICHES.FICHE.CODES_ROME.ROME", "FICHES.FICHE.NOUVELLE_CERTIFICATION"].includes(jPath);
    },
  });
  logger.info("parsing du xml");
  const parsedContent = parser.parse(zipData);

  const fichesRNCP: Rncp[] = parsedContent.FICHES.FICHE.map((fiche) => {
    return {
      rncp: fiche.NUMERO_FICHE,
      nouveaux_rncp: fiche.NOUVELLE_CERTIFICATION,
      niveau: fiche.NOMENCLATURE_EUROPE.NIVEAU
        ? parseInt((fiche.NOMENCLATURE_EUROPE.NIVEAU as string).substring(3))
        : undefined,
      intitule: fiche.INTITULE,
      etat_fiche: fiche.ETAT_FICHE,
      actif: fiche.ACTIF === "Oui",
      // certains RNCP n'ont pas de ROME => undefined
      romes: fiche.CODES_ROME?.ROME?.map((rome) => rome.CODE) ?? [],
    } as Rncp;
  });

  logger.info({ count: fichesRNCP.length }, "import des fiches rncp");

  await PromisePool.for(fichesRNCP)
    .withConcurrency(50)
    .handleError(async (error) => {
      throw error;
    })
    .process(async ({ rncp, ...fiche }) => {
      await rncpDb().updateOne(
        {
          rncp,
        },
        {
          $set: stripEmptyFields(fiche),
        },
        {
          upsert: true,
        }
      );
    });
}
