export const EMAIL_DOMAIN = "example.com";

const PRENOMS: Array<{ prenom: string; sexe: "M" | "F" }> = [
  { prenom: "Léa", sexe: "F" },
  { prenom: "Lucas", sexe: "M" },
  { prenom: "Chloé", sexe: "F" },
  { prenom: "Hugo", sexe: "M" },
  { prenom: "Manon", sexe: "F" },
  { prenom: "Nathan", sexe: "M" },
  { prenom: "Camille", sexe: "F" },
  { prenom: "Enzo", sexe: "M" },
  { prenom: "Inès", sexe: "F" },
  { prenom: "Louis", sexe: "M" },
  { prenom: "Jade", sexe: "F" },
  { prenom: "Gabriel", sexe: "M" },
  { prenom: "Sarah", sexe: "F" },
  { prenom: "Adam", sexe: "M" },
  { prenom: "Emma", sexe: "F" },
  { prenom: "Yanis", sexe: "M" },
  { prenom: "Lina", sexe: "F" },
  { prenom: "Mathis", sexe: "M" },
  { prenom: "Zoé", sexe: "F" },
  { prenom: "Rayan", sexe: "M" },
  { prenom: "Clara", sexe: "F" },
  { prenom: "Théo", sexe: "M" },
  { prenom: "Anaïs", sexe: "F" },
  { prenom: "Noah", sexe: "M" },
  { prenom: "Maëlys", sexe: "F" },
  { prenom: "Kylian", sexe: "M" },
  { prenom: "Océane", sexe: "F" },
  { prenom: "Ethan", sexe: "M" },
  { prenom: "Yasmine", sexe: "F" },
  { prenom: "Mehdi", sexe: "M" },
  { prenom: "Louise", sexe: "F" },
  { prenom: "Tom", sexe: "M" },
  { prenom: "Ambre", sexe: "F" },
  { prenom: "Sacha", sexe: "M" },
  { prenom: "Nour", sexe: "F" },
  { prenom: "Axel", sexe: "M" },
  { prenom: "Élise", sexe: "F" },
  { prenom: "Bilal", sexe: "M" },
  { prenom: "Romane", sexe: "F" },
  { prenom: "Jules", sexe: "M" },
];

export const NOMS = [
  "Martin",
  "Bernard",
  "Dubois",
  "Thomas",
  "Robert",
  "Richard",
  "Petit",
  "Durand",
  "Leroy",
  "Moreau",
  "Simon",
  "Laurent",
  "Lefebvre",
  "Michel",
  "Garcia",
  "David",
  "Bertrand",
  "Roux",
  "Vincent",
  "Fournier",
  "Morel",
  "Girard",
  "André",
  "Lefèvre",
  "Mercier",
  "Dupont",
  "Lambert",
  "Bonnet",
  "François",
  "Martinez",
  "Legrand",
  "Garnier",
  "Faure",
  "Rousseau",
  "Blanc",
  "Guérin",
  "Muller",
  "Henry",
  "Roussel",
  "Nicolas",
  "Perrin",
];

export interface Identite {
  prenom: string;
  nom: string;
  sexe: "M" | "F";
}

export function identite(n: number): Identite {
  const { prenom, sexe } = PRENOMS[n % PRENOMS.length];
  return { prenom, sexe, nom: NOMS[n % NOMS.length] };
}

export const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const email = (prenom: string, nom: string) => `${slug(prenom)}.${slug(nom)}@${EMAIL_DOMAIN}`;
