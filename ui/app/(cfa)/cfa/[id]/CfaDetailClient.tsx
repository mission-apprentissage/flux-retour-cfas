"use client";

import { useEffect, useRef } from "react";

import { CfaCollaborationDetail } from "@/app/_components/ruptures/cfa/collaboration/CfaCollaborationDetail";
import { useCfaEffectifDetail } from "@/app/_components/ruptures/cfa/collaboration/hooks";
import { useMarkNotificationAsRead } from "@/app/_components/ruptures/shared/hooks/useNotificationMutations";
import { useAuth } from "@/app/_context/UserContext";

export default function CfaDetailClient({ id }: { id: string }) {
  const { user } = useAuth();
  const { data } = useCfaEffectifDetail(id);
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAsReadRef = useRef(markAsReadMutation.mutate);
  markAsReadRef.current = markAsReadMutation.mutate;

  useEffect(() => {
    if (data?.effectif?.unread_by_current_user === true && id && !user?.impersonating) {
      markAsReadRef.current(id, {
        onError: (error: unknown) => {
          console.error("Failed to mark notification as read:", error);
        },
      });
    }
  }, [data?.effectif?.unread_by_current_user, id, user?.impersonating]);

  if (!data) return null;

  return <CfaCollaborationDetail data={data} />;
}
