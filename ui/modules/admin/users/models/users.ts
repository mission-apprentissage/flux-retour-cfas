import { User, UserOrganisation } from "@/common/internal/User";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";

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
  return {
    ...user,
    organismeId,
    organismeNom,
    created_at: formatDateDayMonthYear(user.created_at),
    organisationType: user?.organisation?.label || "",
    userType: user?.organisation?.type || "",
    normalizedOrganismeNom: organismeNom.toLowerCase(),
    normalizedNomPrenom: user.nom.toLowerCase() + " " + user.prenom.toLowerCase(),
    normalizedEmail: user.email.toLowerCase(),
  };
};
