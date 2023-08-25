/*
  Ce script construit l'arborescence des domaines et sous-domaines d'activité à partir du excel officiel téléchargeable
  depuis la page https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html

  Étapes :
  - récupération du fichier https://www.pole-emploi.fr/files/live/sites/PE/files/ROME_ArboPrincipale.xlsx
  - transformation en un arbre d'objets
  - écriture dans un fichier arborescence-rome.json

  Puis prendre ce fichier et le mettre dans ui/public/arborescence-rome-14-06-2021.json
*/
import { writeFileSync } from "fs";

import axios from "axios";
import { read, utils } from "xlsx";

async function main() {
  const res = await axios.get("https://www.pole-emploi.fr/files/live/sites/PE/files/ROME_ArboPrincipale.xlsx", {
    responseType: "arraybuffer",
  });
  if (res.status !== 200) {
    throw new Error(`Invalid response status. Expected 200 but received ${res.status}`);
  }

  const workbook = read(res.data);
  const arboPrincipaleSheetName = workbook.SheetNames.find((name) => name.includes("Arbo Principale"));
  if (!arboPrincipaleSheetName) {
    throw new Error(`Onglet Arbo Principale non trouvée. Le fichier a sans doute changé de format.`);
  }
  console.log(`Données : ${arboPrincipaleSheetName}`);
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

  writeFileSync("arborescence-rome.json", Buffer.from(JSON.stringify(famillesMetiers), "utf8"));
  console.log("Fichier créé : arborescence-rome.json");
}

main();
