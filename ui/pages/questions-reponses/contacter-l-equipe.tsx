import { Box, Container, Heading, Text } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";
import { SUPPORT_PAGE_ACCUEIL } from "shared";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { BaseAccordionGroup } from "@/components/BaseAccordionGroup/BaseAccordionGroup";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Link from "@/components/Links/Link";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function ContacterLequipeDuTdb() {
  const title = "Contacter l'équipe du tableau de bord";

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
              Contacter l’équipe
            </Heading>
            <BaseAccordionGroup
              AccordionItemsDetailList={[
                {
                  title:
                    "J’ai constaté une erreur dans les chiffres affichés ou les informations concernant un établissement",
                  content: (
                    <Box>
                      <Text>
                        Si vous êtes un organisme de formation, vérifiez le paramétrage du logiciel de gestion que vous
                        utilisez, si celui-ci est correct ou si vous avez un doute contactez nous :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isExternal
                          isUnderlined
                        >
                          contactez-nous
                        </Link>
                        .
                      </Text>
                    </Box>
                  ),
                },
                {
                  title:
                    "Je souhaite participer à un test ou rejoindre la communauté de Beta Testeuses et Beta Testeurs",
                  content: (
                    <Box>
                      <Text>
                        Merci de votre implication, nous avons régulièrement des tests en cours afin d’améliorer notre
                        produit, n’hésitez pas à nous écrire :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isExternal
                          isUnderlined
                        >
                          contactez-nous
                        </Link>
                        .
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Je ne trouve pas la réponse à ma question ?",
                  content: (
                    <Box>
                      <Text>
                        Cette page d’aide n’est pas exhaustive et sera enrichie grâce à vos questions et vos retours.
                        Vous pouvez nous contacter via le chat lorsqu’il est disponible (en bas à gauche de votre écran)
                        ou nous contacter :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isExternal
                          isUnderlined
                        >
                          contactez-nous
                        </Link>
                        .
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Je souhaite contacter l’équipe du tableau de bord",
                  content: (
                    <Box>
                      <Text>
                        Vous pouvez nous contacter via le chat lorsqu’il est disponible (en bas à gauche de votre écran)
                        ou nous contacter :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isExternal
                          isUnderlined
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
          </Section>
        </Container>
      </Box>
    </Page>
  );
}
