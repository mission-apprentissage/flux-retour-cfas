import { Box, Button, Divider, Heading, HStack, Text, useDisclosure } from "@chakra-ui/react";
import React from "react";

import { BreadcrumbNav, Page, Section } from "../../../common/components";
import { NAVIGATION_PAGES } from "../../../common/constants/navigationPages";
import OrganismeFormationPagesMenu from "../OrganismeFormationPagesMenu";
import AskUniqueURLModal from "./AskUniqueURL/AskUniqueURLModal";
const CommentConsulterEtVerifierLesDonneesPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Page>
      <Section withShadow paddingTop="3w">
        <BreadcrumbNav
          links={[
            NAVIGATION_PAGES.Accueil,
            NAVIGATION_PAGES.OrganismeFormation,
            NAVIGATION_PAGES.OrganismeFormation.consulter,
          ]}
        />
      </Section>
      <Section paddingTop="5w" marginBottom="10w">
        <HStack spacing="10w">
          <Box alignSelf="flex-start" width="34%">
            <OrganismeFormationPagesMenu />
          </Box>
          <Divider height="250px" orientation="vertical" marginLeft="5w" alignSelf="flex-start" />
          <Box>
            <Section color="grey.800" fontSize="gamma">
              <Heading as="h1" fontSize="alpha">
                Comment consulter et vérifier les données que vous transmettez ?
              </Heading>
              <Text marginTop="3w">
                Pour vérifier vos données, utilisez le lien d’accès vous permettant d’accéder à votre page personnelle
                du Tableau de Bord de l’Apprentissage. Vous pourrez signaler une anomalie directement sur cette page.
              </Text>
              <Button variant="secondary" marginTop="2w" onClick={onOpen}>
                Demander votre URL unique
              </Button>
              <AskUniqueURLModal isOpen={isOpen} onClose={onClose} />
              <Heading as="h1" fontSize="alpha" marginTop="10w">
                Quels sont les anomalies les plus fréquentes ?
              </Heading>
              <Text marginTop="3w" fontWeight={700}>
                ‌Sur la page de votre organisme, vous constatez un écart entre les chiffres dont vous disposez et ceux
                du tableau de bord
              </Text>
              <Text fontSize="epsilon">
                ‌Si cet écart est faible, il peut s&apos;expliquer par un dédoublonnement qui ne s&apos;est pas fait
                correctement. En effet, nous importons les données chaque nuit et nous construisons un historique des
                statuts de chaque apprenant afin de pouvoir vous restituer les données rétrospectivement. Afin de ne pas
                comptabiliser un apprenant 2 fois, nous procédons à un dédoublonnement basé sur : l&apos;INE
                (lorsqu&apos;il est renseigné) ou sur la combinaison : Nom-Prenoms-Mail. Cependant, il peut arriver que
                cette opération ne suffise pas à identifier une candidature : par exemple, si le candidat a changé
                d&apos;adresse mail, alors il ne sera pas reconnu comme doublon et pourra être comptabilisé 2 fois.
                <br /> ‌Si cet écart est supérieur à quelques unités, nous vous invitons à cliquer sur le lien &quot;je
                signale une anomalie&quot; sur la page de votre CFA et nous détailler l&apos;anomalie que vous constatez
                afin de nous permettre d&apos;investiguer et d&apos;identifier la cause pour la corriger si possible.
              </Text>
              <Text marginTop="5w" fontWeight={700}>
                Vous ne retrouvez pas votre organisme dans la liste proposée
              </Text>
              <Text fontSize="epsilon">
                ‌Pour chercher votre établissement vous pouvez utiliser le numéro d&apos;UAI, le numéro de SIRET ou le
                nom. ‌
                <br />
                Si votre organisme ne remonte pas dans la liste : assurez vous que l&apos;UAI et le SIRET renseignés
                dans votre ERP ne comportent pas d&apos;erreur ; assurez-vous également d&apos;avoir bien effectué le
                paramétrage nécessaire dans votre ERP. Pour obtenir le pas à pas, écrivez-nous à l&apos;adresse suivante
                : tableau-de-bord@apprentissage.beta.gouv.fr
              </Text>
              <Text marginTop="5w" fontWeight={700}>
                Vous ne voyez pas votre réseau dans la liste proposée{" "}
              </Text>
              <Text fontSize="epsilon">
                ‌Nous référençons les différents réseaux au fur et à mesure que nous collectons les informations. Si
                vous faîtes partie d&apos;un réseau, vous pouvez demander à être référencé en nous fournissant la liste
                exhaustive des établissements sur le plan national : SIRET - UAI - Nom du CFA, à l&apos;adresse suivante
                : tableau-de-bord@apprentissage.beta.gouv.fr
              </Text>
            </Section>
          </Box>
        </HStack>
      </Section>
    </Page>
  );
};

export default CommentConsulterEtVerifierLesDonneesPage;
