/*
  Depuis les données export fiches rncp v3 téléchargées depuis la page https://www.data.gouv.fr/fr/datasets/repertoire-national-des-certifications-professionnelles-et-repertoire-specifique/

  Étapes :
  - récupération du fichier zip export-fiches-rncp-v3 du jour : "https://static.data.gouv.fr/resources/repertoire-national-des-certifications-professionnelles-et-repertoire-specifique/20230830-020022/export-fiches-rncp-v3-0-2023-08-30.zip"
  - décompression zip
  - parsing du xml
  - écriture d'un fichier JSON avec uniquement correspondance RNC -> codes ROME
*/
import { unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import AdmZip from "adm-zip";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

async function main() {
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
  console.log(`Téléchargement de : ${resourceRncpV3.url}`);

  res = await axios.get(resourceRncpV3.url, {
    responseType: "arraybuffer",
  });
  if (res.status !== 200) {
    throw new Error(`Invalid response status. Expected 200 but received ${res.status}`);
  }

  const tempZipFilePath = join(tmpdir(), "fiches-rncp.zip");
  writeFileSync(tempZipFilePath, res.data);

  const zip = new AdmZip(tempZipFilePath);
  const zipEntries = zip.getEntries();

  // contient seulement un fichier : export_fiches_RNCP_V3_0_2023-08-30.xml
  const entry = zipEntries.find((entry) => entry.name.includes(".xml"));
  if (!entry) {
    throw new Error("Fichier non trouvé. Le format a dû changer");
  }
  const zipData = entry.getData();

  unlinkSync(tempZipFilePath);

  // 3. parsing XML
  const parser = new XMLParser({
    isArray(tagName, jPath) {
      // force un tableau plutôt qu'un objet si jamais un seul élément
      return jPath === "FICHES.FICHE.CODES_ROME.ROME";
    },
  });
  const parsedContent = parser.parse(zipData);

  const rncpWithRomes = parsedContent.FICHES.FICHE.map((fiche) => {
    return {
      rncp: fiche.NUMERO_FICHE,
      // certains RNCP n'ont pas de ROME => undefined
      romes: fiche.CODES_ROME?.ROME?.map((rome) => rome.CODE) ?? [],
    };
  });
  console.log(`${rncpWithRomes.length} RNCP trouvés`);

  writeFileSync("rncp-romes.json", Buffer.from(JSON.stringify(rncpWithRomes), "utf8"));
  console.log("Fichier créé : rncp-romes.json");
}

main();
