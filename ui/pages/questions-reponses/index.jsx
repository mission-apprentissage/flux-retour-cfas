import React from "react";
import Head from "next/head";
import { Box, Container, Heading, HStack, Text, UnorderedList, ListItem } from "@chakra-ui/react";
import { Page, Section, Tuile } from "../../components";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";
import { DataVisualisation, Notification, TechnicalError } from "../../theme/components/icons";
import { getAuthServerSideProps } from "../../common/SSR/getAuthServerSideProps";
import Link from "../../components/Links/Link";
import { BaseAccordionGroup } from "../../components/BaseAccordionGroup/BaseAccordionGroup";
import { CONTACT_ADDRESS } from "../../common/constants/product";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function QuestionsReponses() {
  const title = "Questions & réponses";
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
          <Heading textStyle="h2" color="grey.800" mt={5}>
            Une question ? Quelques éléments de réponse.
          </Heading>
          <Section paddingY="4w">
            <HStack spacing="2w">
              <Tuile>
                <Box as={Link} href={"/questions-reponses/qu-est-ce-que-le-tableau-de-bord"}>
                  <DataVisualisation width="80px" height="80px" marginX="auto" display="block" />
                  <Text marginTop="2w" color="#161616" fontWeight="700" textAlign="center">
                    Qu’est-ce que le Tableau de bord de l’apprentissage ?
                  </Text>
                </Box>
              </Tuile>
              <Tuile>
                <Box as={Link} href={"/questions-reponses/comment-fonctionne-le-tableau-de-bord"}>
                  <TechnicalError width="80px" height="80px" marginX="auto" display="block" />
                  <Text marginTop="2w" color="#161616" fontWeight="700" textAlign="center">
                    Comment fonctionne le Tableau de bord ?
                  </Text>
                </Box>
              </Tuile>
              <Tuile>
                <Box as={Link} href={"/questions-reponses/contacter-l-equipe"}>
                  <Notification width="80px" height="80px" marginX="auto" display="block" />
                  <Text marginTop="2w" color="#161616" fontWeight="700" textAlign="center">
                    Contacter l’équipe du Tableau de bord
                  </Text>
                </Box>
              </Tuile>
            </HStack>
            <Heading as="h2" fontSize="28px" marginTop="4w">
              Questions fréquemment posées
            </Heading>
            <Box width="70%">
              <BaseAccordionGroup
                AccordionItemsDetailList={[
                  {
                    title: "Pourquoi transmettre les données de votre organisme au Tableau de bord ?",
                    content: (
                      <Box>
                        Différentes institutions (Conseil Régional, DREETS, DRAAF, Carif Oref, Académie, DGEFP)
                        consultent le Tableau de Bord de l&apos;Apprentissage quotidiennement pour suivre l’évolution
                        des effectifs. Ces données les éclairent notamment pour attribuer des subventions, pour mettre
                        en place des plans d’actions d’accompagnement des jeunes sans contrat ou pour définir les
                        politiques publiques d’aide à l’apprentissage.
                      </Box>
                    ),
                  },
                  {
                    title: "Pour quels usages et quels utilisateurs a été conçu le Tableau de bord ?",
                    content: (
                      <Box>
                        <Text>
                          Le Tableau de bord de l’apprentissage a été conçu pour répondre aux besoins du ministère du
                          Travail et du ministère de l’Éducation Nationale, de l’Enseignement supérieur et de la
                          Transformation publique, en terme de visibilité sur les chiffres clés de l’apprentissage.{" "}
                          <br /> <br />
                          Pour en savoir plus sur les utilisateurs du Tableau de bord de l’apprentissage, consultez{" "}
                          <Link href="/organisme-formation/aide" color="bluefrance" textDecoration="underLine">
                            Qui peut consulter les données de votre organisme ? <Box as="i" className="ri--link-line" />{" "}
                          </Link>
                        </Text>
                      </Box>
                    ),
                  },
                  {
                    title: "Quelles institutions ont accès aux données du Tableau de bord ?",
                    content: (
                      <Box>
                        <Text>
                          Des institutions qui pilotent l’Apprentissage nationalement ou territorialement comme la
                          DREETS, la DRAAF, le Conseil Régional, l’Académie et le Carif Oref par exemple.
                        </Text>
                      </Box>
                    ),
                  },
                  {
                    title: "Je suis un organisme de formation, comment transmettre ?",
                    content: (
                      <Box>
                        <UnorderedList>
                          <ListItem>
                            Si vous utilisez les ERP suivants : Gesti, Ymag, SC Form, Formasup, FCA Manager ou Auriga,
                            un simple paramétrage suffit pour vous brancher au Tableau de Bord. La démarche n’est à
                            faire qu’une seule fois et est estimée à 10 minutes. Pour ce faire, [sélectionner l’ERP que
                            vous utilisez] et
                            <Link href="/organisme-formation/transmettre" color="bluefrance" textDecoration="underLine">
                              {" "}
                              téléchargez le pas à pas correspondant <Box as="i" className="ri--link-line" />
                            </Link>
                          </ListItem>
                          <ListItem marginTop="1v">
                            Si vous utilisez les ERP suivants : CNAM (Gessic@), Alcuin Software, Hyperplanning,
                            Valsoftware, Agate Les travaux de développement sont en cours, vous pourrez prochainement
                            transmettre directement via votre ERP, n’hésitez pas à nous transmettre vos coordonnées pour
                            que nous vous tenions informés dès que cette fonctionnalité sera disponible :{" "}
                            <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                              tableau-de-bord@apprentissage.beta.gouv.fr
                            </Link>
                          </ListItem>
                          <ListItem marginTop="1v">
                            Si vous n’utilisez aucun de ces logiciels, nous travaillons à une solution gratuite et
                            simple pour transmettre vos données et répondre à l’obligation légale de données de la
                            visibilité aux acteurs publics, celle-ci vous sera proposée dès le quatrième trimestre 2022.
                            Nous avons besoin d’organismes pour tester cette solution, pour vous inscrire ou simplement
                            pour être informé de l’ouverture de ce service, n’hésitez pas à nous contacter :{" "}
                            <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                              tableau-de-bord@apprentissage.beta.gouv.fr
                            </Link>
                          </ListItem>
                        </UnorderedList>
                      </Box>
                    ),
                  },
                  {
                    title: "La transmission des données au Tableau de bord remplace-t-elle l'enquête SIFA ?",
                    content: (
                      <Box>
                        <Text>
                          À ce jour, transmettre vos données au Tableau de bord ne vous dispense pas de remplir
                          l’enquête SIFA.
                          <br />
                          <br />
                          Une fois que les objectifs d’acquisition et de qualité des données seront atteints, de
                          nouveaux usages des données collectées pourront être étudiés. Nous travaillons en
                          collaboration avec l’ensemble des services publics, dont la DEPP qui administre l’enquête
                          SIFA.
                        </Text>
                      </Box>
                    ),
                  },
                ]}
              />
            </Box>
          </Section>
        </Container>
      </Box>
    </Page>
  );
}
