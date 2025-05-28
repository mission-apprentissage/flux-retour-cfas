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

          <figure role="group" className="fr-content-media">
            <iframe
              title="Titre de l'iframe"
              className="fr-responsive-vid"
              src="https://www.youtube.com/embed/Al8aSdWTw94?si=QcyOIYjfsVZWUEGj"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>

            <figcaption className="fr-content-media__caption">
              Témoignages des Missions Locales / Mission interministérielle pour l&apos;apprentissage
              <a className="fr-link" href="https://www.youtube.com/watch?v=Al8aSdWTw94">
                https://www.youtube.com/watch?v=Al8aSdWTw94
              </a>
            </figcaption>

            <div className="fr-transcription" id="transcription-2160">
              <button
                className="fr-transcription__btn"
                aria-expanded="false"
                aria-controls="fr-transcription-collapse-transcription-2160"
                data-fr-js-collapse-button="true"
              >
                Transcription
              </button>

              <div className="fr-collapse" id="fr-transcription-collapse-transcription-2160" data-fr-js-collapse="true">
                <div className="fr-transcription__footer">
                  <div className="fr-transcription__actions-group">
                    <button
                      className="fr-btn--fullscreen fr-btn"
                      aria-controls="fr-transcription-modal-transcription-2160"
                      aria-label="Agrandir la transcription"
                      data-fr-opened="false"
                      id="button-2163"
                      data-fr-js-modal-button="true"
                    >
                      Agrandir
                    </button>
                  </div>
                </div>

                <div
                  id="fr-transcription-modal-transcription-2160"
                  className="fr-modal"
                  aria-labelledby="fr-transcription-modal-transcription-2160-title"
                  data-fr-js-modal="true"
                >
                  <div className="fr-container fr-container--fluid fr-container-md">
                    <div className="fr-grid-row fr-grid-row--center">
                      <div className="fr-col-12 fr-col-md-10 fr-col-lg-8">
                        <div className="fr-modal__body" data-fr-js-modal-body="true">
                          <div className="fr-modal__header">
                            <button
                              className="fr-btn--close fr-btn"
                              aria-controls="fr-transcription-modal-transcription-2160"
                              id="button-2164"
                              title="Fermer"
                              data-fr-js-modal-button="true"
                            >
                              Fermer
                            </button>
                          </div>

                          <div className="fr-modal__content">
                            <h1 id="fr-transcription-modal-transcription-2160-title" className="fr-modal__title">
                              Témoignages des Missions Locales
                            </h1>

                            <div>
                              <p>
                                Avant le lancement de notre service numérique, Alexandra Delohen, chargée de projet
                                &quot;Relations Réseau et Partenaires&quot; à la Mission Locale Technowest
                                Nouvelle-Aquitaine, et Carole Hyreza, responsable du pôle &quot;Entreprises et
                                Anticipations des Mutations Économiques&quot; à la Mission Locale Insertion Formation
                                Emploi du Grand Amiénois, nous ont partagé les difficultés rencontrées pour repérer les
                                jeunes en rupture de contrat d’apprentissage.
                              </p>

                              <p>
                                Elles partagent le même constat : notre service numérique permet principalement
                                d’identifier des jeunes en rupture que la Mission locale ne connaît pas encore :
                              </p>

                              <p>
                                &quot;Il y a beaucoup de jeunes qu&apos;on connaissait, mais on n&apos;avait pas
                                forcément eu l&apos;information qui nous disait que ce jeune avait rompu, parce que pour
                                certains, là : le dernier c&apos;était novembre, on est aujourd&apos;hui le 29 avril,
                                donc voilà, c&apos;est cette information là. Et à peu près 75% sur cette liste de 215,
                                ce sont des jeunes qui ne connaissaient pas la Mission Locale a priori, puisqu&apos;en
                                fait, ils n&apos;étaient pas dans notre base de données.
                                <br />
                                Mais on a également accès aux jeunes rupturants qui ne connaissent pas forcément la
                                Mission Locale, ou qui n&apos;ont jamais été inscrits à la Mission Locale. Et de ce
                                fait, ça nous permet de prendre contact avec eux, et de leur proposer un accompagnement
                                Mission Locale pour les aider dans leur recherche d&apos;un nouveau contrat.&quot;
                              </p>

                              <p>
                                Au-delà de ce repérage, Thibaut Cléry, référent &quot;Formation et Alternance&quot; à la
                                Mission Locale du Beauvaisis, mentionne un autre avantage de notre service numérique :
                                celui de multiplier les interactions avec les CFA :
                              </p>

                              <p>
                                &quot;C&apos;était d&apos;abord… de peut-être beaucoup plus interagir, en tout cas
                                facilement, avec un certain nombre de CFA. Ça démultiplie les échanges, en tout cas,
                                avec les CFA, pour dire : « Bah tiens, j&apos;ai ce jeune là qui apparaît,
                                qu&apos;est-ce que tu en penses ? Où est-ce qu&apos;on en est ? » Lui allumer la lumière
                                en disant : « N&apos;oublie pas de nous l&apos;orienter, au cas où ». Ça permet de
                                rappeler aussi les bonnes pratiques, qu&apos;on utilise avec un certain nombre de CFA.
                                Donc ça, c&apos;est vraiment un plus pour nous.&quot;
                              </p>

                              <p>
                                À la question : « Recommanderiez-vous notre service public numérique ? », la réponse est
                                unanime : oui. Plébiscité pour sa facilité d’utilisation et son utilité dans
                                l’accompagnement des jeunes, notre service a convaincu les Missions Locales qui l’ont
                                expérimenté. Cette expérience positive les conduit aujourd’hui à envisager un engagement
                                à long terme dans le déploiement du service :
                              </p>

                              <p>
                                &quot;Je vais être directe avec vous, nous, on souhaite continuer en tout cas
                                l&apos;expérimentation, et continuer la démarche avec vous. Même si au début, quand on a
                                commencé l&apos;expérimentation, on s&apos;est retrouvés avec 150 jeunes à contacter, ça
                                nous a un peu semblé beaucoup sur le moment. Mais finalement, on a trouvé une
                                organisation, une articulation qui nous a permis de contacter tous les jeunes et puis
                                d&apos;obtenir des rendez-vous.&quot;
                              </p>

                              <p>
                                &quot;Je recommande vivement, et j&apos;ai déjà recommandé à mon collègue, qui
                                n&apos;est pas très loin et qui est entré dans l&apos;expérimentation il y a 3 semaines.
                                Donc oui je pense que c&apos;est un outil qu&apos;il faut généraliser certes, après il y
                                a peut-être des Missions Locales qui n&apos;auront pas forcément le temps ou les moyens
                                humains de pouvoir le gérer. Comme je disais, il faut y aller tous les 2-3 jours, ça se
                                met à jour régulièrement, donc pour être réactif au niveau des jeunes, il faut quand
                                même qu&apos;on ait l&apos;information assez tôt. Dès sa rupture de contrat, il faut
                                qu&apos;on aille le plus vite possible pour pouvoir le raccrocher.&quot;
                              </p>

                              <p>
                                Vous êtes un CFA ou une Mission Locale ? Engageons une collaboration durable pour
                                soutenir l’insertion des apprentis !
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </figure>

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
