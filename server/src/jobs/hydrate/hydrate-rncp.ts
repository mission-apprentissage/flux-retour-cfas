import { createReadStream } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PromisePool } from "@supercharge/promise-pool";
import AdmZip from "adm-zip";
import axios from "axios";
import { WithoutId } from "mongodb";
import { IRncp } from "shared/models/data/rncp.model";
import XmlStream from "xml-stream";

import parentLogger from "@/common/logger";
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
  - récupération des OPCOs pour chaque RNCP depuis les CSV OPCOs
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

  // Extract XML to a temporary file instead of loading into memory
  const tempXmlFilePath = join(tmpdir(), "fiches-rncp.xml");
  await writeFile(tempXmlFilePath, entry.getData());
  await unlink(tempZipFilePath);

  logger.info("Streaming et parsing du XML");

  // Process XML in streaming mode to avoid loading entire file in memory
  let processedCount = 0;
  const batchSize = 100;
  let batch: WithoutId<IRncp>[] = [];

  const processBatch = async (currentBatch: WithoutId<IRncp>[]) => {
    if (currentBatch.length === 0) return;

    await PromisePool.for(currentBatch)
      .withConcurrency(50)
      .handleError(async (error) => {
        throw error;
      })
      .process(async ({ rncp, ...fiche }) => {
        await rncpDb().updateOne({ rncp }, { $set: stripEmptyFields({ ...fiche }) }, { upsert: true });
      });

    processedCount += currentBatch.length;
    if (processedCount % 1000 === 0) {
      logger.info({ count: processedCount }, "fiches traitées");
    }
  };

  // Create XML stream parser
  const stream = createReadStream(tempXmlFilePath);
  const xml = new XmlStream(stream);

  // Collect elements as arrays to handle single vs multiple items
  xml.collect("ROME");
  xml.preserve("NOUVELLE_CERTIFICATION", true);

  // Process each FICHE element
  xml.on("endElement: FICHE", async (fiche: any) => {
    try {
      const rncpDoc: WithoutId<IRncp> = {
        rncp: fiche.NUMERO_FICHE,
        nouveaux_rncp: fiche?.NOUVELLE_CERTIFICATION?.$children,
        niveau: fiche.NOMENCLATURE_EUROPE?.NIVEAU
          ? parseInt((fiche.NOMENCLATURE_EUROPE.NIVEAU as string).substring(3))
          : undefined,
        intitule: fiche.INTITULE,
        etat_fiche: fiche.ETAT_FICHE,
        actif: fiche.ACTIF === "Oui",
        romes: fiche.CODES_ROME?.ROME?.map((rome: any) => rome.CODE) ?? [],
      };
      batch.push(rncpDoc);

      // Process batch when it reaches the batch size
      if (batch.length >= batchSize) {
        xml.pause(); // Pause the stream while processing
        const currentBatch = [...batch];
        batch = [];
        await processBatch(currentBatch);
        xml.resume(); // Resume the stream
      }
    } catch (error) {
      logger.error({ error }, "Erreur lors du traitement d'une fiche");
      throw error;
    }
  });

  // Handle end of stream
  await new Promise<void>((resolve, reject) => {
    xml.on("end", async () => {
      try {
        // Process remaining items in batch
        await processBatch(batch);
        logger.info({ count: processedCount }, "import des fiches rncp terminé");
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    xml.on("error", (error: Error) => {
      logger.error({ error }, "Erreur lors du parsing XML");
      reject(error);
    });
  });

  // Clean up temp XML file
  await unlink(tempXmlFilePath).catch(() => {});
}
