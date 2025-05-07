"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Stack, Box } from "@mui/material";

import { ModalRupturantExcel } from "@/app/mission-locale/_components/modal/ModalRupturantExcel";
import { _getBlob } from "@/common/httpClient";

export const MLHeader = () => {
  return (
    <>
      <Alert
        closable
        description="Nous vous mettons à disposition les contacts des jeunes et leur CFA : vous êtes encouragé à les contacter. Ne partagez pas ces listes."
        onClose={() => {}}
        severity="warning"
        title=""
        classes={{
          root: "fr-mb-3w",
        }}
      />

      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems="end">
          <Box flex="1">
            <h1 className="fr-h1 fr-text--blue-france fr-mb-1w">Liste des jeunes en ruptures de contrat</h1>
            <p className="fr-text--sm fr-text--bold fr-mb-1w">
              Nous affichons sur le TBA tous les jeunes ayant un statut de rupture, en les classant par date de rupture
              (du plus récent au plus ancien).
            </p>
            <p className="fr-text--xs">
              Sources : CFA et{" "}
              <a
                href="https://efpconnect.emploi.gouv.fr/auth/realms/efp/protocol/cas/login?TARGET=https%3A%2F%2Fdeca.alternance.emploi.gouv.fr%3A443%2Fdeca-app%2F"
                target="_blank"
                rel="noopener external"
              >
                DECA
              </a>
            </p>
          </Box>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="flex-end" alignItems="center">
            <ModalRupturantExcel />
          </Stack>
        </Stack>

        <Box component="hr" className="fr-hr" />
      </Stack>
    </>
  );
};
