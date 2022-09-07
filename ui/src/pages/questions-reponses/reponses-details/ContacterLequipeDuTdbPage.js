import { Box, Heading, Link, Text } from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";

import { BreadcrumbNav, Page, Section } from "../../../common/components";
import { BaseAccordion } from "../../../common/components/BaseAccordion/BaseAccordion";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import { CONTACT_ADDRESS } from "../../../common/constants/product";

const ContacterLequipeDuTdbPage = () => {
  return (
    <Page>
      <Section paddingY="4w" withShadow>
        <BreadcrumbNav
          links={[
            NAVIGATION_PAGES.Accueil,
            NAVIGATION_PAGES.QuestionsReponses,
            NAVIGATION_PAGES.QuestionsReponses.ContacterLequipeDuTdb,
          ]}
        />
      </Section>

      <Section>
        <Heading as="h1" fontSize="alpha">
          Une question ? Quelques éléments de réponse.
        </Heading>
        <Box marginTop="2w">
          <Link
            as={NavLink}
            to={NAVIGATION_PAGES.QuestionsReponses.path}
            borderBottom="1px solid"
            _hover={{ textDecoration: "none" }}
          >
            <Box as="i" className="ri-arrow-left-line" /> Revenir à la page principale
          </Link>
        </Box>
      </Section>

      <Section paddingY="4w">
        <Heading as="h2" fontSize="28px">
          Contacter l’équipe
        </Heading>
        <BaseAccordion
          AccordionItemsDetailList={[
            {
              title:
                "J’ai constaté une erreur dans les chiffres affichés ou les informations concernant un établissement",
              content: (
                <Box>
                  <Text>
                    Si vous êtes un organisme de formation, vérifiez le paramétrage du logiciel de gestion que vous
                    utilisez, si celui-ci est correct ou si vous avez un doute contactez nous par courriel :{" "}
                    <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                      {CONTACT_ADDRESS}
                    </Link>
                  </Text>
                </Box>
              ),
            },
            {
              title: "Je souhaite participer à un test ou rejoindre la communauté de Beta Testeuses et Beta Testeurs",
              content: (
                <Box>
                  <Text>
                    Merci de votre implication, nous avons régulièrement des tests en cours afin d’améliorer notre
                    produit, n’hésitez pas à nous écrire :{" "}
                    <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                      {CONTACT_ADDRESS}
                    </Link>
                  </Text>
                </Box>
              ),
            },
            {
              title: "Je ne trouve pas la réponse à ma question ?",
              content: (
                <Box>
                  <Text>
                    Cette page d’aide n’est pas exhaustive et sera enrichie grâce à vos questions et vos retours. Vous
                    pouvez nous contacter via le chat lorsqu’il est disponible (en bas à gauche de votre écran) ou par
                    courriel :{" "}
                    <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                      {CONTACT_ADDRESS}
                    </Link>
                  </Text>
                </Box>
              ),
            },
            {
              title: "Je souhaite contacter l’équipe du Tableau de bord",
              content: (
                <Box>
                  <Text>
                    Vous pouvez nous contacter via le chat lorsqu’il est disponible (en bas à gauche de votre écran) ou
                    par courriel :{" "}
                    <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                      {CONTACT_ADDRESS}
                    </Link>
                  </Text>
                </Box>
              ),
            },
          ]}
        />
      </Section>
    </Page>
  );
};

export default ContacterLequipeDuTdbPage;
