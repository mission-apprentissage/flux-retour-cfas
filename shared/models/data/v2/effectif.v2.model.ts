import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zEffectifAnneeScolaire, zEffectifComputedStatut } from "../effectifs.model";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ "identifiant.formation_id": 1, "identifiant.person_id": 1 }, { unique: true }],
  [{ annee_scolaires: 1, "adresse.mission_locale_id": 1 }, {}],
];

const collectionName = "effectifV2";

const zContrat = z.object({
  date_debut: z.date(),
  date_fin: z.date().nullable(),

  employeur: z.object({
    siret: z.string().nullable(),
  }),

  rupture: z
    .object({
      cause: z.string().nullable(),
      date_rupture: z.date(),
    })
    .nullable(),
});

const zEffectifV2 = z.object({
  _id: zObjectId,

  identifiant: z.object({
    person_id: zObjectId,
    formation_id: zObjectId,
  }),

  annee_scolaires: zEffectifAnneeScolaire.array(),

  id_erp: z.string().array(),

  date_inscription: z.date(),

  exclusion: z
    .object({
      cause: z.string().nullable(),
      date: z.date(),
    })
    .nullable(),

  diplome: z
    .object({
      date: z.date().nullable(),
      obtention: z.boolean(),
    })
    .nullable(),

  session: z.object({
    debut: z.date(),
    fin: z.date(),
  }),

  adresse: z
    .object({
      label: z.string().nullable(),

      code_postal: z.string(),
      code_commune_insee: z.string(),

      commune: z.string(),

      code_region: z.string(),
      code_departement: z.string(),
      code_academie: z.string(),
      mission_locale_id: z.number().nullable(),
    })
    .nullable(),

  // Indexed contrats par date de début au format (YYYY-MM-DD)
  contrats: z.record(zContrat),

  derniere_transmission: z.date(),

  informations_personnelles: z.object({
    rqth: z.boolean(),
  }),

  _computed: z.object({
    statut: zEffectifComputedStatut,
  }),
});

export type IEffectifV2 = z.output<typeof zEffectifV2>;
export default { zod: zEffectifV2, collectionName, indexes };
