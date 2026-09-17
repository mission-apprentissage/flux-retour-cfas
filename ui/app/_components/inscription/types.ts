import type { IOrganisationCreate } from "shared";

export type SetOrganisation = (organisation: IOrganisationCreate | null) => void;

export type InscriptionFormProps = {
  organisation: IOrganisationCreate | null;
  setOrganisation: SetOrganisation;
};
