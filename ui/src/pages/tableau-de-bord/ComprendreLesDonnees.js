import { Box, Flex, Heading, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import React from "react";

import { Page, Section } from "../../common/components";
import { productName } from "../../common/constants/productName";

const ComprendreLesDonnees = () => {
  return (
    <Page>
      <Box color="grey.800">
        <Section backgroundColor="galt" paddingY="8w" withShadow>
          <Heading as="h1" variant="h1" marginBottom="1w">
            Comprendre les données
          </Heading>
        </Section>
        <Box py="10w" marginLeft="10w">
          <Flex>
            <Box background="galt" width="20%" height="170px">
              <Box marginLeft="2w" py="2w">
                <Text fontSize="epsilon" fontWeight="700">
                  SOMMAIRE
                </Text>
                <Box marginTop="1w">
                  <Link href="#maniere">
                    <Text>
                      <Text as="span" fontWeight="700">
                        1.
                      </Text>{" "}
                      De manière générale
                    </Text>
                  </Link>
                  <Link href="#organismeFormation">
                    <Text marginTop="1w">
                      <Text as="span" fontWeight="700">
                        2.
                      </Text>{" "}
                      Vous êtes un organisme de formation
                    </Text>
                  </Link>
                </Box>
              </Box>
            </Box>
            <Box marginLeft="10w" width="70%">
              <Heading as="h1" variant="h1" marginBottom="1w" color="black" id="maniere">
                De manière générale
              </Heading>
              <Box marginTop="5w">
                <Text fontSize="beta" fontWeight="700">
                  D&apos;où viennent les chiffres ?
                </Text>
                <Text>
                  Nous collectons des données auprès des organismes de formation en nous connectant à leur ERP.{" "}
                </Text>
              </Box>
              <Box marginTop="5w">
                <Text fontSize="beta" fontWeight="700">
                  Quelles sont les données collectées et leur format ?
                </Text>
                <Text>
                  Les données sont collectées par la clé d’entrée de l’apprenant, les champs récupérés sont les suivants
                  :
                </Text>
                <UnorderedList marginLeft="5w">
                  <ListItem>INE ;</ListItem>
                  <ListItem>Nom de l’apprenant ;</ListItem>
                  <ListItem>Prénom de l’apprenant ;</ListItem>
                  <ListItem>Date de naissance de l’apprenant ;</ListItem>
                  <ListItem>Code Postal du lieu de résidence de l’apprenant ;</ListItem>
                  <ListItem>Adresse mail de l’apprenant ;</ListItem>
                  <ListItem>Statut de l’apprenant : inscrit, apprenti et abandon ;</ListItem>
                  <ListItem>Intitulé de la formation ;</ListItem>
                  <ListItem>Code formation diplôme ;</ListItem>
                  <ListItem>RNCP;</ListItem>
                  <ListItem>Année de la formation ;</ListItem>
                  <ListItem>Date de début et date de fin de la formation ;</ListItem>
                  <ListItem>Localisation ;</ListItem>
                  <ListItem>UAI de l’organisme de formation ;</ListItem>
                  <ListItem>SIRET de l’organisme de formation ;</ListItem>
                  <ListItem>Raison sociale ;</ListItem>
                  <ListItem>Code Postal du lieu de formation ;</ListItem>
                  <ListItem>Date de début et date de fin du contrat en apprentissage ;</ListItem>
                  <ListItem>Date de rupture de contrat ;</ListItem>
                </UnorderedList>
                <Box fontWeight="700" marginTop="2w">
                  <Text>Définitions :</Text>
                  <UnorderedList marginLeft="5w">
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
              <Box marginTop="5w">
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
              <Box marginTop="5w">
                <Text fontSize="beta" fontWeight="700">
                  Y a-t-il un traitement statistique des données ?
                </Text>
                <Text>
                  ‌Non. Nous effectuons un dédoublonnement à partir des données personnelles des apprentis et nous
                  constituons un historique afin de pouvoir tracer les changements de statut d&apos;un apprenant
                  (d&apos;Apprenti à Abandon, par exemple) mais nous ne faisons aucun traitement statistique. ‌Les
                  données exposées correspondent aux effectifs des CFA en temps réel. De ce fait, lorsqu&apos;un
                  établissement enregistre une information dans son Système d&apos;Information (Inscription, Nouveau
                  Contrat...) l&apos;information est restituée le lendemain dans le {productName}.
                </Text>
              </Box>
              <Box py="10w">
                <Heading as="h2" variant="h1" marginBottom="1w" color="black" id="organismeFormation">
                  Vous êtes un organisme de formation
                </Heading>
                <Box py="4w">
                  <Text fontSize="beta" fontWeight="700">
                    ‌Sur la page de votre organisme, vous constatez un écart entre les chiffres dont vous disposez et
                    ceux du {productName}
                  </Text>
                  <Text>
                    ‌Nombre d&apos;Apprentis : si cet écart est faible, il peut s&apos;expliquer par un dédoublonnement
                    qui ne s&apos;est pas fait correctement. En effet, nous importons les données chaque nuit et nous
                    construisons un historique des statuts de chaque apprenant afin de pouvoir vous restituer les
                    données rétrospectivement. Afin de ne pas comptabiliser un apprenant 2 fois, nous procédons à un
                    dédoublonnement basé sur la combinaison Nom-Prénom-UAI-CFD. Cependant, il peut arriver que cette
                    opération ne suffise pas à identifier une candidature : par exemple, si le candidat a changé
                    d&apos;adresse mail, alors il ne sera pas reconnu comme doublon et pourra être comptabilisé 2 fois.
                    ‌Si cet écart est supérieur à quelques unités, nous vous invitons à cliquer sur le lien &quot;je
                    signale une anomalie&quot;sur la page de votre CFA et nous détailler l&apos;anomalie que vous
                    constatez afin de nous permettre d&apos;investiguer et d&apos;identifier la cause pour la corriger
                    si possible.
                  </Text>
                  <Text marginTop="5w">
                    ‌Nombre d&apos;Inscrits sans contrat : si vous constatez un écart sur cet indicateur, il est
                    probable que vous transmettez des données pour des apprenants qui ne sont pas en formation
                    apprentissage et de fait, ils sont considérés &quot;sans contrat&quot;. Vous devez alors, vérifier
                    le paramétrage dans votre application, corriger et nous adresser un mail pour nous signaler cette
                    correction.
                  </Text>
                </Box>
                <Box py="4w">
                  <Text fontSize="beta" fontWeight="700">
                    Vous utilisez un logiciel qui n&apos;est pas encore référencé
                  </Text>
                  <Text>
                    ‌Nous vous invitons à signaler à votre éditeur de logiciel votre besoin de pouvoir transmettre vos
                    données au {productName} et à nous écrire à l&apos;adresse suivante :
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
