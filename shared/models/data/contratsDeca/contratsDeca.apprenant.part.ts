import { z } from "zod";

export const zContratsDecaApprenantSchema = z
  .object({
    nom: z.string().describe("Le nom de l'alternant"),
    prenom: z.string().describe("Le prenom de l'alternant"),
    sexe: z.string().describe("Le sexe de l'alternant"),
    dateNaissance: z.string().describe("La date de naissance de l'alternant"),
    departementNaissance: z.string().describe("Le département de naissance de l'alternant"),
    nationalite: z.number().nullish().describe("Le code de la nationalité de l'alternant"),
    handicap: z.boolean().nullish().describe("Indique si l'alternant est identifié comme porteur d'un handicap"),
    courriel: z.string().nullish().describe("L'adresse email de l'alternant"),
    telephone: z.string().nullish().describe("Le numéro de téléphone de l'alternant"),
    adresse: z
      .object({
        numero: z.number().nullish().describe("Le numéro de l'adresse"),
        voie: z.string().nullish().describe("La voie de l'adresse"),
        codePostal: z.string().nullish().describe("Le code postal de l'adresse"),
      })
      .optional(),
    derniereClasse: z.string().nullish().describe("La dernière classe de l'apprenant"),
  })
  .strict();
