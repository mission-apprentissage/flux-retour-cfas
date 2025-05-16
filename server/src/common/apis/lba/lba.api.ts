import axios from "axios";

export const LBA_URL = "https://labonnealternance.apprentissage.beta.gouv.fr";
export const getLbaTrainingLinks = (cfd: string, rncp: string) => {
  return axios.post(`${LBA_URL}/api/traininglinks`, [{ cfd, rncp, id: "_" }]);
};
