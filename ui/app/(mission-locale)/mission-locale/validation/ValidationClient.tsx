"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Grid from "@mui/material/Grid2";
import { useRouter } from "next/navigation";

import { MlCard } from "@/app/_components/card/MlCard";
import { DsfrLink } from "@/app/_components/link/DsfrLink";

export default function ValidationClient() {
  const router = useRouter();

  return (
    <Grid container>
      <Grid size={{ xs: 12, md: 3 }}>
        <DsfrLink href="/mission-locale" arrow="left">
          Retour à la liste
        </DsfrLink>
      </Grid>
      <Grid
        size={{ xs: 12, md: 9 }}
        pl={4}
        sx={{
          "--Grid-borderWidth": "1px",
          borderLeft: "var(--Grid-borderWidth) solid",
          borderColor: "var(--border-default-grey)",
        }}
      >
        <MlCard
          title="Félicitations"
          subtitle="Vous avez traité tous les dossiers."
          imageSrc="/images/mission-locale-validation.svg"
          imageAlt="Personnes discutant et travaillant devant un tableau"
          body={
            <Button iconId="ri-arrow-right-line" iconPosition="right" onClick={() => router.push("/mission-locale")}>
              Retour à la liste
            </Button>
          }
        />
      </Grid>
    </Grid>
  );
}
