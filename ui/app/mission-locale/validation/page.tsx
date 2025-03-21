"use client";

import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";

import { MlCard } from "@/app/_components/card/MlCard";
import { DsfrLink } from "@/app/_components/link/DsfrLink";

export default function Page() {
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
          subtitle="Vous avez contacté tous les jeunes de la liste."
          imageSrc="/images/mission-locale-validation.svg"
          imageAlt="Personnes discutant et travaillant devant un tableau"
          body={
            <Typography>
              <strong>
                Nous vous invitons à vous reconnecter dans une semaine pour prendre connaissance de nouvelles
                situations.
              </strong>{" "}
              Des commentaires ? Ecrivez-nous sur tableau-de-bord@apprentissage.beta.gouv.fr
            </Typography>
          }
        />
      </Grid>
    </Grid>
  );
}
