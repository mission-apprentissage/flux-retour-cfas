import { getStatOrganismes } from "../../common/actions/organismes/organismes.actions.js";

export const getStats = async () => {
  console.info("getStats", await getStatOrganismes());
};
