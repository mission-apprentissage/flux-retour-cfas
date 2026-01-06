import { Box, Container, Heading, ListItem, Text, UnorderedList, Link as ChakraLink } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";
import { SUPPORT_PAGE_ACCUEIL } from "shared";

import { PRODUCT_NAME } from "@/common/constants/product";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { BaseAccordionGroup } from "@/components/BaseAccordionGroup/BaseAccordionGroup";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Link from "@/components/Links/Link";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function QuestCeQueLeTdb() {
  const title = "Qu'est-ce-que le tableau de bord ?";

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb pages={[{ title: "Questions & réponses", path: "/questions-reponses" }, { title }]} />
          <Heading textStyle="h2" color="grey.800" mt={5}>
            Une question ? Quelques éléments de réponse.
          </Heading>
          <Box marginTop="2w">
            <Link href="/questions-reponses" isUnderlined>
              <Box as="i" className="ri-arrow-left-line" /> Revenir à la page principale
            </Link>
          </Box>

          <Section paddingY="4w">
            <Heading as="h2" fontSize="28px">
              Qu’est-ce que le {PRODUCT_NAME} ?
            </Heading>
            <BaseAccordionGroup
              AccordionItemsDetailList={[
                {
                  title: `Qu’est-ce que l’outil le ${PRODUCT_NAME} ?`,
                  content: (
                    <Box>
                      <Text>
                        Le {PRODUCT_NAME} est un produit créé par la Mission Interministérielle pour l’apprentissage.{" "}
                        <br />
                        Il permet de visualiser en temps réel les effectifs d’apprentis dans les centres de formation et
                        les organismes de formation, permettant aux pouvoirs publics de piloter au mieux la politique de
                        l’apprentissage nationalement et localement. <br />
                        Il est hébergé sur{" "}
                        <Link href="https://cfas.apprentissage.beta.gouv.fr" color="bluefrance" isUnderlined>
                          https://cfas.apprentissage.beta.gouv.fr <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Qu’est-ce que la mission interministérielle pour l’apprentissage ?",
                  content: (
                    <Box>
                      La mission pour l’apprentissage a pour but de :
                      <UnorderedList marginLeft="3w">
                        <ListItem>Rendre visibles les offres de formation et de contrats d’apprentissage ;</ListItem>
                        <ListItem>Sécuriser et fluidifier les inscriptions en apprentissage ;</ListItem>
                        <ListItem>Aider les jeunes à s’orienter ;</ListItem>
                        <ListItem>Aider les jeunes et les entreprises à se comprendre ;</ListItem>
                        <ListItem>Diminuer les ruptures des contrats d’apprentissage.</ListItem>
                      </UnorderedList>
                      <br />
                      Pour en savoir plus et connaître les autres produits et services de la mission,{" "}
                      <Link
                        href="https://mission-apprentissage.gitbook.io/general/la-mission-apprentissage/les-services-attendus-de-la-mission-apprentissage"
                        color="bluefrance"
                        isUnderlined
                        isExternal
                      >
                        consulter le Gitbook de la mission. <Box as="i" className="ri-links-line" />
                      </Link>
                    </Box>
                  ),
                },
                {
                  title: "Pour quels usages et quels utilisateurs a été conçu le tableau de bord ?",
                  content: (
                    <Box>
                      <Text>
                        Le {PRODUCT_NAME} a été conçu pour répondre aux besoins du ministère du Travail et du ministère
                        de l’Éducation Nationale, de l’Enseignement supérieur et de la Transformation publique, en terme
                        de visibilité sur les chiffres clés de l’apprentissage. <br />
                        Pour en savoir plus sur les utilisateurs du le {PRODUCT_NAME} , <br />
                        consultez{" "}
                        <Link href="/organisme-formation/aide" color="bluefrance" isUnderlined>
                          Qui peut consulter les données de votre organisme ? <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Quel est l’objectif du tableau de bord ?",
                  content: (
                    <Box>
                      <Text>
                        Le tableau de bord doit permettre aux pouvoir publics locaux et nationaux de piloter la
                        politique de l’apprentissage au plus juste de la réalité du terrain. Pour cela il doit fournir
                        des chiffres-clés de l’apprentissage exhaustifs, fiables et en temps réel pour représenter au
                        mieux la situation des organismes de formation, ainsi que celle des apprenantes et apprenants.
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Que recouvrent les chiffres clefs de l’apprentissage ?",
                  content: (
                    <Box>
                      <Text>
                        L’équipe du tableau de bord récolte des données permettant d’identifier, de fiabiliser et de
                        contrôler les données concernant les apprenantes et apprenants, les formations, les contrats et
                        les organismes de formation.
                        <br />
                        <br />
                        Aucune donnée n’est modifiée ou retraitée. Elles permettent d’identifier le nombre d’
                        “apprentis” (avec formation et contrat), de stagiaires de la formation professionnelle ou
                        “inscrits sans contrat” (inscrits en formation mais sans aucun contrat pour cette formation), de
                        “rupturants” (inscrits en formation avec un contrat rompu en attente d’un nouveau contrat),
                        “abandons” (ayant quitté la formation et l’employeur).
                        <br />
                        <br />
                        Pour en savoir plus, consulter la rubrique{" "}
                        <Link href="/comprendre-les-donnees" color="bluefrance" isUnderlined>
                          Comprendre les données <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Comment se construit le tableau de bord ? Puis-je y participer ?",
                  content: (
                    <Box>
                      <Text>
                        Le tableau de bord est un produit de la Mission Nationale pour le développement de
                        l’apprentissage, qui est incubée au sein de beta.gouv.
                        <br />
                        <br />
                        L’équipe du tableau de bord est organisée selon les principes de l’Agilité, elle fait évoluer le
                        produit tableau de bord en fonction des besoins des utilisateurs par cycles courts, elle délivre
                        de la valeur ou de nouvelles fonctionnalités à chaque itération. Cela permet de rester aligné
                        avec les besoins réels de visibilité sur les chiffres clés de l’apprentissage, des usages des
                        organismes de formation et la capacité de développement.
                        <br />
                        <br />
                        Cette méthodologie permet aussi d&apos;inclure tout au long du processus celles et ceux qui sont
                        concernés, que ce soit les organismes de formation ou les institutions (DREETS, Académies, etc).
                        Aussi si vous avez des retours à faire concernant le {PRODUCT_NAME} , l’équipe est à votre
                        écoute,
                        <br />
                        n’hésitez pas à nous contacter :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isUnderlined
                          isExternal
                        >
                          contactez-nous
                        </Link>
                        .
                      </Text>
                    </Box>
                  ),
                },
              ]}
            />
            <Heading marginTop="4w" as="h3" fontSize="beta" color="#000091">
              Si vous êtes organisme de formation (CFA ou UFA) :
            </Heading>
            <BaseAccordionGroup
              AccordionItemsDetailList={[
                {
                  title: "Pourquoi transmettre les données de votre organisme au tableau de bord ?",
                  content: (
                    <Box>
                      <Text>
                        Différentes institutions (DREETS, Académie, DGEFP) consultent le {PRODUCT_NAME} quotidiennement
                        pour suivre l&apos;évolution des effectifs. Ces données les éclairent notamment pour attribuer
                        des subventions, pour mettre en place des plans d’actions d’accompagnement des jeunes sans
                        contrat ou pour définir les politiques publiques d’aide à l’apprentissage.
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "La transmission des données au tableau de bord est-elle obligatoire ?",
                  content: (
                    <Box>
                      <Text>
                        En tant qu’opérateur d’une mission de service public, c’est une obligation légale au sens du
                        premier article de la loi pour une République numérique.
                        <br />
                        <br />
                        Le {PRODUCT_NAME} va devenir l’outil de référence des pouvoirs publics. À ce titre, certaines
                        régions utilisent déjà cet outil pour attribuer les aides aux centres de formation. Il est porté
                        par la DGEFP comme le futur outil de pilotage des politiques publiques de l’apprentissage. En ne
                        transmettant pas vos données, vous ne donnerez donc aucune visibilité sur votre réalité et sur
                        vos besoins en tant qu’organisme de formation.
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "La transmission des données au tableau de bord remplace-t-elle l’enquête SIFA ?",
                  content: (
                    <Box>
                      <Text>
                        À ce jour, transmettre vos données au tableau de bord ne vous dispense pas de remplir l’enquête
                        SIFA.
                        <br />
                        <br />
                        Une fois que les objectifs d’acquisition et de qualité des données seront atteints, de nouveaux
                        usages des données collectées pourront être étudiés.
                        <br />
                        Nous travaillons en collaboration avec l’ensemble des services publics, dont la DEPP qui
                        administre l’enquête SIFA.
                      </Text>
                    </Box>
                  ),
                },
              ]}
            />
            <Heading marginTop="4w" as="h3" fontSize="beta" color="#000091">
              Si vous êtes une institution :
            </Heading>
            <BaseAccordionGroup
              AccordionItemsDetailList={[
                {
                  title: "Quelles institutions ont accès aux données du tableau de bord ?",
                  content: (
                    <Box>
                      <Text>
                        Des institutions qui pilotent l&apos;apprentissage nationalement ou territorialement comme la
                        DREETS et l&apos;Académie par exemple.
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Comment demander un accès ?",
                  content: (
                    <Box>
                      <Text>
                        Vous pouvez effectuer une demande via le{" "}
                        <Link href="/auth/connexion" color="bluefrance" isUnderlined>
                          formulaire dédié <Box as="i" className="ri-links-line" />
                        </Link>{" "}
                        ou nous contacter :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isUnderlined
                          isExternal
                        >
                          contactez-nous
                        </Link>
                        <br />
                        <br />
                        Si vous êtes un organisme de formation,{" "}
                        <Link href="/organisme-formation" color="bluefrance" isUnderlined>
                          consultez la page dédiée <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: `Pourquoi consulter le ${PRODUCT_NAME} ?`,
                  content: (
                    <Box>
                      <Text>
                        Le {PRODUCT_NAME} vous donne de la visibilité sur les chiffres clés des organismes de formation
                        de l’apprentissage de votre région en temps réel, sans avoir besoin de solliciter ces
                        établissements. <br />
                        Si vous avez des besoins spécifiques liés par exemple à la cellule apprentissage locale, vous
                        pouvez nous contacter :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isUnderlined
                          isExternal
                        >
                          contactez-nous
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
              ]}
            />
            <Box marginTop="4w" marginBottom="4w">
              <ChakraLink
                fontSize="delta"
                borderBottom="1px solid"
                _hover={{ textDecoration: "none" }}
                onClick={() => scrollToTop()}
              >
                <Box as="i" className="ri-arrow-up-fill" /> Haut de page
              </ChakraLink>
            </Box>
          </Section>
        </Container>
      </Box>
    </Page>
  );
}
