"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

import { _delete } from "@/common/httpClient";

export function ImpersonationNotice() {
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await _delete("/api/v1/admin/impersonate");
      window.location.reload();
    } catch {
      setIsLeaving(false);
    }
  };

  return (
    <div className={fr.cx("fr-container", "fr-my-6w")}>
      <Alert
        severity="info"
        title="Imposture en cours"
        description={
          <>
            <p>Quittez l&apos;imposture pour revenir au suivi des indicateurs.</p>
            <Button className={fr.cx("fr-mt-2w")} onClick={handleLeave} disabled={isLeaving}>
              Quitter l&apos;imposture
            </Button>
          </>
        }
      />
    </div>
  );
}
