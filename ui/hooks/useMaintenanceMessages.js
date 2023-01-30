import { useQuery } from "@tanstack/react-query";

import { _get } from "../common/httpClient";

const useMaintenanceMessages = () => {
  const {
    data: messages,
    isLoading,
    error,
    refetch,
  } = useQuery(["maintenanceMessages"], () => _get("/api/v1/maintenanceMessages"));

  const messageMaintenance = messages?.find((d) => d.context === "maintenance");
  const messageAutomatique = messages?.find((d) => d.context === "automatique" && d.msg);
  const messagesAlert = messages?.filter((d) => d.type === "alert" && d.context === "manuel");
  const messagesInfo = messages?.filter((d) => d.type === "info");

  return {
    messages,
    loading: isLoading,
    error,
    refetch,
    messageAutomatique,
    messageMaintenance,
    messagesAlert,
    messagesInfo,
  };
};

export default useMaintenanceMessages;
