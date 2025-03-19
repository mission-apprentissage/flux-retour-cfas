"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Box, Container, Typography } from "@mui/material";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { publicConfig } from "@/config.public";
import { NotFound } from "@/icons/NotFound";

import { DsfrLink } from "../_components/link/DsfrLink";

function getErrorDescription(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (publicConfig.env === "local") {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }
  }

  return null;
}

export default function ErrorComponent({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  const details = getErrorDescription(error);

  return (
    <Container maxWidth="xl">
      <Box>
        <Box
          padding={8}
          display="flex"
          justifyContent="center"
          flexDirection="column"
          margin="auto"
          maxWidth="600px"
          textAlign="center"
        >
          <NotFound />

          <Box mt={4}>
            <Typography variant="h1" gutterBottom>
              Une erreur est survenue
            </Typography>
            {details && <Typography gutterBottom>{details}</Typography>}

            <Box mt={2}>
              <Button onClick={() => reset()} type="button">
                Essayer à nouveau
              </Button>
            </Box>

            <Box mt={2}>
              <DsfrLink href="/" locale="fr">
                Retourner à la page d&apos;accueil
              </DsfrLink>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
