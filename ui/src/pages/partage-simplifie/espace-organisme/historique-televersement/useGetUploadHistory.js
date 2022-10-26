import { useQuery } from "react-query";

import { getUploadHistory } from "../../../../common/api/partageSimplifieApi.js";
import { QUERY_KEYS } from "../../../../common/constants/queryKeys";

const useFetchUploadHistory = () => {
  const { data, isLoading, error } = useQuery([QUERY_KEYS.UPLOAD_HISTORY], () => getUploadHistory());
  return { data, isLoading, error };
};

export default useFetchUploadHistory;
