import { _post, _put } from "@/common/httpClient";

// eslint-disable-next-line no-unused-vars
const saveCerfa = async ({ organisme_id, effectifId, data, inputNames }) => {
  try {
    return await _put(`/api/v1/effectif/${effectifId}`, {
      ...data,
      organisme_id,
      inputNames,
    });
  } catch (e) {
    console.error(e);
  }
};

export const apiService = {
  saveCerfa,
};
