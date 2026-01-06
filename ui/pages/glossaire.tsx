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

import Link from "@/components/Links/Link";
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
                    Elle est censée refléter le niveau auquel est inscrit l’apprenti par rapport à la durée théorique du
                    cursus de formation. Par exemple, pour une formation de plusieurs années, numéro de l’année en cours
                    : 1 = 1ère année de formation, 2 = 2ème année de formation, etc.
                  </Text>
                  <Text as="p">
                    Dans le cas des CAP avec une durée théorique égale à 24 mois mais avec une durée réelle de 12 mois,
                    les apprentis sont déclarés en 1e et en 2e en N an 1.
                  </Text>
                  <Text as="p">
                    Dans le cas des Bac Pro avec des cursus en durée réelle en 24 mois où les apprentis font
                    1ère–terminale, ils sont donc renseignés en 2 et en 3 l’année suivante.
                  </Text>
                  <Text as="p">
                    De manière générale, si les apprentis passent l’examen cette année sans redoubler, ils sont
                    renseignés en : 2 pour un CAP ou un BTS et en 3 pour un Bac Pro. Ce principe est appliqué pour
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
                    <Link href="https://www.insee.fr/fr/accueil" isExternal isUnderlined color="blueFrance">
                      www.insee.fr
                    </Link>
                    . Cette nomenclature est mise à jour chaque année.
                  </Text>
                  <Text as="p">Attention : ne pas confondre avec les codes postaux.</Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Code Formation Diplôme (CFD)</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Le{" "}
                    <Link
                      href="https://catalogue-apprentissage.intercariforef.org"
                      isExternal
                      isUnderlined
                      color="blueFrance"
                    >
                      Code Formation Diplôme
                    </Link>{" "}
                    est une codification qui concerne l’ensemble des diplômes technologiques et professionnels des
                    ministères certificateurs (Éducation Nationale).
                  </Text>
                  <Text as="p">
                    Y sont ajoutés, en tant que de besoin et à la demande des centres de formation par l’apprentissage,
                    les autres diplômes et titres inscrits au répertoire national des certifications professionnelles
                    (RNCP), dès lorsqu’ils sont préparés par la voie de l’apprentissage. L’affichage permet, par l’usage
                    de ce code, d’identifier la formation concernée et les effectifs par typologie de formations et par
                    secteur.
                  </Text>
                  <Text as="p">
                    Les codes diplômes peuvent être trouvés sur le Catalogue des offres de formations en apprentissage.
                    Format : la codification des diplômes et certifications préparés par la voie de l’apprentissage se
                    traduit par un code à 8 positions (exemple : 40025510).
                  </Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">DECA</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    La{" "}
                    <Link
                      href="https://mesdemarches.emploi.gouv.fr/identification/login?TARGET=https%3A%2F%2Fdeca.alternance.emploi.gouv.fr%3A443%2Fdeca-app%2F"
                      isExternal
                      isUnderlined
                      color="blueFrance"
                    >
                      plateforme DECA
                    </Link>
                    , pour Dépôts des Contrats d’Alternance, est gérée par le Ministère du Travail, de la Santé et des
                    Solidarités. Une entreprise qui signe un contrat d’apprentissage doit le transmettre à son Opérateur
                    de Compétences (OPCO) pour instruction, prise en charge financière et dépôt de ces contrats auprès
                    des services du Ministère.
                  </Text>
                  <Text as="p">
                    Le Tableau de bord de l’apprentissage intègre et restitue les données issues de DECA, actualisées
                    régulièrement.
                  </Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Enquête SIFA</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Enquête annuelle obligatoire recensant tous les apprentis inscrits au 31 décembre de chaque année en
                    centre de formation des apprentis (CFA) ou en section d&apos;apprentissage (SA). Elle est produite
                    par la Direction de l&apos;évaluation, de la prospective et de la performance (DEPP) au Ministère de
                    l&apos;éducation nationale et de la jeunesse.
                  </Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Lieu de formation</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Le lieu de formation est l’adresse physique où l’apprenti se rend pour suivre la totalité ou la
                    majeure partie de la formation. La formation peut être 100 % à distance. Les lieux de formations
                    sont caractérisés par une adresse postale et des coordonnées de géolocalisation et toujours rattaché
                    à un organisme de formation.
                  </Text>
                  <Text as="p">
                    La donnée “lieu de formation” provient des Carif-Oref. Si cette donnée est inconnue ou incorrecte,{" "}
                    <Link
                      href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                      isExternal
                      isUnderlined
                      color="blueFrance"
                    >
                      contactez votre Carif-Oref
                    </Link>
                    .
                  </Text>
                </Flex>
                .
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Nature de l’organisme</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Trois natures d’organismes peuvent être observées via le{" "}
                    <Link
                      href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                      isExternal
                      isUnderlined
                      color="blueFrance"
                    >
                      Catalogue des offres de formation en apprentissage
                    </Link>{" "}
                    :
                  </Text>
                  <Text as="b">Les organismes « responsables » :</Text>
                  <UnorderedList>
                    <ListItem>
                      Ne dispensent pas de formation mais délèguent à des organismes responsables et formateurs ou
                      uniquement formateurs ;
                    </ListItem>
                    <ListItem>Sont signataires de la convention de formation ;</ListItem>
                    <ListItem>Demandent et reçoivent les financements de l’OPCO ;</ListItem>
                    <ListItem>
                      Sont responsables auprès de l’administration du respect de ses missions et obligations ;
                    </ListItem>
                    <ListItem>
                      Sont titulaires de la certification qualité en tant que CFA et est garant du respect des critères
                      qualité au sein de l’UFA.
                    </ListItem>
                  </UnorderedList>
                  <Text as="b">Les organismes « responsables et formateurs » :</Text>
                  <UnorderedList>
                    <ListItem>
                      Dispensent des formations par apprentissage déclarées auprès des services de l’État (n° de
                      déclaration d’activité (NDA)) ;
                    </ListItem>
                    <ListItem>Sont signataires de la convention de formation ;</ListItem>
                    <ListItem>Demandent et reçoivent les financements de l’OPCO ;</ListItem>
                    <ListItem>
                      Sont responsables envers l’administration quant au respect de leurs missions et obligations ;
                    </ListItem>
                    <ListItem>
                      Détiennent la certification qualité en tant que CFA et veillent à respecter les critères qualité
                      au sein de l’UFA.
                    </ListItem>
                  </UnorderedList>
                  <Text as="b">Les organismes « formateurs » :</Text>
                  <UnorderedList>
                    <ListItem>Sont garant du respect de la mise en oeuvre pédagogique de la formation.</ListItem>
                    <ListItem>
                      Dispensent des actions de formation par apprentissage déclarées auprès des services de l’État (n°
                      de déclaration d’activité (NDA))
                    </ListItem>
                    <ListItem>
                      Dispensent des actions de formation par apprentissage déclarées auprès des services de l’État (n°
                      de déclaration d’activité (NDA))
                    </ListItem>
                  </UnorderedList>
                  <Text as="p">
                    Si la nature d’un organisme est affichée “Inconnue” sur le Tableau de bord de l’apprentissage, ce
                    dernier doit se rapprocher de son Carif-Oref Régional pour faire{" "}
                    <Link
                      href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                      isExternal
                      isUnderlined
                      color="blueFrance"
                    >
                      référencer son offre de formation en apprentissage
                    </Link>
                    .
                  </Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Numéro de déclaration d’activité (NDA)</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Un organisme réalisant des prestations de formation professionnelle (dont apprentissage) doit
                    obtenir un numéro de déclaration d’activité auprès du service régional de contrôle de la Dreets
                    (ex-Direccte).
                  </Text>
                  <Text as="p">
                    La donnée &quot;NDA&quot; est disponible sur le{" "}
                    <Link
                      href="https://referentiel.apprentissage.onisep.fr/organismes"
                      isExternal
                      isUnderlined
                      color="blueFrance"
                    >
                      Référentiel UAI-SIRET
                    </Link>{" "}
                    de l’ONISEP et provient de la{" "}
                    <Link
                      href="https://www.data.gouv.fr/fr/datasets/liste-publique-des-organismes-de-formation-l-6351-7-1-du-code-du-travail/"
                      isExternal
                      isUnderlined
                      color="blueFrance"
                    >
                      Liste Publique des Organismes de Formations
                    </Link>
                    . Si cette information est erronée, merci de leur signaler.
                  </Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Niveau de formation</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">Nomenclature des diplômes par niveau :</Text>
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
                  <Text as="p">Organismes de formation approuvés par le Tableau de bord, incluant ceux :</Text>
                  <UnorderedList>
                    <ListItem>
                      répertoriés dans le{" "}
                      <Link
                        href="https://catalogue-apprentissage.intercariforef.org"
                        isExternal
                        isUnderlined
                        color="blueFrance"
                      >
                        Catalogue des ofrres de formations en apprentissage
                      </Link>{" "}
                      (base des Carif-Oref) et{" "}
                      <Link
                        href="https://referentiel.apprentissage.onisep.fr/organismes"
                        isExternal
                        isUnderlined
                        color="blueFrance"
                      >
                        Référentiel UAI-SIRET
                      </Link>
                    </ListItem>
                    <ListItem>
                      identifiés avec les détails suivants : UAI, SIREN, SIRET (en activité), Nature (Responsable,
                      Responsable et formateur, Formateur)
                    </ListItem>
                  </UnorderedList>
                  <Text as="p">
                    Numéro de déclaration d’activité (NDA), Certification Qualiopi, Nom commercial, Dénomination
                    sociale, Appartenance à un réseau, Adresse, Région, Académie
                  </Text>
                  <Text as="p">
                    Ce nombre inclut : les OFA « historiques », les OFA académiques et d’entreprise, les lycées avec une
                    section apprentissage.
                  </Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Qualiopi</Td>
              <Td>
                <Flex gap="2" flexDirection="column" alignItems="left">
                  <Text as="p">
                    Qualiopi est une certification qui atteste de la qualité du processus mis en œuvre par les
                    prestataires de la formation en apprentissage. Elle permet pour un CFA d’être référencé auprès des
                    financeurs publics et paritaires. Depuis janvier 2022, tous les CFA qui souhaitent accéder à des
                    fonds publics ou mutualisés doivent être certifiés Qualiopi.
                  </Text>
                  <Text as="p">
                    Pour savoir si un organisme de formation est certifié Qualiopi, consultez l’
                    <Link isExternal isUnderlined color="blueFrance" href="https://annuaire-entreprises.data.gouv.fr/">
                      Annuaire des Entreprises
                    </Link>
                    , dans l’onglet “Labels et certificats”.
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
                      “responsable et formateur” et on ne génère pas de relation.
                    </ListItem>
                    <ListItem>
                      Si les organismes associés à une offre de formation n’ont pas le même SIRET, on en déduit la
                      nature “responsable” pour l’un et “formateur” pour l’autre, et on génère une relation entre eux.
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
                    <Link
                      href="https://www.francecompetences.fr/reguler-le-marche/certification-professionnelle/"
                      isExternal
                      isUnderlined
                      color="blueFrance"
                    >
                      www.francecompetences.fr/reguler-le-marche/certification-professionnelle
                    </Link>
                    ).
                  </Text>
                </Flex>
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">Secteur d’activité</Td>
              <Td>
                Notre nomenclature se base sur le{" "}
                <Link
                  href="https://www.francetravail.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html"
                  isExternal
                  isUnderlined
                  color="blueFrance"
                >
                  Code ROME
                </Link>
                , un référentiel conçu par Pôle emploi et actualisé régulièrement, tenant compte des évolutions du
                marché du travail. Il présente l’ensemble des métiers regroupés par fiches, organisées par 14 grands
                domaines professionnels. Ces fiches proposent une description détaillée des métiers : définition, accès
                à l’emploi, compétences (savoir-faire, savoir-être professionnels et savoirs), contextes de travail, et
                mobilité professionnelle.
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">SIRET</Td>
              <Td>
                Le numéro Siret (Système d’Identification du Répertoire des Etablissements) est un numéro
                d’immatriculation unique de chaque établissement d’une entreprise (l’unité légale). Il se compose de 14
                chiffres attribués par l’INSEE. Le Siret permet l’identification de chaque établissement par les
                administrations et organismes publics. Lorsqu’un organisme de formation change de domiciliation, il doit
                obtenir un nouveau Siret, qu’il devra mettre à jour sur son compte{" "}
                <Link
                  href="https://info.monactiviteformation.emploi.gouv.fr/"
                  isExternal
                  isUnderlined
                  color="blueFrance"
                >
                  Mon Activité Formation
                </Link>
                , et le signaler à son Carif-Oref, la DREETS, le Rectorat de son Académie et OPCO. Pour plus
                d’informations, contacter l’{" "}
                <Link isExternal isUnderlined color="blueFrance" href="https://www.insee.fr/fr/accueil">
                  INSEE
                </Link>{" "}
                ou se connecter via le{" "}
                <Link isExternal isUnderlined color="blueFrance" href="https://procedures.inpi.fr/?/">
                  Guichet Unique
                </Link>{" "}
                (INPI).
              </Td>
            </Tr>
            <Tr>
              <Td verticalAlign="top">UAI</Td>
              <Td>
                Le code UAI (Unité Administrative Immatriculée) composé de 7 chiffres et 1 lettre, est un code attribué
                par le Ministère de l’Éducation nationale aux établissements d’enseignement (écoles, collèges, lycées,
                universités, etc.). Il est utilisé pour les identifier dans différentes bases de données et systèmes
                administratifs. La donnée “UAI” affichée sur le Tableau de bord provient du{" "}
                <Link
                  href="https://referentiel.apprentissage.onisep.fr/organismes"
                  isExternal
                  isUnderlined
                  color="blueFrance"
                >
                  Référentiel UAI-SIRET
                </Link>{" "}
                des OFA-CFA (ONISEP) et de la base de données{" "}
                <Link isExternal isUnderlined color="blueFrance" href="https://dep.adc.education.fr/acce/index.php">
                  RAMSESE
                </Link>{" "}
                et notamment exploité par la DEC avant d’être validée au niveau de chaque territoire.
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
