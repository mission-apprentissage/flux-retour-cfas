"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";

import { _delete } from "@/common/httpClient";

import { useAuth } from "../_context/UserContext";

import styles from "./Impersonate.module.css";

export const Impersonate = () => {
  const { user } = useAuth();

  const handleImpersonationExit = async () => {
    await _delete("/api/v1/admin/impersonate");

    window.location.href = "/";
  };

  return (
    <>
      {user && user.impersonating && (
        <Button iconId="ri-logout-box-line" className={styles.button} onClick={handleImpersonationExit}>
          Imposture en cours
        </Button>
      )}
    </>
  );
};
