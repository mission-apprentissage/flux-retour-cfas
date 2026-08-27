"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CGU_VERSION } from "shared/constants";

import { CguArticles } from "@/app/(public)/cgu/CguArticles";
import { _put } from "@/common/httpClient";
import { AuthContext } from "@/common/internal/AuthContext";

import styles from "./ForceAcceptCgu.module.scss";

export function ForceAcceptCgu({ user }: { user?: AuthContext | null }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mustAccept = !!user && user.account_status === "CONFIRMED" && user.has_accept_cgu_version !== CGU_VERSION;

  useEffect(() => {
    if (!mustAccept) return;
    panelRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mustAccept]);

  if (!mustAccept) return null;

  const onAccept = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await _put(`/api/v1/profile/cgu/accept/${CGU_VERSION}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.json?.data?.message || "Une erreur est survenue, veuillez réessayer.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="force-accept-cgu-title">
      <div ref={panelRef} tabIndex={-1} className={styles.panel}>
        <h1 id="force-accept-cgu-title" className="fr-h3 fr-mb-2w">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="fr-text--bold fr-mb-2w">
          {user.has_accept_cgu_version ? (
            <>
              Nos conditions générales d&apos;utilisation ont changé depuis votre dernière visite (
              {user.has_accept_cgu_version} → {CGU_VERSION}).
              <br />
              Merci de lire attentivement les conditions générales d&apos;utilisation avant de les accepter.
            </>
          ) : (
            <>Merci de lire attentivement les conditions générales d&apos;utilisation avant de les accepter.</>
          )}
        </p>
        <div className={styles.content}>
          <CguArticles />
        </div>
        {error && (
          <Alert
            severity="error"
            title={error}
            description=""
            small
            closable
            onClose={() => setError(null)}
            className="fr-mt-2w"
          />
        )}
        <div className={styles.actions}>
          <Button onClick={onAccept} disabled={isSubmitting}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
