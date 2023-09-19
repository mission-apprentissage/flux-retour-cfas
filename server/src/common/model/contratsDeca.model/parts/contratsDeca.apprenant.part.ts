import { booleanOrNull, numberOrNull, object, string, stringOrNull } from "../../json-schema/jsonSchemaTypes";

export const contratsDecaApprenantSchema = object(
  {
    nom: string({ description: "Le nom de l'alternant" }),
    prenom: string({ description: "Le prenom de l'alternant" }),
    sexe: string({ description: "Le sexe de l'alternant" }),
    dateNaissance: string({ description: "La date de naissance de l'alternant" }),
    departementNaissance: string({ description: "Le département de naissance de l'alternant" }),
    nationalite: numberOrNull({ description: "Le code de la nationalité de l'alternant" }),
    handicap: booleanOrNull({
      description: "Indique si l'alternant est identifié comme porteur d'un handicap",
    }),
    courriel: stringOrNull({ description: "L'adresse email de l'alternant" }),
    telephone: stringOrNull({ description: "Le numéro de téléphone de l'alternant" }),
    adresse: object({
      numero: numberOrNull({ description: "Le numéro de l'adresse" }),
      voie: stringOrNull({ description: "La voie de l'adresse" }),
      codePostal: stringOrNull({ description: "Le code postal de l'adresse" }),
    }),
    derniereClasse: stringOrNull({ description: "La dernière classe de l'apprenant" }),
  },
  {
    required: ["nom", "prenom", "sexe", "dateNaissance", "departementNaissance"],
  }
);
