import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  AspectRatio,
  Box,
  Container,
  Divider,
  Flex,
  HStack,
  Heading,
  ListItem,
  SimpleGrid,
  SystemProps,
  Text,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import { useState } from "react";
import { CRISP_FAQ, SUPPORT_PAGE_ACCUEIL } from "shared";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { BaseAccordionGroup } from "@/components/BaseAccordionGroup/BaseAccordionGroup";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import { VerbatimFrQuoteIcon } from "@/modules/dashboard/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const OperateursPublicsPage = () => {
  return (
    <SimplePage title="Opérateurs publics - Tableau de bord de l’apprentissage">
      <Container
        maxW="xl"
        py="16"
        display="flex"
        alignItems="center"
        gap="16"
        flexDirection={{ base: "column-reverse", md: "row" }}
      >
        <Box flex="3">
          <Heading as="h1" fontSize="xl">
            Opérateurs publics
          </Heading>
          <Heading as="h2" fontSize="40px" color="blue_cumulus_main" mt={4}>
            Pilotez l’apprentissage dans votre territoire
          </Heading>

          <Text fontSize="xl" mt={5}>
            L’accès au tableau de bord vous permet de prévenir le décrochage scolaire, et d’accompagner les apprenants
            en situation de rupture.
          </Text>

          <HStack gap={5} mt={5}>
            <Link variant="blueBg" href="/auth/inscription">
              Je m’inscris
            </Link>
            <Link variant="whiteBg" href="/auth/connexion">
              J’ai déjà un compte
            </Link>
          </HStack>
        </Box>
        <AspectRatio ratio={386 / 174} w={{ base: "100%", md: "386px" }}>
          <Image
            src="/images/landing-operateurs-publics.svg"
            alt="Graphique tableau de bord"
            sizes="(max-width: 768px) 100vw, 386px"
            fill
            priority
          />
        </AspectRatio>
      </Container>

      <Box bg="#F5F5FE">
        <Container
          maxW="xl"
          py="24"
          display="flex"
          alignItems="center"
          gap="16"
          flexDirection={{ base: "column-reverse", md: "row" }}
        >
          <Carousel
            images={[
              "/images/landing-operateurs-publics-slide1.webp",
              "/images/landing-operateurs-publics-slide2.webp",
              "/images/landing-operateurs-publics-slide3.webp",
            ]}
            flex="2"
          />

          <Box flex="3">
            <Heading as="h3" fontSize="32px" color="blue_cumulus_main">
              Des fonctionnalités utiles
            </Heading>
            <UnorderedList ml="30px !important" mt={4} fontSize="xl">
              <ListItem>
                une <strong>visibilité</strong> micro et macro sur la répartition des effectifs de l’apprentissage en
                France en temps réel
              </ListItem>
              <ListItem>
                de <strong>multiples filtres</strong> pour cibler les territoires, populations ou formations en
                difficulté
              </ListItem>
              <ListItem>
                une <strong>connaissance fine</strong> des répartitions par filière, par type de formation, etc. pour
                s’ajuster aux dynamiques socio-économiques des territoires
              </ListItem>
              <ListItem>
                des <strong>outils de visualisation de données</strong> pour rendre plus compréhensibles les chiffres
                collectés
              </ListItem>
            </UnorderedList>
          </Box>
        </Container>
      </Box>

      <Container maxW="xl">
        <Heading as="h3" fontSize="32px" color="blue_cumulus_main" mt={16}>
          Des indicateurs précis retraçant le parcours de l’apprenant
        </Heading>
        <Text fontSize="xl" mt={5}>
          Le tableau de bord restitue les <strong>indicateurs liés aux étapes-clés</strong> du parcours d’un apprenant,
          de l’expression des vœux jusqu’à sa sortie d’apprentissage.
        </Text>
        <AspectRatio ratio={78 / 35} w="100%" mt={8}>
          <Image src="/images/landing-operateurs-publics-parcours.svg" alt="Parcours apprenant" fill />
        </AspectRatio>

        <Divider size="md" my={16} borderBottomWidth="2px" opacity="1" />

        <Heading as="h3" fontSize="2xl" color="blue_cumulus_main">
          Ils utilisent le tableau de bord...
        </Heading>
        <SimpleGrid columns={{ sm: 1, md: 2 }} mt={8} mb={12} rowGap={4}>
          <Box borderLeft="1px solid #DDDDDD" px={6}>
            <VerbatimFrQuoteIcon />
            <Text fontWeight="bold" fontStyle="italic" fontSize="xl" mt={4}>
              «&nbsp;Grâce à la mensualisation des données sur le tableau de bord, j’ai pu objectiver et vérifier la
              situation des CFA de ma région sur plusieurs mois.&nbsp;»
            </Text>
            <Text fontWeight="bold" color="#3A3A3A" mt={4}>
              Conseil Régional de Normandie
            </Text>
          </Box>
          <Box borderLeft="1px solid #DDDDDD" px={6}>
            <VerbatimFrQuoteIcon />
            <Text fontWeight="bold" fontStyle="italic" fontSize="xl" mt={4}>
              «&nbsp;Le tableau de bord offre la possibilité aux services déconcentrés de l’Etat de se saisir pleinement
              du rôle d’animation et de relai qui est attendu d’eux au niveau local.&nbsp;»
            </Text>
            <Text fontWeight="bold" color="#3A3A3A" mt={4}>
              DREETS Nouvelle-Aquitaine
            </Text>
          </Box>
        </SimpleGrid>
      </Container>

      <Box bg="#F9F8F6">
        <Container maxW="xl" py="14">
          <Heading as="h3" fontSize="32px" color="blue_cumulus_main">
            Des questions ?
          </Heading>
          <BaseAccordionGroup
            AccordionItemsDetailList={[
              {
                title: "Pourquoi consulter le tableau de bord de l’apprentissage ?",
                content: (
                  <Text>
                    Le tableau de bord de l’apprentissage vous donne de la visibilité sur les chiffres clés des
                    organismes de formation de l’apprentissage de votre territoire en temps réel, sans avoir besoin de
                    solliciter ces établissements.
                    <br />
                    Depuis votre compte tableau de bord, vous accédez à différentes vues, données et filtres pour vous
                    permettre d’analyser la situation de l’apprentissage sur votre territoire.
                    <br />
                    Vous pouvez également télécharger des listes de données pour travailler avec les acteurs locaux
                    (notamment pour lutter contre le décrochage scolaire).
                  </Text>
                ),
              },
              {
                title: "Comment obtenir la liste des données nominatives des apprenants ?",
                content: (
                  <Text>
                    En se connectant sur l’espace tableau de bord, dans l’onglet &quot;Mes indicateurs&quot;, certains
                    d’entre-vous DR(I)EETS, DRAAF et DDETS auront accès aux listes nominatives des apprenants sans
                    contrat ou rupturants sous le format .xls afin d’identifier et soutenir les jeunes en difficulté.
                    <br />
                    Les usagers Carif-Oref, Conseils régionaux et Académies pourront s’adresser aux DR(I)EETS de leur
                    territoire pour les obtenir.
                  </Text>
                ),
              },
              {
                title: "Puis-je partager mon compte tableau de bord à l’un de mes collaborateurs ?",
                content: (
                  <Text>
                    L’accès au tableau de bord s’effectue par une connexion à un compte nominatif. Le compte est
                    nominatif quelle que soit votre fonction et votre structure (Académie, DREETS, …).
                    <br />
                    Pour des raisons de sécurité des données, il n’est pas recommandé de partager votre compte à l’un de
                    vos collaborateurs.
                    <br />
                    Si l’un d’eux a besoin d’accéder au tableau de bord, invitez-le plutôt à s’inscrire et à créer son
                    propre compte.
                  </Text>
                ),
              },
              {
                title: <>J’ai constaté une anomalie sur mon espace&nbsp;: comment la partager au tableau de bord ?</>,
                content: (
                  <>
                    <Text>Certains écarts peuvent être notamment dus&nbsp;:</Text>

                    <UnorderedList>
                      <ListItem>à une erreur de saisie à la source ;</ListItem>
                      <ListItem>à une absence de mise à jour du statut de l’apprenant à la source ;</ListItem>
                      <ListItem>au délai de mise à jour de la donnée ;</ListItem>
                      <ListItem>
                        à des pratiques de saisie observées chez certains utilisateurs (par exemple, concernant les
                        abandons, il se peut simplement que l’apprenant ait arrêté l’apprentissage faute de contrat pour
                        poursuive sa formation en voie scolaire ; concernant les jeunes sans contrat, certains ne sont
                        pas comptabilisés car certains organismes n’inscrivent les élèves que lorsqu’ils ont un contrat)
                        ;
                      </ListItem>
                      <ListItem>
                        à la transmission des effectifs par un organisme formateur avec l’UAI de l’organisme responsable
                        ou responsable-formateur (lequel peut constater un écart entre la totalité des effectifs de ses
                        formateurs et ce qu’il voit car les données sont transmises par tout ou partie des formateurs).
                      </ListItem>
                    </UnorderedList>

                    <Text>
                      Aidez-nous à améliorer le tableau de bord et ses données en nous faisant part des erreurs que vous
                      constatez :{" "}
                      <Link
                        href={SUPPORT_PAGE_ACCUEIL}
                        target="_blank"
                        rel="noopener noreferrer"
                        whiteSpace="nowrap"
                        color="action-high-blue-france"
                        borderBottom="1px"
                        _hover={{ textDecoration: "none" }}
                      >
                        contactez-nous
                      </Link>
                      .
                    </Text>
                  </>
                ),
              },
              {
                title: (
                  <>
                    Je constate un taux de transmission faible des organismes de mon territoire&nbsp;: comment puis-je
                    l’améliorer ?
                  </>
                ),
                content: (
                  <Text>
                    Le tableau de bord de l’apprentissage est une plateforme en construction qui s’appuie sur ses
                    utilisateurs pour améliorer notamment le taux de transmission des organismes de formation.
                    <br />
                    Chaque opérateur public peut, sur son espace, visualiser les organismes de son territoire qui ne
                    transmettent pas et les contacter pour les encourager.
                    <br />
                    L’équipe du tableau de bord vous accompagne dans ces démarches :{" "}
                    <Link
                      href={SUPPORT_PAGE_ACCUEIL}
                      target="_blank"
                      rel="noopener noreferrer"
                      whiteSpace="nowrap"
                      color="action-high-blue-france"
                      borderBottom="1px"
                      _hover={{ textDecoration: "none" }}
                    >
                      contactez-nous
                    </Link>
                    .
                  </Text>
                ),
              },
            ]}
          />

          <Link
            href={CRISP_FAQ}
            color="action-high-blue-france"
            borderBottom="1px"
            textDecoration="none"
            _hover={{ textDecoration: "none" }}
            isExternal
            display="inline-block"
            mt={8}
          >
            <ArrowForwardIcon mr={1} />
            Voir davantage de questions
          </Link>
        </Container>
      </Box>

      <Container
        maxW="1024px"
        bg="#F5F5FE"
        px="14"
        py="10"
        my="20"
        display="flex"
        alignItems="center"
        gap="16"
        flexDirection={{ base: "column-reverse", md: "row" }}
      >
        <Box flex="3">
          <Heading as="h3" fontSize="2xl" color="blue_cumulus_main">
            Faisons bien plus ensemble !
          </Heading>
          <Text mt={4} fontSize="sm">
            Aidez notre équipe à améliorer le tableau de bord de l’apprentissage.
            <br />
            Vos contributions nous permettent de faire évoluer cet outil au plus près de vos besoins.
            <br />
            Rejoignez la communauté des bêta-testeurs et contribuez en participant à des échanges sur les pratiques, des
            tests...
          </Text>
          <Link variant="blueBg" href={SUPPORT_PAGE_ACCUEIL} target="_blank" rel="noopener noreferrer" mt={4}>
            Rejoindre la communauté
          </Link>
        </Box>

        <AspectRatio ratio={227 / 114} w={{ base: "100%", md: "227px" }}>
          <Image
            src="/images/landing-operateurs-publics-beta-testeurs.svg"
            alt="Beta-testeurs du tableau de bord"
            sizes="(max-width: 768px) 100vw, 227px"
            fill
            priority
          />
        </AspectRatio>
      </Container>
    </SimplePage>
  );
};

export default OperateursPublicsPage;

interface CarouselProps extends SystemProps {
  images: string[];
}
function Carousel({ images, ...props }: CarouselProps) {
  const [activePageIndex, setActivePageIndex] = useState(0);
  return (
    <VStack gap={4} {...props}>
      <Box overflow="hidden" w="450px">
        <Flex transform={`translateX(${-activePageIndex * 100}%)`} transition=".3s transform">
          {images.map((image, index) => (
            <AspectRatio
              key={index}
              ratio={450 / 300}
              w={{ base: "100%", md: "450px" }}
              flexShrink={0}
              onClick={() => setActivePageIndex((index + 1) % images.length)}
              cursor="pointer"
            >
              <Image
                src={image}
                alt={`Capture d'écran du tableau de bord ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 450px"
              />
            </AspectRatio>
          ))}
        </Flex>
      </Box>

      <HStack>
        {images.map((_, index) => (
          <Box
            key={index}
            onClick={() => setActivePageIndex(index)}
            w="10px"
            h="10px"
            border="1px solid #3558A2"
            borderRadius="50%"
            bg={index === activePageIndex ? "#3558A2" : undefined}
            cursor="pointer"
          />
        ))}
      </HStack>
    </VStack>
  );
}
