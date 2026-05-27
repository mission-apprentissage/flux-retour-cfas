import { ObjectId } from "bson";

export const NOW = new Date("2026-05-13T00:00:00.000Z");
export const ANNEE_SCOLAIRE = "2025-2026";
export const DOB_21_ANS = new Date("2005-01-01T00:00:00.000Z"); // ≈ 21 ans à NOW
export const DATE_RUPTURE_RECENTE = new Date("2026-04-01T00:00:00.000Z"); // ~42j à NOW

let siretCounter = 12345678900000;
let uaiCounter = 1000000;
let userCounter = 0;

export const resetFixtureCounters = () => {
  siretCounter = 12345678900000;
  uaiCounter = 1000000;
  userCounter = 0;
};

export const buildOrgaOf = (override: Record<string, any> = {}) => ({
  _id: new ObjectId(),
  type: "ORGANISME_FORMATION" as const,
  siret: `${++siretCounter}`,
  uai: `${++uaiCounter}A`,
  created_at: NOW,
  ...override,
});

export const buildOrgaMl = (nom: string, override: Record<string, any> = {}) => ({
  _id: new ObjectId(),
  type: "MISSION_LOCALE" as const,
  nom,
  ml_id: Math.floor(Math.random() * 100000) + 1,
  created_at: NOW,
  ...override,
});

export const buildOrganisme = (orgaOf: { siret: string; uai: string | null }, override: Record<string, any> = {}) => ({
  _id: new ObjectId(),
  siret: orgaOf.siret,
  uai: orgaOf.uai,
  nom: "Mon CFA",
  raison_sociale: "Mon CFA SARL",
  enseigne: "Mon CFA",
  adresse: { region: "11", departement: "75", commune: "Paris" },
  reseaux: ["CMA"],
  fiabilisation_statut: "FIABLE",
  ferme: false,
  formations_count: 0,
  contacts_from_referentiel: [],
  updated_at: NOW,
  created_at: NOW,
  ...override,
});

export const buildUser = (orgaOf: { _id: ObjectId }, override: Record<string, any> = {}) => ({
  _id: new ObjectId(),
  email: `user-${++userCounter}@example.com`,
  password: "hashed",
  prenom: "Alice",
  nom: "DUPONT",
  civility: "Madame",
  fonction: "Conseillère",
  telephone: "0123456789",
  organisation_id: orgaOf._id,
  organisation_role: "member",
  account_status: "CONFIRMED" as const,
  created_at: NOW,
  ...override,
});

export const buildRupturant = (organismeId: ObjectId, mlId: ObjectId, override: Record<string, any> = {}) => ({
  _id: new ObjectId(),
  mission_locale_id: mlId,
  effectif_id: new ObjectId(),
  date_rupture: DATE_RUPTURE_RECENTE,
  created_at: NOW,
  brevo: {},
  current_status: { value: "RUPTURANT", date: NOW },
  effectif_snapshot: {
    organisme_id: organismeId,
    annee_scolaire: ANNEE_SCOLAIRE,
    apprenant: {
      nom: "X",
      prenom: "Y",
      date_de_naissance: DOB_21_ANS,
      courriel: "x@y.fr",
    },
    _computed: { statut: { en_cours: "RUPTURANT" } },
  },
  ...override,
});
