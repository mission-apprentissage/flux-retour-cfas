import { createReadStream } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PromisePool } from "@supercharge/promise-pool";
import AdmZip from "adm-zip";
import axios from "axios";
import { WithoutId } from "mongodb";
import sax from "sax";
import { IRncp } from "shared/models/data/rncp.model";

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

  // Create SAX parser
  const saxStream = sax.createStream(true, {});
  const stream = createReadStream(tempXmlFilePath);

  // State for tracking current element
  let currentFiche: any = null;
  let currentPath: string[] = [];
  let currentText = "";
  let romeList: any[] = [];

  saxStream.on("opentag", (node) => {
    currentPath.push(node.name);
    currentText = "";

    if (node.name === "FICHE") {
      currentFiche = {};
      romeList = [];
    } else if (node.name === "ROME") {
      romeList.push({});
    }
  });

  saxStream.on("text", (text) => {
    currentText += text;
  });

  saxStream.on("closetag", (tagName) => {
    const path = currentPath.join(".");

    if (currentFiche) {
      // Capture text content for specific fields
      if (tagName === "NUMERO_FICHE") {
        currentFiche.NUMERO_FICHE = currentText.trim();
      } else if (tagName === "NOUVELLE_CERTIFICATION") {
        if (!currentFiche.NOUVELLE_CERTIFICATION) {
          currentFiche.NOUVELLE_CERTIFICATION = [];
        }
        const value = currentText.trim();
        if (value) {
          currentFiche.NOUVELLE_CERTIFICATION.push(value);
        }
      } else if (tagName === "NIVEAU" && path.includes("NOMENCLATURE_EUROPE")) {
        currentFiche.NIVEAU = currentText.trim();
      } else if (tagName === "INTITULE") {
        currentFiche.INTITULE = currentText.trim();
      } else if (tagName === "ETAT_FICHE") {
        currentFiche.ETAT_FICHE = currentText.trim();
      } else if (tagName === "ACTIF") {
        currentFiche.ACTIF = currentText.trim();
      } else if (tagName === "CODE" && path.includes("CODES_ROME.ROME")) {
        if (romeList.length > 0) {
          romeList[romeList.length - 1].CODE = currentText.trim();
        }
      }
    }

    // When FICHE closes, process it
    if (tagName === "FICHE" && currentFiche) {
      const rncpDoc: WithoutId<IRncp> = {
        rncp: currentFiche.NUMERO_FICHE,
        nouveaux_rncp: currentFiche.NOUVELLE_CERTIFICATION ?? [],
        niveau: currentFiche.NIVEAU ? parseInt(currentFiche.NIVEAU.substring(3)) : undefined,
        intitule: currentFiche.INTITULE,
        etat_fiche: currentFiche.ETAT_FICHE,
        actif: currentFiche.ACTIF === "Oui",
        romes: romeList.map((rome) => rome.CODE).filter(Boolean),
      };

      batch.push(rncpDoc);
      currentFiche = null;
    }

    currentPath.pop();
    currentText = "";
  });

  // Handle batching with backpressure
  let isPaused = false;
  saxStream.on("closetag", async (tagName) => {
    if (tagName === "FICHE" && batch.length >= batchSize && !isPaused) {
      isPaused = true;
      stream.pause();
      const currentBatch = [...batch];
      batch = [];
      await processBatch(currentBatch);
      stream.resume();
      isPaused = false;
    }
  });

  // Handle end of stream and errors
  await new Promise<void>((resolve, reject) => {
    saxStream.on("end", async () => {
      try {
        await processBatch(batch);
        logger.info({ count: processedCount }, "import des fiches rncp terminé");
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    saxStream.on("error", (error: Error) => {
      logger.error({ error }, "Erreur lors du parsing XML");
      reject(error);
    });

    stream.on("error", (error: Error) => {
      logger.error({ error }, "Erreur lors de la lecture du fichier");
      reject(error);
    });

    stream.pipe(saxStream);
  });

  // Clean up temp XML file
  await unlink(tempXmlFilePath).catch(() => {});
}
