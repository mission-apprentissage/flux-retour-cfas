"use client";

import { Skeleton } from "@mui/material";
import { useEffect, useRef } from "react";

import { CfaCollaborationDetail } from "@/app/_components/ruptures/cfa/collaboration/CfaCollaborationDetail";
import { useCfaEffectifDetail } from "@/app/_components/ruptures/cfa/collaboration/hooks";
import { useMarkNotificationAsRead } from "@/app/_components/ruptures/shared/hooks/useNotificationMutations";
import { useAuth } from "@/app/_context/UserContext";

export default function CfaDetailClient({ id }: { id: string }) {
  const { user } = useAuth();
  const { data, isLoading } = useCfaEffectifDetail(id);
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAsReadRef = useRef(markAsReadMutation.mutate);
  markAsReadRef.current = markAsReadMutation.mutate;

  const hasUnreadNotification = data?.effectif?.organisme_data?.has_unread_notification === true;

  useEffect(() => {
    if (hasUnreadNotification && id && !user?.impersonating) {
      markAsReadRef.current(id, {
        onError: (error: unknown) => {
          console.error("Failed to mark notification as read:", error);
        },
      });
    }
  }, [hasUnreadNotification, id, user?.impersonating]);

  if (isLoading || !data) {
    return (
      <div className="fr-container fr-py-4w">
        <Skeleton variant="rectangular" height={60} className="fr-mb-2w" />
        <Skeleton variant="rectangular" height={400} />
      </div>
    );
  }

  return <CfaCollaborationDetail data={data} />;
}
