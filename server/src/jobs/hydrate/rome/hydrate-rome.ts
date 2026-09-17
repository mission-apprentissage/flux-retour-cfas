import fs from "fs";
import path from "path";

import { ObjectId } from "bson";

import { romeSecteurActivitesDb } from "@/common/model/collections";

interface RomeMetier {
  code_rome: string;
  code_ogr_rome: number;
  libelle_rome: string;
}

interface RomeSecteur {
  code_secteur: number;
  libelle: string;
  liste_sous_secteur: Array<{ liste_metier: RomeMetier[] }>;
  liste_metier: RomeMetier[];
}

export const hydrateRomeSecteurActivites = async () => {
  const secteurJson = fs.readFileSync(path.resolve("static/unix_arborescence_secteur_activite_v460.json"), "utf-8");
  const secteurData = JSON.parse(secteurJson);

  const { arbo_secteur } = secteurData as { arbo_secteur: RomeSecteur[] };

  for (const { code_secteur, libelle, liste_sous_secteur, liste_metier } of arbo_secteur) {
    const romes = liste_sous_secteur.reduce<RomeMetier[]>(
      (acc, data) => {
        return [...acc, ...data.liste_metier];
      },
      [
        ...liste_metier.map(({ code_rome, code_ogr_rome, libelle_rome }) => ({
          code_rome,
          code_ogr_rome,
          libelle_rome,
        })),
      ]
    );

    await romeSecteurActivitesDb().insertOne({
      _id: new ObjectId(),
      code_secteur,
      libelle_secteur: libelle,
      romes,
    });
  }
};
