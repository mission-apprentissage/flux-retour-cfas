import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/app/_context/UserContext";
import { _put } from "@/common/httpClient";

import { cfaQueryKeys } from "../../cfa/hooks";

import { effectifQueryKeys } from "./useEffectifQueries";

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (effectifId: string) => {
      const organismeId = user?.organisation?.organisme_id;
      if (!organismeId) {
        throw new Error("organismeId not found in user context");
      }
      return _put(`/api/v1/organismes/${organismeId}/mission-locale/effectif/${effectifId}/mark-read`, {});
    },
    onSuccess: (_, effectifId) => {
      // Invalidate ML queries
      queryClient.invalidateQueries({ queryKey: effectifQueryKeys.detail(effectifId) });
      queryClient.invalidateQueries({ queryKey: effectifQueryKeys.all });
      // Invalidate CFA list queries (ruptures, collaborations, unread count)
      queryClient.invalidateQueries({ queryKey: cfaQueryKeys.all });
      // Invalidate CFA detail query (uses ["effectif", id] key)
      queryClient.invalidateQueries({ queryKey: ["effectif", effectifId] });
    },
  });
}
