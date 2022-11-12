import React from "react";
import { Box, Heading, Text, UnorderedList, ListItem, OrderedList, Flex } from "@chakra-ui/react";

const DonneesPersonnelles = () => {
  return (
    <Box pt={1} pb={16}>
      <Box>
        <Box mt={4}>
          <Text>
            MENTIONS D&apos;INFORMATION RELATIVES AU TRAITEMENT DES DONNÉES À CARACTÈRE PERSONNEL DANS LE CADRE DU «
            SERVICE DÉMATÉRIALISÉ DE L&apos;APPRENTISSAGE DES EMPLOYEURS PUBLICS »
          </Text>
        </Box>
        <Box mt={4}>
          <Text>
            Le traitement de données à caractère personnel est mis en œuvre par la Direction Générale de l &apos;Emploi
            et de la Formation Professionnelle (DGEFP) dans le cadre du traitement du SI Alternance. <br />
            Les mentions ci-dessous doivent être communiquées par l&#39;employeur au titulaire du contrat
            d&apos;apprentissage lors de la signature du contrat.
          </Text>
        </Box>
        <Box mt={4}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Finalités
          </Heading>
          <Text>
            La Délégation Générale à l&apos;Emploi et à la Formation Professionnelle (DGEFP), représentée par son
            Délégué Général Monsieur Bruno LUCAS, procède à un traitement de données à caractère personnel concernant le
            représentant de l&apos;employeur, son apprenti , le cas échéant le représentant légal de l&apos;apprenti, le
            maître d&apos;apprentissage, le représentant du Centre de Formation des Apprentis pour les finalités
            suivantes :
            <br />
            <br />
          </Text>
          <UnorderedList ml="30px !important">
            <ListItem>Faciliter la conclusion des contrats en alternance ;</ListItem>
            <ListItem>Améliorer la qualité du service rendu aux usagers ;</ListItem>
            <ListItem>Déposer et instruire les contrats d&apos;apprentissage signés et visés ;</ListItem>
            <ListItem>
              Vérifier la complétude du contrat et sa cohérence aux documents mentionnés à l&apos;article D 6275-1 ;
            </ListItem>
            <ListItem>Vérifier l&apos;éligibilité du contrat aux aides financées par l&apos;Etat ;</ListItem>
            <ListItem>
              Permettre la transmission de la signature électronique auprès des services du ministre chargé de la
              formation professionnelle, des contrats d&apos;apprentissage des employeurs publics et des documents
              mentionnés à l&apos;article D 6275-1 par les organismes concernés ;
            </ListItem>
            <ListItem>
              Faciliter la transmission, le traitement et la prise en charge financière des contrats
              d&apos;apprentissage
            </ListItem>
            <ListItem>Faciliter le traitement des versements des aides à l&#39;alternance</ListItem>
            <ListItem>Faciliter l&apos;identification des décrocheurs scolaires</ListItem>
            <ListItem>Faciliter la recherche d&apos;emplois en alternance</ListItem>
            <ListItem>Faciliter l&apos;orientation professionnelle des usagers</ListItem>
            <ListItem>Diffuser une information ciblée aux entreprises et aux alternants</ListItem>
            <ListItem>Faciliter l&#39;élaboration des traitements de données statistiques anonymes</ListItem>
            <ListItem>La mise en œuvre du partage des données mentionnées dans le présent CERFA</ListItem>
          </UnorderedList>
        </Box>
        <Box mt={4}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Fondements légaux
          </Heading>
          <Text>
            Ce traitement est nécessaire au respect d&#39;obligations légales auxquelles le responsable du traitement
            est soumis ((article 6.1.c) du Règlement général sur la protection des données (RGPD) du 27 avril 2016 et de
            la Loi n°78-17 du 6 janvier 1978 dite Loi Informatique et Libertés).
            <br />
            <br />
          </Text>
          <Text>
            La transmission dématérialisée du contrat d&#39;apprentissage au Ministère du Travail et le traitement des
            données sont des obligations légales fondées sur :
          </Text>
          <UnorderedList ml="30px !important">
            <ListItem>La loi 2019-828 du 6 Août (Article 18)</ListItem>
            <ListItem>L&apos;article L.6227-1 du code du travail</ListItem>
            <ListItem>L&apos;article L.6227-6 du code du travail</ListItem>
            <ListItem>L&apos;article L.6227-12 du code du travail</ListItem>
            <ListItem>L&apos;article D-6275-1 du code du travail</ListItem>
            <ListItem>L&apos;article D-6575-2 du code du travail</ListItem>
            <ListItem>L&apos;article R-6275-3 du code du travail</ListItem>
            <ListItem>
              Le décret n°2019-1 du 3 janvier 2019 portant création de l&apos;aide au financement du permis de conduire
              pour les apprentis
            </ListItem>
            <ListItem>
              Arrêté du 5 décembre 2019 modifiant l&#39;arrêté du 18 mai 2012 portant autorisation de traitements
              automatisés de données à caractère personnel relatives au service dématérialisé de l&#39;alternance mis à
              disposition des usagers.
            </ListItem>
          </UnorderedList>
        </Box>
        <Box mt={4}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Durée de conservation des données à caractère personnel
          </Heading>
          <Text>
            La durée de conservation des données, définie dans l&#39;arrêté du 18 mai 2012 portant sur
            l&apos;autorisation de traitements automatisés de données à caractère personnel relatif au service
            dématérialisé de l&#39;alternance mis à disposition des usagers, est de 10 ans suivant la date de fin du
            contrat.
          </Text>
        </Box>
        <Box mt={4}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Accédants
          </Heading>
          <OrderedList ml="30px !important">
            <ListItem>
              1° Les personnes et agents habilités par la Délégation Générale à l&apos;Emploi et à la Formation
              Professionnelle ;
            </ListItem>
            <ListItem>
              2° Les personnes et agents habilités par les Directions Régionales de l&apos;Economie, de l&apos;Emploi,
              du Travail et des Solidarités, la Direction Régionale et Interdépartementale de l&apos;Economie, de
              l&apos;Emploi, du Travail et des Solidarités, les Directions Départementales de l&apos;Emploi, du Travail
              et des Solidarités, la Direction Générale de la COhésion et des POPulations de Guyane, les Directions de
              l&apos;Economie, de l&apos;Emploi, du Travail et des Solidarités, Unités départementales ;
            </ListItem>
            <ListItem>
              3° Les personnes habilitées par l&apos;employeur public uniquement sur service par voie dématérialisée de
              dépôts des contrats et des documents par voie dématérialisée
            </ListItem>
            <ListItem>
              4° les personnes habilitées par le Centre de Formation d&#39;Apprentis et uniquement sur le service par
              voie dématérialisée de dépôts des contrats et des documents ;
            </ListItem>
          </OrderedList>
        </Box>
        <Box mt={4}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Destinataires des données
          </Heading>
          <Text>
            Traitements mis en relation avec le traitement de données à caractère personnel de l&apos;apprentissage
            mentionné à l&apos;article 1er <br /> <br /> Traitement automatisé qui déverse les données dans le
            traitement « service dématérialisé de l&apos;apprentissage dans le secteur privé et le secteur public
            industriel et commercial ». Les destinataires ultérieurs et finalités ultérieures sont indiqués dans les
            mentions d&apos;information du même nom.
          </Text>
        </Box>
        <Box mt={4}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Catégorie des personnes concernées et des données à caractère personnel collectées
          </Heading>
          <Flex flexDirection={"row"} w="full">
            <Flex flexDirection={"column"}>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={0} p={5}>
                <strong>Personnes concernées</strong>
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={0} h="90px" p={5}>
                Employeur
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={0} h="140px" p={5}>
                Apprenti
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={0} h="90px" p={5}>
                Maître d&#39;apprentissage
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={0} h="65px" p={5}>
                Représentant légal
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} borderRightWidth={0} h="120px" p={5}>
                Représentant du Centre de Formation des Apprentis
              </Flex>
              <Flex border="1px solid" h="65px" borderRightWidth={0} p={5}>
                Toutes personnes concernées
              </Flex>
            </Flex>
            <Flex flexDirection={"column"}>
              <Flex border="1px solid" borderBottomWidth={0} p={5}>
                <strong>Catégorie de données à caractère personnel</strong>
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} h="90px" p={5}>
                <UnorderedList ml="30px !important">
                  <ListItem>Données d&apos;identification</ListItem>
                  <ListItem>Les données dans les documents mentionnés à l&apos;article D 6275-1</ListItem>
                </UnorderedList>
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} h="140px" p={5}>
                <UnorderedList ml="30px !important">
                  <ListItem>Données d&apos;identification</ListItem>
                  <ListItem>Information d&apos;ordre économique et financière</ListItem>
                  <ListItem>Parcours de formation et professionnel</ListItem>
                  <ListItem>Les données dans les documents mentionnés à l&apos;article D 6275-1</ListItem>
                </UnorderedList>
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} h="90px" p={5}>
                <UnorderedList ml="30px !important">
                  <ListItem>Données d&apos;identification</ListItem>
                  <ListItem>Les données dans les documents mentionnés à l&apos;article D 6275-1</ListItem>
                </UnorderedList>
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} h="65px" p={5}>
                <UnorderedList ml="30px !important">
                  <ListItem>Données d&apos;identification</ListItem>
                </UnorderedList>
              </Flex>
              <Flex border="1px solid" borderBottomWidth={0} h="120px" p={5}>
                <UnorderedList ml="30px !important">
                  <ListItem>Données d&apos;identification</ListItem>
                  <ListItem>Données relatives aux parcours de formation et parcours professionnel</ListItem>
                  <ListItem>Les données dans les documents mentionnés à l&apos;article D 6275-1</ListItem>
                </UnorderedList>
              </Flex>
              <Flex border="1px solid" h="65px" p={5}>
                <UnorderedList ml="30px !important">
                  <ListItem>Données de journalisation</ListItem>
                </UnorderedList>
              </Flex>
            </Flex>
          </Flex>
          <Box mt={4}>
            <Text>
              L&apos;exigence de la fourniture des données à caractère personnel demandée dans le CERFA conditionne la
              conclusion du contrat d&apos;apprentissage.
            </Text>
          </Box>
        </Box>
        <Box mt={4}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Collecte des données
          </Heading>
          <Text>
            Les données, à caractère personnel, relatives à l&apos;apprenti sont collectées par l&#39;employeur par le
            biais du CERFA. L&#39;employeur transmet un exemplaire du contrat et des documents mentionnés à
            l&apos;article D 6275-1 par les organismes concernés, par courrier, ou par voie dématérialisée (mail ou
            service dématérialisé de l&apos;apprentissage des employeurs publics), auprès du Page 5 sur 3 représentant
            de l&#39;Etat dans le département du lieu d&#39;exécution du contrat dont il dépend : DR(I)EETS, DDETS,
            DEETS, DGCOPOP.
            <br />
            <br />
          </Text>
          <UnorderedList ml="30px !important">
            <ListItem>
              le représentant de l&apos;état vérifie que le contrat vérifie qu&apos;il satisfait aux conditions posées
              aux articles L. 6211- 1 relatif aux formations éligibles à l&#39;apprentissage, L. 6222-1 à L. 6222-3
              relatifs à l&#39;âge de l&#39;apprenti, D. 6222-26 à D. 6222-33 relatifs à la rémunération des apprentis
              et dépose définitivement le contrat dans service dématérialisé de l&apos;apprentissage des employeurs
              publics
            </ListItem>
          </UnorderedList>
        </Box>
        <Box mt={4}>
          <Heading as={"h3"} textStyle="h6" mb={2}>
            Exercice des droits
          </Heading>
          <Text>
            Conformément au RGPD et à la loi n° 78-du 6 janvier 1978 relative à l&#39;informatique, aux fichiers et aux
            libertés (loi informatique et libertés) et dans les conditions prévues par ces mêmes textes, vous disposez
            d&apos;un droit d&apos;accès et de rectification. Vous pouvez également demander la limitation du traitement
            de vos données.
          </Text>
          <Box mt={4}>
            <Text>
              Vous pouvez exercer ces droits, en vous adressant auprès de votre responsable de traitement auprès de :
            </Text>
            <UnorderedList ml="30px !important" mt={2}>
              <ListItem>Délégation Générale à l&apos;Emploi et à la Formation Professionnelle / FIMOD / MISI</ListItem>
              <ListItem>14 avenue Duquesne, 75350 Paris 07 SP</ListItem>
              <ListItem>par courrier électronique à protectiondesdonneesDGEFP@emploi.gouv.fr</ListItem>
            </UnorderedList>
            <Text>
              Il vous sera demandé de pouvoir justifier de votre identité à l&apos;aide d&apos;une copie de votre pièce
              d&apos;identité en cours de validité si nécessaire.
            </Text>
            <Text>
              Si vous estimez, après avoir contacté la DGEFP, que vos droits ne sont pas respectés ou que le traitement
              n&apos;est pas conforme au Règlement Général sur la Protection des données Personnelles, vous pouvez
              adresser une réclamation auprès de la Commission Nationale Informatique et Liberté (CNIL).
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DonneesPersonnelles;
