import {
  Container,
  Heading,
  Table,
  Thead,
  Tr,
  Td,
  Th,
  Tbody,
  Text,
  Flex,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";

import SimplePage from "@/components/Page/SimplePage";

export default function Glossaire() {
  return (
    <SimplePage title="Tableau de bord de l’apprentissage">
      <Container maxW="xl" py="10" gap="16">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Clarification des termes techniques et données
        </Heading>
        <Table mt="10" variant="glossaire">
          <Thead>
            <Tr>
              <Th w="56">Termes</Th>
              <Th>Définitions et périmètre</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td verticalAlign="top">Année de formation</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Le niveau de progression de l’apprenti dans son programme de formation est indiqué par un numéro en
                    fonction de la durée théorique du cursus. Par exemple, pour une formation sur plusieurs années, le
                    numéro correspond à l’année en cours (1 pour la première année, 2 pour la deuxième, etc.).
                  </Text>
                  <Text as="p">
                    Pour les formations déviant de leur durée théorique, comme un CAP prévu sur 24 mois mais durant en
                    réalité 12 mois, l’apprenti est classé en année 2 au lieu de 1.
                  </Text>
                  <Text as="p">
                    Pour les Bac Pro sur 24 mois, où les apprentis couvrent l’équivalent de la première à la terminale,
                    ils sont classés en année 2, puis en 3 l’année suivante.
                  </Text>
                  <Text as="p">
                    Généralement, si les apprentis passent l’examen cette année sans redoubler, ils sont classés en
                    année 2 pour CAP et BTS, et en 3 pour Bac Pro. Cette règle s’applique à tous les diplômes, quelle
                    que soit leur durée théorique.
                  </Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Code Commune INSEE</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Les codes INSEE des communes françaises sont consultables sur{" "}
                    <a href="https://www.insee.fr/fr/accueil" target="_blank" rel="noopener noreferrer">
                      www.insee.fr
                    </a>
                    . Cette nomenclature est mise à jour chaque année.
                  </Text>
                  <Text as="p">Attention&nbsp;: ne pas confondre avec les codes postaux.</Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Code Formation Diplôme (CFD)</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Codification qui concerne l’ensemble des diplômes technologiques et professionnels des ministères
                    certificateurs.Y sont ajoutés, en tant que de besoin et à la demande des centres de formation par
                    l’apprentissage, les autres diplômes et titres inscrits au répertoire national des certifications
                    professionnelles (RNCP), dès lors qu’ils sont préparés par la voie de l’apprentissage. L’affichage
                    permet, par l’usage de ce code, d’identifier la formation concernée et les effectifs par typologie
                    de formations et par secteur.
                  </Text>
                  <Text as="p">Format&nbsp;: 8 caractères, comprenant des chiffres et des lettres</Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Lieu de formation</Td>
              <Td>
                Les lieux de formations sont caractérisés par une adresse postale et des coordonnées de géolocalisation
                et toujours rattachés à un organisme de formation. La donnée «&nbsp;lieu de formation&nbsp;» provient
                des Carif-Oref. Si cette donnée est inconnue ou incorrecte,{" "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://referentiel.apprentissage.onisep.fr/corrections?item=lieu"
                >
                  voir la marche à suivre
                </a>
                .
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Nature de l’organisme</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Trois natures d’organismes peuvent être observées via le Catalogue des formations en
                    apprentissage&nbsp;:
                  </Text>
                  <Text as="b">Les organismes «&nbsp;responsables&nbsp;»&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>
                      Ne dispensent pas de formation mais délèguent à des organismes responsable et formateur ou
                      uniquement formateur&nbsp;;
                    </ListItem>
                    <ListItem>Sont signataires de la convention de formation&nbsp;:</ListItem>
                    <ListItem>Demandent et reçoivent les financements de l’OPCO&nbsp;:</ListItem>
                    <ListItem>
                      Sont responsables auprès de l’administration du respect de ses missions et obligations&nbsp;:
                    </ListItem>
                    <ListItem>
                      Sont titulaires de la certification qualité en tant que CFA et est garant du respect des critères
                      qualité au sein de l’UFA.
                    </ListItem>
                  </UnorderedList>
                  <Text as="b">Les organismes «&nbsp;responsables et formateurs&nbsp;»&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>
                      Dispensent des formations par apprentissage déclaré auprès des services de l’Etat (n° de
                      déclaration d’activité (NDA))&nbsp;:
                    </ListItem>
                    <ListItem>Sont signataires de la convention de formation&nbsp;:</ListItem>
                    <ListItem>Demandent et reçoit les financements de l’OPCO&nbsp;:</ListItem>
                    <ListItem>
                      Sont responsables envers l’administration quant au respect de leurs missions et obligations&nbsp;:
                    </ListItem>
                    <ListItem>
                      Détiennent la certification qualité en tant que CFA et veillent à respecter les critères qualité
                      au sein de l’UFA.
                    </ListItem>
                  </UnorderedList>
                  <Text as="b">Les organismes «&nbsp;formateurs&nbsp;»&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>
                      Dispensent des actions de formation par apprentissage déclaré auprès des services de l’Etat (n° de
                      déclaration d’activité (NDA))
                    </ListItem>
                  </UnorderedList>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Niveau de formation</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">Nomenclature des diplômes par niveau&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>3 CAP, BEP</ListItem>
                    <ListItem>4 Baccalauréat</ListItem>
                    <ListItem>5 DEUG, BTS, DUT, DEUST</ListItem>
                    <ListItem>6 Licence, licence professionnelle, BUT, Maîtrise</ListItem>
                    <ListItem>
                      7 Master, diplôme d’études approfondies, diplôme d’études supérieures spécialisées, diplôme
                      d’ingénieur
                    </ListItem>
                    <ListItem>8 Doctorat, habilitation à diriger des recherches</ListItem>
                  </UnorderedList>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Organisme de formation (OFA)</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">Organismes de formation approuvés par le Tableau de bord, incluant ceux&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>
                      Répertoriés dans le Catalogue des formations en apprentissage (base Onisep -{" "}
                      <a target="_blank" rel="noopener noreferrer" href="https://referentiel.apprentissage.onisep.fr">
                        https://referentiel.apprentissage.onisep.fr
                      </a>
                      )&nbsp;
                    </ListItem>
                    <ListItem>
                      avec les détails suivants : UAI, SIREN, SIRET, Catégorie (Responsable ; Responsable et formateur ;
                      Formateur), Numéro de déclaration d’activité (NDA), Certification Qualiopi, Nom commercial,
                      Dénomination sociale, Appartenance à un réseau, Adresse, Région, Académie.
                    </ListItem>
                  </UnorderedList>
                  <Text as="p">
                    Ce nombre inclut&nbsp;: les OFA «&nbsp;historiques&nbsp;», les OFA académiques et d’entreprise, les
                    lycées avec une section apprentissage, les prépa-apprentissage.
                  </Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Relations entre les organismes</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text>
                    <b>
                      Les relations entres les organismes sont identifiées au niveau de l’offre de formation en
                      apprentissage collectée par les Carif-Oref.
                    </b>{" "}
                    En effet, chaque offre de formation est associée à un organisme responsable et un organisme
                    formateur (chacun est connu par son SIRET et son UAI le cas échéant).
                  </Text>
                  <UnorderedList>
                    <ListItem>
                      Si les organismes liés à une offre de formation partagent le même SIRET, cela indique une relation
                      de type «&nbsp;responsable et formateur&nbsp;» et aucune nouvelle relation n’est créée.
                    </ListItem>
                    <ListItem>
                      Si les organismes associés à une offre de formation ont des SIRET différents, cela implique une
                      relation de type «&nbsp;responsable&nbsp;» pour l’un et «&nbsp;formateur&nbsp;» pour l’autre, ce
                      qui engendre la création d’une relation entre eux.
                    </ListItem>
                  </UnorderedList>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Réseau</Td>
              <Td>
                Un réseau dans le contexte de l’apprentissage peut regrouper différents partenaires institutionnels,
                organismes de formation, centres de formation d’apprentis (CFA), entreprises, chambres consulaires,
                branches professionnelles et acteurs régionaux. Ces entités peuvent s’associer au sein d’associations ou
                de groupements consulaires pour coordonner leurs actions et missions, avec des objectifs partagés dans
                le domaine de la formation en apprentissage. L’objectif principal de ces réseaux est de favoriser la
                collaboration et la mise en commun des ressources pour promouvoir et soutenir l’apprentissage.
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">RNCP</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text>
                    Le Répertoire national des certifications professionnelles (RNCP) a pour rôle de fournir une
                    information constamment mise à jour sur les diplômes, les titres à finalité professionnelle ainsi
                    que sur les certificats de qualification, accessible à tous. France compétences est en charge de
                    maintenir à jour le RNCP. Grâce à un code spécifique, les formations concernées peuvent être
                    identifiées, ce qui facilite la classification des effectifs selon le type de formation et le
                    secteur.
                  </Text>
                  <Text>
                    Pour plus d’information sur la certification et son éligibilité à l’apprentissage, consulter le site
                    Internet de France Compétences (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://www.francecompetences.fr/recherche_certificationprofessionnelle/"
                    >
                      www.francecompetences.fr/recherche_certificationprofessionnelle
                    </a>
                    ).
                  </Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Secteur d’activité</Td>
              <Td>
                Notre nomenclature se base sur le Code ROME, un référentiel conçu par Pôle emploi et actualisé
                régulièrement, tenant compte des évolutions du marché du travail. Il présente l’ensemble des métiers
                regroupés par fiches, organisées par 14 grands domaines professionnels. Ces fiches proposent une
                description détaillée des métiers&nbsp;: définition, accès à l’emploi, compétences (savoir-faire,
                savoir-être professionnels et savoirs), contextes de travail, et mobilité professionnelle.
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">SIRET</Td>
              <Td>
                Système d’identification du répertoire des établissements. Code numérique unique et officiel. Chaque
                établissement au sein d’une entreprise est doté d’un SIRET, attribué par l’INSEE (Institut National de
                la Statistique et des Études Économiques). Pour plus d’informations, vous pouvez contacter l’INSEE via
                leur site web officiel&nbsp;:{" "}
                <a target="_blank" rel="noopener noreferrer" href="https://www.insee.fr/">
                  https://www.insee.fr/
                </a>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">UAI</Td>
              <Td>
                Le code UAI (Unité Administrative Immatriculée) composé de 7 chiffres et 1 lettre, est un code attribué
                en France aux établissements d’enseignement (écoles, collèges, lycées, universités, etc.). Il est
                utilisé pour les identifier dans différentes bases de données et systèmes administratifs. Le code UAI
                est attribué par le Ministère de l’Éducation nationale en France.
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Zone d’emploi</Td>
              <Td>
                Unité géographique définie par l’INSEE pour analyser les dynamiques du marché du travail et les
                interactions économiques au sein d’une région. Elle regroupe un ensemble de communes qui présentent des
                liens significatifs en termes de déplacements domicile-travail et d’échanges d’activités économiques.
                Ces zones d’emploi sont utilisées pour étudier les flux de main-d’œuvre, les caractéristiques de
                l’emploi et d’autres indicateurs socio-économiques, ce qui permet de mieux comprendre les dynamiques
                économiques régionales et locales.
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </Container>
    </SimplePage>
  );
}
