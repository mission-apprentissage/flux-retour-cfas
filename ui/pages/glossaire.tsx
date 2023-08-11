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
        <Table mt="10" fontSize="zeta" variant="primary">
          <Thead>
            <Tr>
              <Th w="40">Termes</Th>
              <Th>Définitions et périmètre</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td verticalAlign="top">Année de formation</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Elle est censée refléter le niveau auquel est inscrit l’apprenti par rapport à la durée théorique du
                    cursus de formation. Par exemple, pour une formation de plusieurs années, numéro de l’année en cours
                    &nbsp;: 1 = 1ère année de formation, 2 = 2ème année de formation, etc.
                  </Text>
                  <Text as="p">
                    Dans le cas des CAP avec une durée théorique égale à 24 mois mais avec une durée réelle de 12 mois,
                    les apprentis sont déclarés en 2 et non en 1.
                  </Text>
                  <Text as="p">
                    Dans le cas des Bac Pro avec des cursus en durée réelle en 24 mois où les apprentis font
                    1ère–terminale, ils sont donc renseignés en 2 et en 3 l’année suivante.
                  </Text>
                  <Text as="p">
                    De manière générale, si les apprentis passent l’examen cette année sans redoubler, ils sont
                    renseignés en&nbsp;: 2 pour un CAP ou un BTS et en 3 pour un Bac Pro. Ce principe est appliqué pour
                    l’ensemble des diplômes quelle que soit leur durée théorique.
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
                    professionnelles (RNCP), dès lorsqu’ils sont préparés par la voie de l’apprentissage. L’affichage
                    permet, par l’usage de ce code, d’identifier la formation concernée et les effectifs par typologie
                    de formations et par secteur.
                  </Text>
                  <Text as="p">Format&nbsp;: 8 chiffres 1 lettre</Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Lieu de formation</Td>
              <Td>
                Les lieux de formations sont caractérisés par une adresse postale et des coordonnées de géolocalisation
                et toujours rattachés à un organisme de formation. La donnée «&nbsp;lieu de formation&nbsp;» provient des
                Carif-Oref. Si cette donnée est inconnue ou incorrecte, voir la marche à suivre.
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
                  <Text as="b">Les organisme «&nbsp;responsables&nbsp;»&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>
                      Ne dispensent pas de formation mais délègue à des organismes responsable et formateur ou
                      uniquement formateur ;
                    </ListItem>
                    <ListItem>Sont signataires de la convention de formation ;</ListItem>
                    <ListItem>Demandent et reçoit les financements de l’OPCO ;</ListItem>
                    <ListItem>
                      Sont responsables auprès de l’administration du respect de ses missions et obligations ;
                    </ListItem>
                    <ListItem>
                      Sont titulaires de la certification qualité en tant que CFA et est garant du respect des critères
                      qualité au sein de l’UFA.
                    </ListItem>
                  </UnorderedList>
                  <Text as="b">Les organisme «&nbsp;responsables et formateurs&nbsp;»&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>
                      Dispensent des actions de formation par apprentissage déclaré auprès des services de l’Etat (n° de
                      déclaration d’activité (NDA)) ;
                    </ListItem>
                    <ListItem>Sont signataires de la convention de formation ;</ListItem>
                    <ListItem>Demandent et reçoit les financements de l’OPCO ;</ListItem>
                    <ListItem>
                      Sont responsables auprès de l’administration du respect de ses missions et obligations ;
                    </ListItem>
                    <ListItem>
                      Sont titulaires de la certification qualité en tant que CFA et est garant du respect des critères
                      qualité au sein de l’UFA.
                    </ListItem>
                  </UnorderedList>
                  <Text as="b">Les organisme «&nbsp;formateurs&nbsp;»&nbsp;:</Text>
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
                  <Text as="p">Nombre d’organismes reconnus par le Tableau de bord comme&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>
                      trouvés dans le Catalogue des formations en apprentissage (base des Carif-Oref) ;
                    </ListItem>
                    <ListItem>identifiés par un SIRET (ouvert) et un UAI valable ;</ListItem>
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
                      Si les organismes associés à une offre de formation ont le même SIRET, on en déduit la nature
                      «&nbsp;responsable et formateur&nbsp;» et on se génère pas de relation.{" "}
                    </ListItem>
                    <ListItem>
                      Si les organismes associés à une offre de formation n’ont pas le même SIRET, on en déduit la
                      nature «&nbsp;responsable&nbsp;»pour l’un et formateur&nbsp;» pour l’autre, et on génère une
                      relation entre eux.
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
                branches professionnelles et acteurs régionaux. Ces entités peuvent se rassembler au sein d’associations
                ou de groupements consulaires afin de coordonner leurs actions et missions, en ayant des objectifs
                communs dans le domaine de la formation en apprentissage. L’objectif principal de ces réseaux est de
                favoriser la collaboration et la mise en commun des ressources pour promouvoir et soutenir
                l’apprentissage.
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">RNCP</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text>
                    Le Répertoire national des certifications professionnelles (RNCP) sert à tenir à la disposition de
                    tous une information constamment à jour sur les diplômes et les titres à finalité professionnelle
                    ainsi que sur les certificats de qualification. La mise à jour du RNCP est confiée à France
                    compétences. L’affichage permet, par l’usage de ce code, d’identifier la formation concernée et
                    pouvoir identifier les effectifs par typologie de formations et par secteur.
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
              <Td verticalAlign="top">SIREN</Td>
              <Td>
                La donnée «&nbsp;SIREN&nbsp;» provient de l’INSEE. Si cette information est erronée, merci de leur
                signaler.
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">UAI</Td>
              <Td>
                Unité Administrative Immatriculée&nbsp;: Ce code est composé de 7 chiffres suivis d’une lettre, les
                trois premiers chiffres indiquant le département. La donnée «&nbsp;UAI&nbsp;» affichée provient de la
                base de données RAMSESE et notamment exploité par la DEC avant d’être validée au niveau de chaque
                territoire.
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Zone d’emploi</Td>
              <Td>
                Espace géographique regroupant généralement plusieurs cantons et présentant une cohésion en matière
                d’infrastructures, de marché du travail et de mouvements économiques. Un bassin d’emploi est constitué
                généralement autour d’un pôle attractif et peut correspondre soit à une agglomération, soit à une
                micro-région industrielle développée à partir d’une activité spécifique ou d’une grande entreprise
                industrielle, soit à un territoire où se regroupent des activités diverses. Un bassin d’emploi est
                déterminé, selon l’INSEE, à partir du facteur déplacement domicile-travail dans un espace restreint
                permettant aux personnes actives de résider et travailler dans un établissement du bassin, et aux
                employeurs de recruter la main d’œuvre sur place. C’est l’aire de déplacements domicile-travail autour
                d’un pôle d’emplois de plus de 5.000 emplois.
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </Container>
    </SimplePage>
  );
}
