import {
  createAllMissingOrganismeOrganisation,
  deleteOrganisationWithoutUser,
} from "@/jobs/organisations/organisation.job";

export const up = async () => {
  await deleteOrganisationWithoutUser();
  await createAllMissingOrganismeOrganisation();
};
