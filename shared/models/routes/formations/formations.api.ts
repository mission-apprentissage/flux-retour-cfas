import { IFormationCatalogue } from "../../data";

export type IFormationSearchResponse = Pick<IFormationCatalogue, "cle_ministere_educatif" | "intitule_long" | "cfd"> & {
  rncp: IFormationCatalogue["rncp_code"];
  cfd_start_date: string | null | undefined;
  cfd_end_date: string | null | undefined;
};
