"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Quote } from "@codegouvfr/react-dsfr/Quote";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import React from "react";

import { _get } from "@/common/httpClient";

import { HomeCarousel } from "../_components/carousel/HomeCarousel";
import { StartDsfrOnHydration } from "../_dsfr-setup/dsfrProvider";

const STEPS = [
  {
    stepNumber: "1",
    title: "Les jeunes en rupture de contrat sont détectés en temps réel",
    description: (
      <>
        <strong>Détection automatique grâce à une connexion sécurisée</strong> avec les systèmes d’information des CFA.
      </>
    ),
    imageSrc: "/images/landing-work-1.svg",
    imageAlt: "Accompagner les apprentis",
  },
  {
    stepNumber: "2",
    title: "Les CFA enrichissent les dossiers de manière collaborative",
    description: (
      <>
        <strong>Ils précisent les raisons de la rupture et partagent les freins rencontrés par les jeunes</strong>{" "}
        (mobilité, logement, etc.).
      </>
    ),
    imageSrc: "/images/landing-work-2.svg",
    imageAlt: "Simplifiez vos démarches",
  },
  {
    stepNumber: "3",
    title: "Les Missions Locales engagent une démarche d’« aller vers »",
    description: (
      <>
        <strong>Elles prennent contact avec les jeunes, lèvent les freins périphériques</strong> (mobilité, logement) et{" "}
        <strong>co-construisent avec eux un nouveau projet</strong>.
      </>
    ),
    imageSrc: "/images/landing-work-3.svg",
    imageAlt: "Piloter l’apprentissage",
  },
];

const QUOTES = [
  {
    text: "Pour une fois un outil qui vient nous aider et non entraver notre activité. Pertinent, non chronophage et d'une prise en main enfantine",
    author: "Référent Alternance de la Mission Locale Choquet",
  },
  {
    text: "Cela fait 10 ans que je suis conseillère alternance, j’aurais adoré avoir un outil comme ça dès le départ.",
    author: "Conseillère à la Maison de l’emploi et de l’insertion Lens-Lievin",
  },
  {
    text: "Je souhaite vivement pouvoir utiliser cet outil. Nos ML ont un rôle essentiel à jouer sur le thème de l'apprentissage (promotion de cette voie de formation et accompagnement des jeunes dans la durée) ",
    author: "Conseillère à la Mission Locale Technowest (Bordeaux)",
  },
];

const StepImage = styled("img")(({ theme }) => ({
  userSelect: "none",

  width: "100%",
  height: "auto",

  [theme.breakpoints.up("md")]: {
    width: "auto",
    maxWidth: "100%",
    maxHeight: 400,
  },
}));
const LandingImage = styled("img")(({ theme }) => ({
  userSelect: "none",

  width: "100%",
  height: "auto",

  [theme.breakpoints.up("md")]: {
    width: "auto",
    maxWidth: "100%",
    maxHeight: 400,
  },
}));

export default function Page() {
  const router = useRouter();

  return (
    <>
      <StartDsfrOnHydration />
      <Box
        component="section"
        sx={{
          background: fr.colors.decisions.background.alt.beigeGrisGalet.default,
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "8fr 4fr" },
            alignItems: "center",
            gap: fr.spacing("1w"),
            py: fr.spacing("9w"),
            px: { xs: fr.spacing("3w"), xl: "0px" },
          }}
        >
          <Box>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "1.5rem", md: "2rem" },
                color: fr.colors.decisions.text.actionHigh.blueFrance.default,
                lineHeight: "120%",
                fontWeight: 700,
              }}
            >
              Un outil pour faciliter le repérage et l’accompagnement des jeunes en rupture de contrat
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "1rem", md: "1.25rem" },
                color: fr.colors.decisions.text.actionHigh.blueFrance.default,
                mt: fr.spacing("3w"),
              }}
            >
              Vous êtes un{" "}
              <Box
                className="fr-badge"
                component="span"
                sx={{
                  fontSize: { xs: "0.85rem", md: "1rem" },
                  backgroundColor: fr.colors.decisions.background.contrast.purpleGlycine.default,
                  display: "inline-block",
                }}
              >
                CFA
              </Box>
              ou une{" "}
              <Box
                className="fr-badge"
                component="span"
                sx={{
                  fontSize: { xs: "0.85rem", md: "1rem" },
                  backgroundColor: fr.colors.decisions.background.contrast.purpleGlycine.default,
                  display: "inline-block",
                }}
              >
                Mission Locale
              </Box>{" "}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "1rem", md: "1.25rem" },
                color: fr.colors.decisions.text.actionHigh.blueFrance.default,
                mt: fr.spacing("1w"),
              }}
            >
              👉 Engageons une collaboration durable pour soutenir l’insertion des apprentis !
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: fr.spacing("5w") }}>
              <Button onClick={() => router.push("/auth/inscription")}>Je m’inscris</Button>
              <Button onClick={() => router.push("/auth/connexion")} priority="secondary">
                J’ai déjà un compte
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: { xs: fr.spacing("3w"), md: 0 } }}>
            <LandingImage src="/images/landing-presentation-tdb.svg" alt="Graphique tableau de bord" />
          </Box>
        </Container>
      </Box>

      <Box>
        <Container maxWidth="xl" sx={{ px: { xs: fr.spacing("3w"), xl: "0px" }, py: fr.spacing("9w") }}>
          <Typography
            component="h2"
            sx={{
              color: fr.colors.decisions.artwork.minor.blueCumulus.default,
              fontSize: { xs: "1.5rem", md: "2rem" },
              fontWeight: 700,
              mb: fr.spacing("6w"),
            }}
          >
            Comment ça marche ?
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: fr.spacing("3w"), md: fr.spacing("4w") }}>
            {STEPS.map((step, index) => (
              <Stack key={index} spacing={4} sx={{ flex: 1 }}>
                <Box>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      textAlign: "center",
                      color: "#FFF",
                      background: fr.colors.decisions.artwork.minor.blueCumulus.default,
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: fr.spacing("1w"),
                    }}
                  >
                    {step.stepNumber}
                  </Box>
                  <Typography
                    component="h3"
                    sx={{
                      color: fr.colors.decisions.text.actionHigh.blueCumulus.default,
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      my: fr.spacing("2w"),
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography sx={{ fontSize: "1rem" }}>{step.description}</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <StepImage src={step.imageSrc} alt={step.imageAlt} />
                </Box>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      <HomeCarousel />

      <Box>
        <Container maxWidth="xl" sx={{ px: { xs: fr.spacing("3w"), xl: "0px" }, py: fr.spacing("9w") }}>
          <Typography
            component="h2"
            sx={{
              color: fr.colors.decisions.artwork.minor.blueCumulus.default,
              fontSize: { xs: "1.5rem", md: "2rem" },
              fontWeight: 700,
              mb: fr.spacing("6w"),
            }}
          >
            Ils parlent de nous !
          </Typography>
          <Grid container rowSpacing={4} sx={{ width: { xs: "100%", md: "66.6667%" }, mb: fr.spacing("12w") }}>
            {QUOTES.map((quote) => (
              <Quote key={quote.author} author={quote.author} text={quote.text} />
            ))}
          </Grid>
        </Container>
      </Box>
    </>
  );
}
