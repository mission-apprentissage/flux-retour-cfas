import { DuplicateOrganismeDetail } from "./DuplicateOrganismeDetail";

export type DuplicateOrganismeGroup = {
  _id: {
    nom: string;
    siret: string;
  };
  duplicates: DuplicateOrganismeDetail[];
};
