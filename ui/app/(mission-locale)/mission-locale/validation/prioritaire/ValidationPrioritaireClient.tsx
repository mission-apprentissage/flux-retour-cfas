"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

import { MlCard } from "@/app/_components/card/MlCard";
import { DsfrLink } from "@/app/_components/link/DsfrLink";

export default function ValidationPrioritaireClient() {
  const router = useRouter();

  return (
    <div className="fr-grid-row">
      <div className="fr-col-12 fr-col-md-3">
        <DsfrLink href="/mission-locale" arrow="left">
          Retour à la liste
        </DsfrLink>
      </div>
      <div
        className="fr-col-12 fr-col-md-9"
        style={{ paddingLeft: "1rem", borderLeft: "1px solid var(--border-default-grey)" }}
      >
        <MlCard
          title="Félicitations"
          subtitle="Vous avez traité tous les dossiers prioritaires."
          imageSrc="/images/mission-locale-validation.svg"
          imageAlt="Personnes discutant et travaillant devant un tableau"
          body={
            <Button iconId="ri-arrow-right-line" iconPosition="right" onClick={() => router.push("/mission-locale")}>
              Retour à la liste
            </Button>
          }
        />
      </div>
    </div>
  );
}
