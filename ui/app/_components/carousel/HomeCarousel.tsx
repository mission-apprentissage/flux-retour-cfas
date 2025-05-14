"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState, useCallback, memo } from "react";

const SLIDES = [
  {
    image: "/images/home/slide1.png",
    alt: "Capture écran TDB",
    heading: "Des fonctionnalités utiles",
    title: "Identifier facilement les jeunes en rupture",
    bulletsTitle: null,
    bullets: [
      <>
        Accédez à une liste <strong>claire et actualisée</strong> des jeunes en rupture de contrat d&apos;apprentissage.
      </>,
      <>
        <strong>Les jeunes sont regroupés par mois de rupture</strong> pour faciliter les prises de contact.
      </>,
      <>
        Vous pouvez <strong>rechercher par nom ou prénom</strong> pour retrouver rapidement un jeune.
      </>,
    ],
  },
  {
    image: "/images/home/slide2.png",
    alt: "Capture écran TDB - 2",
    heading: "Des fonctionnalités utiles",
    title: "Prioriser les jeunes de 16 à 18 ans ou ceux nécessitant un accompagnement rapide",
    bulletsTitle: "Le TBA met en avant :",
    bullets: [
      <>
        <strong>Les jeunes âgés de 16 à 18 ans</strong> (soumis à l&apos;obligation de formation).
      </>,
      <>
        <strong>Les jeunes en situation de handicap (RQTH)</strong>.
      </>,
      <>
        <strong>Les jeunes ayant explicitement signalé un besoin d&apos;accompagnement</strong>.
      </>,
    ],
  },
  {
    image: "/images/home/slide3.png",
    alt: "Capture écran TDB - 3",
    heading: "Des fonctionnalités utiles",
    title: "Disposer de toutes les informations utiles pour démarrer l'accompagnement",
    bulletsTitle: "Pour chaque jeune vous retrouvez :",
    bullets: [
      <>
        <strong>Ses coordonnées :</strong> téléphone, email.
      </>,
      <>
        <strong>Les coordonnées de son OFA :</strong> pour faciliter la prise de contact.
      </>,
      <>
        <strong>Les détails du contrat :</strong> date de début, date de rupture, formation suivie.
      </>,
    ],
  },
];

const SLIDE_BACKGROUNDS = [
  fr.colors.decisions.background.alt.blueFrance.default,
  fr.colors.decisions.background.alt.orangeTerreBattue.default,
  fr.colors.decisions.background.alt.yellowTournesol.default,
];

interface Slide {
  image: string;
  alt: string;
  heading: string;
  title: string;
  bulletsTitle: string | null;
  bullets: JSX.Element[];
}

const SlideContent = memo(({ slide }: { slide: Slide }) => (
  <Stack
    spacing={fr.spacing("3w")}
    sx={{
      flexBasis: { md: "50%" },
      pt: fr.spacing("4w"),
    }}
  >
    <Typography
      variant="h3"
      sx={{
        fontSize: { xs: "1.5rem", md: "2rem" },
        color: fr.colors.decisions.text.actionHigh.blueFrance.default,
      }}
    >
      {slide.heading}
    </Typography>
    <Typography variant="h5" sx={{ fontSize: "1.25rem", fontWeight: 700 }}>
      {slide.title}
    </Typography>
    <Stack alignItems="flex-start" sx={{ color: fr.colors.decisions.text.default.grey.default }}>
      {slide.bulletsTitle && <Typography sx={{ fontSize: "1rem" }}>{slide.bulletsTitle}</Typography>}
      <Box component="ul" sx={{ pl: fr.spacing("2w"), m: 0 }}>
        {slide.bullets.map((bullet, i) => (
          <Box component="li" key={i} sx={{ color: fr.colors.decisions.text.default.grey.default }}>
            <Typography sx={{ fontSize: "1rem" }}>{bullet}</Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  </Stack>
));

SlideContent.displayName = "SlideContent";

interface SlideNavigationProps {
  activeIndex: number;
  goToSlide: (index: number) => void;
  slidesCount: number;
}

const SlideNavigation = memo(({ activeIndex, goToSlide, slidesCount }: SlideNavigationProps) => (
  <Stack
    direction="row"
    spacing={1}
    justifyContent={{ xs: "center", md: "flex-start" }}
    sx={{
      position: "absolute",
      bottom: fr.spacing("4w"),
      left: { xs: "50%", md: "50%" },
      transform: { xs: "translateX(-50%)", md: "none" },
    }}
  >
    {Array.from({ length: slidesCount }).map((_, idx) => (
      <Box
        key={idx}
        component="button"
        onClick={() => goToSlide(idx)}
        sx={{
          width: 16,
          height: 16,
          p: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: `2px solid ${fr.colors.decisions.text.actionHigh.blueFrance.default}`,
          backgroundColor: "transparent",
          cursor: "pointer",
        }}
      >
        {activeIndex === idx && (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: fr.colors.decisions.text.actionHigh.blueFrance.default,
            }}
          />
        )}
      </Box>
    ))}
  </Stack>
));

SlideNavigation.displayName = "SlideNavigation";

const FADE_TIMEOUT = 500;
const SLIDE_INTERVAL = 8000;

export function HomeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const goToSlide = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      setVisible(false);
      setTimeout(() => {
        setActiveIndex(index);
        setVisible(true);
      }, FADE_TIMEOUT);
    },
    [activeIndex]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIndex((idx) => (idx + 1) % SLIDES.length);
        setVisible(true);
      }, FADE_TIMEOUT);
    }, SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const currentSlide = SLIDES[activeIndex];
  const currentBackground = SLIDE_BACKGROUNDS[activeIndex];

  return (
    <Box
      sx={{
        backgroundColor: currentBackground,
        transition: "background-color 0.5s ease-in-out",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          pt: { xs: fr.spacing("9w") },
          pb: { xs: fr.spacing("9w"), md: 0 },
          px: { xs: fr.spacing("3w"), xl: "0px" },
        }}
      >
        <Box
          sx={{
            overflow: "hidden",
            height: { xs: "auto", md: 400 },
          }}
        >
          <Fade in={visible} timeout={FADE_TIMEOUT}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "flex-start",
                justifyContent: "center",
                height: "100%",
                p: 0,
              }}
            >
              <Box
                component="img"
                src={currentSlide.image}
                alt={currentSlide.alt}
                sx={{
                  flexBasis: { md: "0%" },
                  width: { xs: "100%", md: "auto" },
                  maxWidth: { md: "100%" },
                  height: { xs: "auto", md: 400 },
                  objectFit: "contain",
                  alignSelf: "flex-start",
                  marginRight: "auto",
                  display: "block",
                }}
              />
              <SlideContent slide={currentSlide} />
            </Box>
          </Fade>
        </Box>

        <SlideNavigation activeIndex={activeIndex} goToSlide={goToSlide} slidesCount={SLIDES.length} />
      </Container>
    </Box>
  );
}
