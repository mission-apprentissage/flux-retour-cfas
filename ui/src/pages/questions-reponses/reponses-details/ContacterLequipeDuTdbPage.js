import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Heading,
  Link,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { NavLink } from "react-router-dom";

import { BreadcrumbNav, Page, Section } from "../../../common/components";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import { CONTACT_ADDRESS } from "../../../common/constants/product";

const ContacterLequipeDuTdbPage = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

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
        <Accordion allowMultiple fontSize="zeta" color="#3A3A3A" marginTop="2w">
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontSize="delta">
                  J’ai constaté une erreur dans les chiffres affichés ou les informations concernant un établissement
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel paddingBottom={4}>
              <Text>
                Si vous êtes un organisme de formation, vérifiez le paramétrage du logiciel de gestion que vous
                utilisez, si celui-ci est correct ou si vous avez un doute contactez nous par courriel :{" "}
                <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                  {CONTACT_ADDRESS}
                </Link>
              </Text>
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontSize="delta">
                  Je souhaite participer à un test ou rejoindre la communauté de Beta Testeuses et Beta Testeurs
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel paddingBottom={4}>
              <Box>
                <Text>
                  Merci de votre implication, nous avons régulièrement des tests en cours afin d’améliorer notre
                  produit, n’hésitez pas à nous écrire :{" "}
                  <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                    {CONTACT_ADDRESS}
                  </Link>
                </Text>
              </Box>
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontSize="delta">
                  Je ne trouve pas la réponse à ma question ?
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel paddingBottom={4}>
              <Text>
                Cette page d’aide n’est pas exhaustive et sera enrichie grâce à vos questions et vos retours. Vous
                pouvez nous contacter via le chat lorsqu’il est disponible (en bas à gauche de votre écran) ou par
                courriel :{" "}
                <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                  {CONTACT_ADDRESS}
                </Link>
              </Text>
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontSize="delta">
                  Je souhaite contacter l’équipe du Tableau de bord
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel paddingBottom={4}>
              <Text>
                Vous pouvez nous contacter via le chat lorsqu’il est disponible (en bas à gauche de votre écran) ou par
                courriel :{" "}
                <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                  {CONTACT_ADDRESS}
                </Link>
              </Text>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        <Box marginTop="4w" marginBottom="4w">
          <Link
            fontSize="delta"
            borderBottom="1px solid"
            _hover={{ textDecoration: "none" }}
            onClick={() => scrollToTop()}
          >
            <Box as="i" className="ri-arrow-up-fill" /> Haut de page
          </Link>
        </Box>
      </Section>
    </Page>
  );
};

export default ContacterLequipeDuTdbPage;
