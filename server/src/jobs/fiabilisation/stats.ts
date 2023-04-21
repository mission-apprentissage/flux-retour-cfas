import { getStatOrganismes } from "@/common/actions/organismes/organismes.actions";

export const getStats = async () => {
  console.info("getStats", await getStatOrganismes());
};
