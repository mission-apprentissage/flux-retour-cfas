import { User, UserOrganisation } from "@/common/internal/User";

export type UserNormalized = {
  _id: string;
  password_updated_at: Date;
  civility: string;
  telephone: string;
  has_accept_cgu_version: string;
  organisation_id: string;
  organisation: UserOrganisation;
  normalizedNomPrenom: string;
  normalizedEmail: string;
  normalizedOrganismeNom: string;
  organisationType: string;
  userType: string;
  organismeId: string;
  organismeNom: string;
  organismeReseaux: string[];
  organismeDepartement: string;
  organismeRegion: string;
  organisationDepartement: string;
  organisationRegion: string;
  nom: string;
  prenom: string;
  account_status: string;
  created_at: string;
  email: string;
  fonction: string;
  last_connection: string;
};

export const toUserNormalized = (user: User): UserNormalized => {
  const organismeId = user?.organisation?.organisme?._id;
  const organismeNom = user?.organisation?.organisme?.nom || user?.organisation?.label || "";
  const organismeReseaux = user?.organisation?.organisme?.reseaux || [];
  const organismeDepartement = user?.organisation?.organisme?.adresse?.departement || "";
  const organismeRegion = user?.organisation?.organisme?.adresse?.region || "";
  const organisationDepartement = user?.organisation?.code_departement || "";
  const organisationRegion = user?.organisation?.code_region || "";

  return {
    ...user,
    organismeId,
    organismeNom,
    organismeReseaux,
    organismeDepartement,
    organismeRegion,
    organisationDepartement,
    organisationRegion,
    created_at: user.created_at.toLocaleString(),
    organisationType: user?.organisation?.label || "",
    userType: user?.organisation?.type || "",
    normalizedOrganismeNom: organismeNom.toLowerCase(),
    normalizedNomPrenom: user.nom.toLowerCase() + " " + user.prenom.toLowerCase(),
    normalizedEmail: user.email.toLowerCase(),
  };
};
