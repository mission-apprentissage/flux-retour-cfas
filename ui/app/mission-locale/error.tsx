"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Box, Container, Typography } from "@mui/material";
import { notFound } from "next/navigation";

export default function ErrorComponent() {
  return (
    <Container maxWidth="xl">
      <Box textAlign="center" padding={8}>
        <Typography variant="h1" gutterBottom>
          Une erreur est survenue
        </Typography>
        <Typography gutterBottom>Impossible de traiter votre demande pour le moment.</Typography>
        <Button onClick={() => notFound()}>Retour</Button>
      </Box>
    </Container>
  );
}
