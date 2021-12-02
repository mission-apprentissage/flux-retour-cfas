import { Box, Flex, Heading, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import React from "react";

import { Page, Section } from "../../common/components";

const ComprendreLesDonnees = () => {
  return (
    <Page>
      <Box color="grey.800">
        <Section backgroundColor="galt" paddingY="8w" withShadow>
          <Heading as="h1" variant="h1" marginBottom="1w">
            Comprendre les données
          </Heading>
        </Section>
        <Box py="10w" ml="10w">
          <Flex>
            <Box bg="galt" w="20%" h="170px">
              <Box ml="2w" py="2w">
                <Text fontSize="epsilon" fontWeight="700">
                  SOMMAIRE
                </Text>
                <Box mt="1w">
                  <Link href="#maniere">
                    <Text>
                      <Text as="span" fontWeight="700">
                        1.
                      </Text>{" "}
                      De manière générale
                    </Text>
                  </Link>
                  <Link href="#organismeFormation">
                    <Text mt="1w">
                      <Text as="span" fontWeight="700">
                        2.
                      </Text>{" "}
                      Vous êtes un organisme de formation
                    </Text>
                  </Link>
                </Box>
              </Box>
            </Box>
            <Box ml="10w" w="70%">
              <Heading as="h1" variant="h1" marginBottom="1w" color="black" id="maniere">
                De manière générale
              </Heading>
              <Box mt="5w">
                <Text fontSize="beta" fontWeight="700">
                  D&apos;où viennent les chiffres ?
                </Text>
                <Text>
                  Nous collectons des données auprès des organismes de formation en nous connectant à leur ERP.{" "}
                </Text>
              </Box>
              <Box mt="5w">
                <Text fontSize="beta" fontWeight="700">
                  Quelles sont les données collectées et leur format ?
                </Text>
                <Text>
                  Les données sont collectées par la clé d’entrée de l’apprenant, les champs récupérés sont les suivants
                  :
                </Text>
                <UnorderedList ml="5w">
                  <ListItem>INE ;</ListItem>
                  <ListItem>Nom de l’apprenant ;</ListItem>
                  <ListItem>Prénom de l’apprenant ;</ListItem>
                  <ListItem>Adresse mail de l’apprenant ;</ListItem>
                  <ListItem>Statut de l’apprenant : inscrit, apprenti et abandon ;</ListItem>
                  <ListItem>Intitulé de la formation ;</ListItem>
                  <ListItem>Code formation diplôme ;</ListItem>
                  <ListItem>Année de la formation ;</ListItem>
                  <ListItem>Date de début et date de fin de la formation ;</ListItem>
                  <ListItem>Localisation ;</ListItem>
                  <ListItem>UAI de l’organisme de formation ;</ListItem>
                  <ListItem>SIRET de l’organisme de formation ;</ListItem>
                  <ListItem>Raison sociale ;</ListItem>
                </UnorderedList>
                <Box fontWeight="700" mt="2w">
                  <Text>Définitions :</Text>
                  <UnorderedList ml="5w">
                    <ListItem>
                      Un apprenant unique est identifié quand il y a unicité sur la combinaison suivante : Nom, Prénom,
                      CFD de la formation, UAI de l’organisme de formation.On décompte donc 1 apprenant pour 1
                      combinaison.
                    </ListItem>
                    <ListItem>
                      Les données sont collectées par la clé d’entrée de l’apprenant, les champs récupérés sont les
                      suivants : Un organisme est une entité définie par l’UAI. On décompte donc 1 organisme pour 1 UAI.
                    </ListItem>
                  </UnorderedList>
                </Box>
              </Box>
              <Box mt="5w">
                <Text fontSize="beta" fontWeight="700">
                  A quelle date l&apos;indice &quot;Effectif&quot; est-il arrêté ?
                </Text>
                <Text>
                  ‌A ce jour, Yparéo, Gesti et SC Form nous transmettent les données de manière quotidienne. De fait,
                  les données sont constamment rafraîchies. ‌Lorsque vous consultez le mois en cours, les effectifs
                  affichés sont ceux du dernier jour disponible, par exemple si le 12 janvier 2021, vous sélectionnez la
                  période &quot;janvier 2021&quot; , vous pourrez connaître les effectifs comptabilisés au 12 janvier.
                  ‌Lorsque vous sélectionnez un mois antérieur, les effectifs affichés sont une photographie &quot;fin
                  de mois&quot;, c&apos;est-à-dire au dernier jour du mois consulté. Par exemple, si toujours le 12
                  janvier 2021, vous sélectionnez la période &quot;écembre 2019, vous pourrez connaître les effectifs
                  comptabilisés au 31 décembre.
                </Text>
              </Box>
              <Box mt="5w">
                <Text fontSize="beta" fontWeight="700">
                  Y a-t-il un traitement statistique des données ?
                </Text>
                <Text>
                  ‌Non. Nous effectuons un dédoublonnement à partir des données personnelles des apprentis et nous
                  constituons un historique afin de pouvoir tracer les changements de statut d&apos;un apprenant
                  (d&apos;Apprenti à Abandon, par exemple) mais nous ne faisons aucun traitement statistique. ‌Les
                  données exposées correspondent aux effectifs des CFA en temps réel. De ce fait, lorsqu&apos;un
                  établissement enregistre une information dans son Système d&apos;Information (Inscription, Nouveau
                  Contrat...) l&apos;information est restituée le lendemain ou la semaine suivante au plus tard (Gesti)
                  dans le Tableau de bord
                </Text>
              </Box>
              <Box py="10w">
                <Heading as="h2" variant="h1" marginBottom="1w" color="black" id="organismeFormation">
                  Vous êtes un organisme de formation
                </Heading>
                <Box py="4w">
                  <Text fontSize="beta" fontWeight="700">
                    ‌Sur la page de votre organisme, vous constatez un écart entre les chiffres dont vous disposez et
                    ceux du tableau de bord
                  </Text>
                  <Text>
                    ‌Si cet écart est faible, il peut s&apos;expliquer par un dédoublonnement qui ne s&apos;est pas fait
                    correctement. En effet, nous importons les données chaque nuit et nous construisons un historique
                    des statuts de chaque apprenant afin de pouvoir vous restituer les données rétrospectivement. Afin
                    de ne pas comptabiliser un apprenant 2 fois, nous procédons à un dédoublonnement basé sur :
                    l&apos;sur la combinaison Nom-Prénom-UAI-CFD. Cependant, il peut arriver que cette opération ne
                    suffise pas à identifier une candidature : par exemple, si le candidat a changé d&apos;adresse mail,
                    alors il ne sera pas reconnu comme doublon et pourra être comptabilisé 2 fois. ‌Si cet écart est
                    supérieur à quelques unités, nous vous invitons à cliquer sur le lien &quot;je signale une
                    anomalie&quot;sur la page de votre CFA et nous détailler l&apos;anomalie que vous constatez afin de
                    nous permettre d&apos;investiguer et d&apos;identifier la cause pour la corriger si possible.
                  </Text>
                </Box>
                <Box py="4w">
                  <Text fontSize="beta" fontWeight="700">
                    Vous ne retrouvez pas votre organisme dans la liste proposée
                  </Text>
                  <Text>
                    ‌Pour chercher votre établissement vous pouvez utiliser le numéro d&apos;UAI, le numéro de SIRET ou
                    le nom. ‌Si votre organisme ne remonte pas dans la liste : assurez vous que l&apos;UAI et le SIRET
                    renseignés dans votre ERP ne comportent pas d&apos;erreur ; assurez-vous également d&apos;avoir bien
                    effectué le paramétrage nécessaire dans votre système d&apos;information. Pour obtenir le pas à pas,
                    écrivez-nous à l&apos;adresse suivante : tableau-de-bord@apprentissage.beta.gouv.fr
                  </Text>
                </Box>
                <Box py="4w">
                  <Text fontSize="beta" fontWeight="700">
                    Vous utilisez un logiciel qui n&apos;est pas encore référencé
                  </Text>
                  <Text>
                    ‌Nous vous invitons à signaler à votre éditeur de logiciel votre besoin de pouvoir transmettre vos
                    données au Tableau de bord et à nous écrire à l&apos;adresse suivante :
                    tableau-de-bord@apprentissage.beta.gouv.fr
                  </Text>
                </Box>
              </Box>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Page>
  );
};

export default ComprendreLesDonnees;
