"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { Box, CircularProgress } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import React, { useState } from "react";

import { _get, _post } from "@/common/httpClient";

const modal = createModal({
  id: "sync-brevo-admin-modal",
  isOpenedByDefault: false,
});

export function ModalAdminSyncBrevo(params: { id: string }) {
  const [isFetching, setIsFetching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncData, setSyncData] = useState<{ total: number; eligible: number } | null>(null);
  const onSync = async () => {
    setIsFetching(true);
    try {
      await _post(`/api/v1/admin/mission-locale/${params.id}/brevo/sync`);
    } catch (e) {
      captureException(e);
    } finally {
      setIsFetching(false);
    }
  };

  const onOpen = async () => {
    setIsSyncing(true);
    try {
      const data = await _get(`/api/v1/admin/mission-locale/${params.id}/brevo/sync`);
      setSyncData(data);
    } catch (e) {
      captureException(e);
    } finally {
      setIsSyncing(false);
    }
  };

  useIsModalOpen(modal, {
    onDisclose: onOpen,
  });

  return (
    <>
      <Button
        nativeButtonProps={modal.buttonProps}
        disabled={isFetching}
        iconId="ri-arrow-right-line"
        iconPosition="right"
      >
        {isFetching && <CircularProgress size="1em" sx={{ mr: 1 }} />}
        Synchroniser liste Brevo
      </Button>
      <modal.Component
        title="Synchronisation des listes Brevo."
        buttons={[
          {
            onClick: onSync,
            children: "Synchroniser liste Brevo",
          },
        ]}
      >
        {isSyncing && <CircularProgress size="1em" sx={{ mr: 1 }} />}
        {!isSyncing && syncData && (
          <Box>
            Sur les {syncData?.total} rupturants, seulement {syncData?.eligible} seront ajoutés dans la liste Brevo
          </Box>
        )}
      </modal.Component>
    </>
  );
}
