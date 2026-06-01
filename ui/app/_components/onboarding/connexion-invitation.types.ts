export type Adresse = {
  rue?: string | null;
  code_postal?: string | null;
  commune?: string | null;
} | null;

export type ConnexionInvitationInfo = {
  email: string;
  organisme: {
    nom: string | null;
    adresse: Adresse;
    uai: string | null;
    siret: string;
  } | null;
  missionsLocales: Array<{
    nom: string | null;
    adresse: Adresse;
    effectifs_count: number;
  }>;
};

export const formatAdresseShort = (a: Adresse): string => {
  if (!a) return "";
  return [a.commune ?? "", a.code_postal ?? ""].filter(Boolean).join(" ");
};

export const formatAdresseLong = (a: Adresse): string => {
  if (!a) return "";
  return [a.rue ?? "", a.code_postal ?? "", a.commune ?? ""].filter(Boolean).join(" ");
};
