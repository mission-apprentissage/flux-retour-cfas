import { z } from "zod";

const zIdentifiantBal = z.string().regex(/^[0-9a-f]{24}$/);
const zDateBal = z.coerce.date();

export const zContratDecaBal = z.object({
  _id: zIdentifiantBal,
  updated_at: zDateBal,

  no_contrat: z.string().nullish(),
  type_contrat: z.string().nullish(),
  statut: z.string().nullish(),
  type_employeur: z.number().nullish(),
  date_debut_contrat: zDateBal.nullish(),
  date_fin_contrat: zDateBal.nullish(),
  date_effet_rupture: zDateBal.nullish(),

  alternant: z
    .object({
      nom: z.string().nullish(),
      prenom: z.string().nullish(),
      sexe: z.string().nullish(),
      courriel: z.string().nullish(),
      telephone: z.string().nullish(),
      date_naissance: zDateBal.nullish(),
      nationalite: z.number().nullish(),
      handicap: z.boolean().nullish(),
      derniere_classe: z.number().nullish(),
      adresse: z
        .object({
          numero: z.string().nullish(),
          voie: z.string().nullish(),
          code_postal: z.string().nullish(),
        })
        .nullish(),
    })
    .nullish(),
  formation: z
    .object({
      date_debut_formation: zDateBal.nullish(),
      date_fin_formation: zDateBal.nullish(),
      code_diplome: z.string().nullish(),
      rncp: z.string().nullish(),
      intitule_ou_qualification: z.string().nullish(),
    })
    .nullish(),
  employeur: z
    .object({
      siret: z.string().nullish(),
      denomination: z.string().nullish(),
      naf: z.string().nullish(),
      nombre_de_salaries: z.number().nullish(),
      adresse: z.object({ code_postal: z.string().nullish() }).nullish(),
    })
    .nullish(),
  organisme_formation: z
    .object({
      siret: z.string().nullish(),
      uai_cfa: z.string().nullish(),
    })
    .nullish(),
  etablissement_formation: z.object({ siret: z.string().nullish() }).nullish(),
});

export const zPageContratsDecaBal = z.object({
  contrats: z.array(zContratDecaBal),
  pagination: z.object({
    next: zIdentifiantBal.nullable(),
    ecartes: z.number().int(),
  }),
});

export type IContratDecaBal = z.output<typeof zContratDecaBal>;
export type IPageContratsDecaBal = z.output<typeof zPageContratsDecaBal>;
