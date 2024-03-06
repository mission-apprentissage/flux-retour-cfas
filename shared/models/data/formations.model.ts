import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";

import { CFD_REGEX } from "../../constants";

const collectionName = "formations";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ libelle: "text" }, { default_language: "french", name: "libelle_text" }],
  [{ libelle: 1 }, { name: "libelle" }], // this index is also needed to search using regex
  [{ cfd: 1 }, { name: "cfd", unique: true }],
  [{ rncps: 1 }, { name: "rncps" }],
];

const zFormation = z.object({
  _id: z.any(),
  cfd: z.string({ description: "Code CFD de la formation" }).regex(CFD_REGEX),
  cfd_start_date: z.date({ description: "Date d'ouverture du CFD" }).nullish(),
  cfd_end_date: z.date({ description: "Date de fermeture du CFD" }).nullish(),
  libelle: z.string({ description: "Libellé normalisé depuis Tables de Correspondances" }).nullish(),
  rncps: z
    .array(z.string(), {
      description: "Liste des codes RNCPs de la formation récupéré depuis Tables de Correspondances",
    })
    .nullish(),
  niveau: z.string({ description: "Niveau de formation récupéré via Tables de Correspondances" }).nullish(),
  niveau_libelle: z
    .string({
      description: "Libellé du niveau de formation récupéré via Tables de Correspondances",
    })
    .nullish(),
  metiers: z.array(z.string(), { description: "Les domaines métiers rattachés à la formation" }).nullish(),
  duree: z.string({ description: "Durée de la formation théorique" }).nullish(),
  annee: z.string({ description: "Année de la formation (cursus)" }).nullish(),

  updated_at: z.date({ description: "Date d'update en base de données" }).nullish(),
  created_at: z.date({ description: "Date d'ajout en base de données" }).nullish(),
});

export type IFormation = z.output<typeof zFormation>;

export default { zod: zFormation, indexes, collectionName };
