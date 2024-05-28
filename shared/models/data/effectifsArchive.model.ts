import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { MOTIF_SUPPRESSION } from "../../constants";

import { zEffectif } from "./effectifs.model";

const collectionName = "effectifsArchive";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [
    {
      organisme_id: 1,
      annee_scolaire: 1,
      id_erp_apprenant: 1,
      "apprenant.nom": 1,
      "apprenant.prenom": 1,
      "formation.cfd": 1,
      "formation.annee": 1,
    },
    { unique: true },
  ],
  [
    {
      "apprenant.nom": "text",
      "apprenant.prenom": "text",
      annee_scolaire: "text",
      id_erp_apprenant: "text",
    },
    {
      name: "nom_prenom_annsco_iderp_text",
      default_language: "french",
      collation: {
        locale: "simple", // simple binary comparison
        strength: 1, // case and accent insensitive
      },
    },
  ],
  [{ organisme_id: 1, created_at: 1 }, {}],
  [{ annee_scolaire: 1 }, { name: "annee_scolaire" }],
  [{ id_erp_apprenant: 1 }, { name: "id_erp_apprenant" }],
  [{ date_de_naissance: 1 }, { name: "date_de_naissance" }],
  [{ "formation.cfd": 1 }, { name: "formation.cfd" }],
  [
    { "apprenant.nom": 1 },
    {
      name: "nom",
      collation: {
        locale: "fr",
        strength: 1, // case and accent insensitive
      },
    },
  ],
  [
    { "apprenant.prenom": 1 },
    {
      name: "prenom",
      collation: {
        locale: "fr",
        strength: 1, // case and accent insensitive
      },
    },
  ],
  [{ source: 1 }, { name: "source" }],
  [{ source_organisme_id: 1 }, { name: "source_organisme_id" }],
  [{ created_at: 1 }, { name: "created_at" }],
  [{ "_computed.organisme.region": 1 }, {}],
  [{ "_computed.organisme.departement": 1 }, {}],
  [{ "_computed.organisme.academie": 1 }, {}],
  [{ "_computed.organisme.bassinEmploi": 1 }, {}],
  [{ "_computed.organisme.reseaux": 1 }, {}],
  [{ "_computed.organisme.uai": 1 }, {}],
  [{ "_computed.organisme.siret": 1 }, {}],
  [{ "_computed.organisme.fiable": 1, annee_scolaire: 1 }, {}],
  [{ "_computed.formation.codes_rome": 1 }, {}],
  [{ "_computed.formation.opcos": 1 }, {}],
];

export const zEffectifArchive = zEffectif.extend({
  suppression: z.object({
    user_id: zObjectId.describe("Identifiant MongoDB de l'utilisateur responsable de la suppression").nullish(),
    motif: z.nativeEnum(MOTIF_SUPPRESSION),
    description: z.string().nullish(),
    date: z.date({ description: "Date de suppression" }),
  }),
});

export type IEffectifArchive = z.output<typeof zEffectifArchive>;

export default { zod: zEffectifArchive, indexes, collectionName };
