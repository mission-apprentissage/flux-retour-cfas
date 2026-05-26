export type CfaOnboardingInfo = {
  email: string;
  role?: "admin" | "member";
  etablissement: {
    nom: string;
    adresse: string;
    commune: string;
    uai: string | null;
    siret: string | null;
    departement?: string;
  };
  missionsLocales: Array<{
    _id: string;
    nom: string;
    commune?: string;
    codePostal?: string;
  }>;
  cfaConnectesCount: number;
};
