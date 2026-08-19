"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useSearchParams } from "next/navigation";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { Organisme } from "@/common/internal/Organisme";

import styles from "./dashboard.module.scss";

const CERFA_URL = "https://contrat.apprentissage.beta.gouv.fr/cerfa";

export function CerfaCard({ organisme }: { organisme: Organisme }) {
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const searchParams = useSearchParams();

  const buildUrlWithUtm = () => {
    const url = new URL(CERFA_URL);
    url.searchParams.set("utm_source", "tdb");
    url.searchParams.set("utm_content", organisme._id);
    const utmCampaign = searchParams?.get("utm_campaign");
    if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
    return url.toString();
  };

  return (
    <div className={styles.cerfaCard}>
      <p className={styles.cerfaTitle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/cerfa/avatar.svg" alt="" className={styles.cerfaIcon} />
        Un contrat d&apos;apprentissage&nbsp;?
      </p>
      <p className={styles.cerfaText}>Remplissez vos prochains contrats CERFA&nbsp;: simple, rapide et sans erreur.</p>
      <Button
        iconId="fr-icon-edit-line"
        linkProps={{
          href: buildUrlWithUtm(),
          target: "_blank",
          rel: "noopener noreferrer",
          onClick: () =>
            trackPlausibleEvent("clic_redirection_cerfa", undefined, {
              uai: organisme.uai?.toString() ?? "",
              siret: organisme.siret,
            }),
        }}
      >
        Démarrer un contrat CERFA
      </Button>
      <p className={styles.cerfaFooter}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/landing-cards/city-hall.svg" alt="" className={styles.cerfaIcon} />
        <span>
          Vous formez un apprenti en contrat chez un employeur public&nbsp;? Utilisez{" "}
          <DsfrLink href="https://celia.emploi.gouv.fr/" arrow="none" external>
            CELIA
          </DsfrLink>
          .
        </span>
      </p>
    </div>
  );
}
