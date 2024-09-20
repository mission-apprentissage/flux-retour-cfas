import { ArrowForwardIcon, CheckCircleIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Container,
  Divider,
  Flex,
  HStack,
  Heading,
  Image,
  ListItem,
  Tag,
  TagLeftIcon,
  Text,
  UnorderedList,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import { ERPS } from "shared";

import { FAQ_PATH } from "@/common/constants/faq";
import { CONTACT_ADDRESS } from "@/common/constants/product";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { BaseAccordionGroup } from "@/components/BaseAccordionGroup/BaseAccordionGroup";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import { DownloadLine, LockFill } from "@/theme/components/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const OrganismesFormationPage = () => {
  return (
    <SimplePage title="Organismes de formation en apprentissage - Tableau de bord de l’apprentissage">
      <Container maxW="xl" py="16" display="flex" alignItems="center" gap="16">
        <Box flex="3">
          <Heading as="h1" fontSize="xl">
            Organismes de formation en apprentissage et réseaux
          </Heading>
          <Heading as="h2" fontSize="40px" color="blue_cumulus_main" mt={4}>
            Participez au rayonnement de l’apprentissage en France
          </Heading>

          <Text fontSize="xl" mt={5}>
            Simplifiez vos démarches administratives, rendez vos formations visibles, soutenez les parcours de vos
            apprenants.
          </Text>

          <HStack gap={5} mt={5}>
            <Link variant="blueBg" href="/auth/inscription">
              Je m’inscris
            </Link>
            <Link variant="whiteBg" href="/auth/connexion">
              J’ai déjà un compte
            </Link>
          </HStack>
        </Box>

        <Image src="/images/landing-ofa-designer.svg" alt="" flex="1" userSelect="none" />
      </Container>

      <Box bg="#F5F5FE">
        <Container maxW="xl" py="14" display="flex" alignItems="center" gap="16">
          <Flex gap={12}>
            <Box flex="75">
              <Heading as="h3" fontSize="32px" color="blue_cumulus_main">
                Connexion simple, transmission automatique, services immédiats
              </Heading>

              <UnorderedList fontSize="delta" mt="30px">
                <ListItem>
                  <b>Suivez efficacement vos sites formateurs et effectifs</b> grâce au suivi des jeunes, des taux de
                  rupture des contrats, des taux de succès, une analyse par formations...
                </ListItem>
                <ListItem>
                  <b>Augmentez la visibilité de vos formations</b> et attirez plus d&apos;apprenants grâce à un meilleur
                  référencement !
                </ListItem>
                <ListItem>
                  <b>Multipliez les candidatures</b> à vos formations grâce à notre service voisin{" "}
                  <Link
                    href="https://4x1qe.r.sp1-brevo.net/mk/cl/f/sh/WCPzyXJTZ72ikBe3C3exQ4Q3wTKxxzF4/hjk9O0lvGjQW"
                    target="_blank"
                    textDecoration="underline"
                    isExternal
                    whiteSpace="nowrap"
                  >
                    La bonne alternance
                  </Link>
                </ListItem>

                <ListItem>
                  <b>Simplifiez vos démarches administratives</b> et générez en un clic votre fichier SIFA et vos
                  contrats d&apos;apprentissage CERFA
                </ListItem>

                <ListItem>
                  <b>Facilitez votre relation avec les services publics</b> en offrant une visibilité claire de votre
                  activité et des parcours de vos apprentis
                </ListItem>
              </UnorderedList>
            </Box>
            <Box flex="25">
              <Box backgroundColor="#FFFFFF" height="100%" p="30px">
                <Image
                  src="/images/landing-operateurs-publics-beta-testeurs.svg"
                  alt=""
                  userSelect="none"
                  width="50%"
                />
                <Text fontWeight="700" fontSize="24px" mt="10px">
                  Des webinaires pour vous accompagner
                </Text>
                <Text fontWeight="400" fontSize="omega" lineHeight="25px" mt="10px">
                  Nous vous proposons des webinaires réguliers pour vous aider à vous connecter au Tableau de bord.
                </Text>
                <Link
                  mt="20px"
                  isExternal={true}
                  variant="blueBg"
                  href="https://4x1qe.r.bh.d.sendibt3.com/mk/cl/f/sh/28xHLtxZQ0KqQgjLXw96JKt9fapCvHahkI/v9qRkDFsfh-U"
                >
                  Je participe
                </Link>
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>
      <Container maxW="xl">
        <Divider size="md" mb={16} borderBottomWidth="2px" opacity="1" />

        <Heading as="h3" fontSize="32px" color="blue_cumulus_main" mt={16}>
          Transmettez facilement vos effectifs{" "}
          <Text fontSize="sm" color="#666666" mt={2}>
            (Temps estimé : 15min)
          </Text>
        </Heading>
        <Image src="/images/landing-ofa-timeline.svg" alt="Etapes clés usage" userSelect="none" w="100%" mt={8} />

        <Divider size="md" my={16} borderBottomWidth="2px" opacity="1" />

        <Heading as="h3" fontSize="beta" color="blue_cumulus_main">
          Le Tableau de bord est compatible avec votre outil de gestion
        </Heading>
        <HStack gap={24}>
          <VStack gap={6} alignItems="start">
            <Text fontSize="lg" mt={5}>
              Aujourd’hui, il est connecté avec ces ERP&nbsp;:
            </Text>
            <Wrap>
              {ERPS.filter((erp) => !erp.disabled)
                .reverse()
                .map(({ name, id }) => (
                  <ERPTag key={id}>{name}</ERPTag>
                ))}
            </Wrap>
            <Text fontSize="sm" color="#666666" mt={5}>
              Un outil de gestion / ERP (Enterprise Ressource Planning ou PGI pour Progiciel de Gestion Intégré) est une
              solution logicielle permettant d’unifier le système d’information d’une entreprise autour d’une base de
              données unique.
            </Text>
            <Text fontSize="lg" mt={5}>
              Nous collaborons avec d’autres éditeurs d’ERP pour faciliter le taux de transmission.
            </Text>
          </VStack>
          <Box borderLeft="4px solid #6A6AF4" pl={8} maxW="264px">
            <Text fontWeight="bold">Vous n’utilisez pas ces ERP ?</Text>
            <Text>Le tableau de bord vous permet de transmettre vos effectifs sans logiciel supplémentaire.</Text>
          </Box>
        </HStack>

        <HStack mt={10} justifyContent="end" mb={16}>
          <LockFill color="bluefrance" boxSize="4" />
          <Text>
            Pour démarrer la transmission,{" "}
            <Link
              href="/auth/connexion"
              plausibleGoal="clic_homepage_connexion_carto"
              borderBottom="1px solid"
              _hover={{ textDecoration: "none" }}
            >
              connectez-vous
            </Link>{" "}
            ou{" "}
            <Link
              href="/auth/inscription"
              plausibleGoal="clic_homepage_inscription_carto"
              borderBottom="1px solid"
              _hover={{ textDecoration: "none" }}
            >
              créez un compte
            </Link>
            .
          </Text>
        </HStack>
      </Container>

      <Box bg="#F5F5FE">
        <Container maxW="xl" py="14" display="flex" alignItems="center" gap="16">
          <Box>
            <Heading as="h3" fontSize="32px" color="blue_cumulus_main">
              Protection de vos données et effectifs
            </Heading>
            <Text fontSize="lg" mt={5}>
              Le tableau de bord de l’apprentissage est construit dans le{" "}
              <strong>respect strict de la vie privée des personnes</strong> et{" "}
              <strong>applique les standards de sécurité de l’État</strong>.
            </Text>
            <Link
              href="protection-des-donnees"
              color="action-high-blue-france"
              borderBottom="1px"
              textDecoration="none"
              _hover={{ textDecoration: "none" }}
              display="inline-block"
              mt={8}
            >
              <ArrowForwardIcon mr={1} />
              Notre politique de protection des données
            </Link>
          </Box>
          <Image src="/images/landing-ofa-protection.svg" alt="" flex="1" userSelect="none" />
        </Container>
      </Box>

      <Container maxW="xl" py="14">
        <Heading as="h3" fontSize="32px" color="blue_cumulus_main">
          Des questions ?
        </Heading>
        <BaseAccordionGroup
          AccordionItemsDetailList={[
            {
              title: "Puis-je être accompagné dans la connexion de mon logiciel de gestion au tableau de bord ?",
              content: (
                <Text>
                  Situation 1 : vous utilisez un des logiciels de gestion (ERP) branchés au tableau de bord, vous pouvez
                  transmettre vos données en quelques clics à l’aide des tutoriels qui vous seront proposés sur l’écran
                  de paramétrage et{" "}
                  <Link
                    href={FAQ_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="action-high-blue-france"
                    borderBottom="1px"
                    _hover={{ textDecoration: "none" }}
                  >
                    dans notre FAQ
                  </Link>
                  <br />
                  <br />
                  Situation 2 : vous utilisez un autre logiciel de gestion (ERP) qui n’est pas encore branché, demandez
                  à votre ERP de se brancher au Tableau de bord et transmettez-lui la{" "}
                  <Link
                    href="https://mission-apprentissage.notion.site/Documentation-d-int-gration-API-v3-Tableau-de-bord-de-l-apprentissage-918e2bfcff78478b8f310f27eebdeb27"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="action-high-blue-france"
                    borderBottom="1px"
                    _hover={{ textDecoration: "none" }}
                  >
                    documentation API ERP
                  </Link>{" "}
                  . En attendant que votre demande soit prise en compte, vous pouvez transmettre vos effectifs par
                  fichier Excel dans l’onglet “Mes effectifs” de votre Tableau de bord. (voir ci-dessous Situation 3).
                  <br />
                  <br />
                  Situation 3 : vous utilisez vos propres outils de suivi de vos effectifs en apprentissage, vous pouvez
                  transmettre vos effectifs par fichier Excel dans l’onglet “Mes effectifs” de votre Tableau de bord. Si
                  vous utilisez un SI “maison” vous pouvez également envisager d’utiliser notre API et brancher votre
                  SI, pour cela voici notre{" "}
                  <Link
                    href="https://mission-apprentissage.notion.site/Documentation-d-int-gration-API-v3-Tableau-de-bord-de-l-apprentissage-918e2bfcff78478b8f310f27eebdeb27"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="action-high-blue-france"
                    borderBottom="1px"
                    _hover={{ textDecoration: "none" }}
                  >
                    documentation API ERP
                  </Link>{" "}
                  <br />
                  <br />
                  L’équipe du tableau de bord reste également à vos côtés pour vous accompagner&nbsp;:{" "}
                  <Link
                    href={`mailto:${CONTACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whiteSpace="nowrap"
                    color="action-high-blue-france"
                    borderBottom="1px"
                    _hover={{ textDecoration: "none" }}
                  >
                    {CONTACT_ADDRESS}
                  </Link>
                </Text>
              ),
            },
            {
              title: "Dois-je informer les apprenantes et les apprenants que je transmets leurs données ?",
              content: (
                <>
                  <Text>
                    Il n’est pas nécessaire de recueillir une nouvelle fois le consentement de vos apprenants et
                    apprenantes lorsque vous transmettez leurs données à caractère personnel au tableau de bord de
                    l’apprentissage puisque&nbsp;:
                  </Text>
                  <UnorderedList>
                    <ListItem>la base légale du traitement précise cette transmission ;</ListItem>
                    <ListItem>
                      la politique de confidentialité précise cette transmission et recense les destinataires ;
                    </ListItem>
                    <ListItem>
                      la mention d’information envoyée par courriel aux apprenants et apprenantes précise cette
                      transmission.
                    </ListItem>
                  </UnorderedList>
                </>
              ),
            },
            {
              title: "J’ai changé d’ERP ou je n’ai plus d’ERP, comment puis-je transmettre mes données ?",
              content: (
                <>
                  <UnorderedList>
                    <ListItem>
                      Vous transmettiez déjà vos données et vous avez changé d’ERP ou alors vous venez juste de mettre
                      en place un ERP&nbsp;: paramétrez votre nouvel ERP à l’aide des documents que vous retrouvez dans
                      la question “Comment configurer mon ERP ?”
                    </ListItem>
                    <ListItem>
                      Vous transmettiez déjà vos données automatiquement via votre ERP mais vous n’en utilisez
                      plus&nbsp;: vous pouvez transmettre vos données directement sur l’interface, en utilisant notre
                      modèle de fichier ou en utilisant votre propre fichier.
                    </ListItem>
                  </UnorderedList>
                </>
              ),
            },
            {
              title: "Mon établissement a plusieurs UAI, laquelle renseigner ?",
              content: (
                <>
                  <Text>
                    Le tableau de bord vous invite à renseigner l’UAI correspondante à l’établissement responsable ou
                    celle correspondante au responsable-formateur.
                  </Text>
                  <Text mt="1em">Voici les définitions des différentes natures d’établissement&nbsp;:</Text>
                  <Text mt="1em">L’organisme responsable&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>
                      ne dispense pas de formation mais délègue à des organismes responsable et formateur ou uniquement
                      formateur ;
                    </ListItem>
                    <ListItem>est signataire de la convention de formation ;</ListItem>
                    <ListItem>demande et reçoit les financements de l’OPCO ;</ListItem>
                    <ListItem>
                      est responsable auprès de l’administration du respect de ses missions et obligations ;
                    </ListItem>
                    <ListItem>
                      est titulaire de la certification qualité en tant que CFA et est garant du respect des critères
                      qualité au sein de l’UFA.
                    </ListItem>
                  </UnorderedList>
                  <Text mt="1em">L’organisme responsable-formateur&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>
                      dispense des actions de formation par apprentissage déclaré auprès des services de l’Etat (n° de
                      déclaration d’activité (NDA) ;
                    </ListItem>
                    <ListItem>est signataire de la convention de formation ;</ListItem>
                    <ListItem>demande et reçoit les financements de l’OPCO ;</ListItem>
                    <ListItem>
                      est responsable auprès de l’administration du respect de ses missions et obligations ;
                    </ListItem>
                    <ListItem>
                      est titulaire de la certification qualité en tant que CFA et est garant du respect des critères
                      qualité au sein de l’UFA.
                    </ListItem>
                  </UnorderedList>
                  <Text mt="1em">L’organisme formateur&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>
                      dispense des actions de formation par apprentissage déclaré auprès des services de l’Etat (n° de
                      déclaration d’activité (NDA).
                    </ListItem>
                  </UnorderedList>
                  <Text mt="1em">
                    Le tableau de bord s’appuie sur le référentiel des organismes de formation en apprentissage afin de
                    retrouver vos liens avec les autres organismes, notamment les organismes “Responsables”.
                  </Text>
                  <Text mt="1em">
                    Pour connaître la nature de votre établissement en fonction de son n°UAI ou de son n°SIRET, ou pour
                    avoir plus d’informations sur les UAI, consultez le référentiel national de l’apprentissage&nbsp;:{" "}
                    <Link
                      href="https://referentiel.apprentissage.onisep.fr/"
                      target="_blank"
                      rel="noopener noreferrer"
                      whiteSpace="nowrap"
                    >
                      https://referentiel.apprentissage.onisep.fr
                    </Link>
                  </Text>
                </>
              ),
            },
            {
              title: <>J’ai constaté une erreur dans les chiffres affichés&nbsp;: comment faire ?</>,
              content: (
                <>
                  <Text>Certains écarts peuvent être dus&nbsp;:</Text>
                  <UnorderedList>
                    <ListItem>à une erreur de saisie à la source ;</ListItem>
                    <ListItem>à une absence de mise à jour du statut de l’apprenant à la source ;</ListItem>
                    <ListItem>au délai de mise à jour de la donnée ;</ListItem>
                    <ListItem>
                      à des pratiques de saisie observées chez certains utilisateurs (par exemple, concernant les
                      abandons, il se peut simplement que l’apprenant ait arrêté l’apprentissage faute de contrat pour
                      poursuive sa formation en voie scolaire ; concernant les jeunes sans contrat, certains ne sont pas
                      comptabilisés car certains organismes n’inscrivent les élèves que lorsqu’ils ont un contrat) ;
                    </ListItem>
                    <ListItem>
                      à la transmission des effectifs par un organisme formateur avec l’UAI de l’organisme responsable
                      ou responsable-formateur (lequel peut constater un écart entre la totalité des effectifs de ses
                      formateurs et ce qu’il voit car les données sont transmises par tout ou partie des formateurs).
                    </ListItem>
                  </UnorderedList>

                  <Text mt="1em">
                    Aidez-nous à contribuer à l’amélioration du tableau de bord et de ses données en nous faisant part
                    des erreurs que vous constatez, contactez-nous par courriel&nbsp;:{" "}
                    <Link
                      href={`mailto:${CONTACT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whiteSpace="nowrap"
                      color="action-high-blue-france"
                      borderBottom="1px"
                      _hover={{ textDecoration: "none" }}
                    >
                      {CONTACT_ADDRESS}
                    </Link>
                  </Text>
                </>
              ),
            },
          ]}
        />

        <Link
          href={FAQ_PATH}
          color="action-high-blue-france"
          borderBottom="1px"
          textDecoration="none"
          _hover={{ textDecoration: "none" }}
          isExternal
          display="inline-block"
          mt={8}
        >
          <ArrowForwardIcon mr={1} />
          Voir davantage de questions
        </Link>
      </Container>

      <Box bg="#F9F8F6" mb={-8}>
        <Container maxW="xl" py="14">
          <Heading as="h3" fontSize="32px" color="blue_cumulus_main">
            Liens utiles
          </Heading>

          <Box my={10}>
            <LienUtile
              title="Vade-mecum CFA"
              description="Connaître les modalités pratiques de gestion et de financement des contrats d’apprentissage"
              href="https://www.cfadock.fr/doc/Vade-mecum%20CFA.pdf"
              isDownloadLink
            />
            <LienUtile
              title="Guide précis de l’apprentissage "
              description="Pour avoir des repères juridiques sur l’apprentissage "
              href="https://travail-emploi.gouv.fr/IMG/pdf/precis-apprentissage.pdf"
              isDownloadLink
            />
            <LienUtile
              title="Contrat d’apprentissage"
              description="Formulaire CERFA n°10103*10 et sa notice d’utilisation"
              href="https://entreprendre.service-public.fr/vosdroits/R1319"
            />
            <LienUtile
              title="Aides à l’embauche pour un contrat d’apprentissage"
              description="Ministère du Travail, du Plein Emploi et de l’Insertion"
              href="https://travail-emploi.gouv.fr/formation-professionnelle/formation-en-alternance-10751/apprentissage/embaucher-un-apprenti/article/les-aides-a-l-embauche-pour-un-contrat-d-apprentissage"
            />
            <LienUtile
              title="Référentiel des organismes en Apprentissage"
              description="Lister les organismes, leurs relations et leurs lieux de formation"
              href="https://referentiel.apprentissage.onisep.fr/"
            />
            <LienUtile
              title="Catalogue des formations en Apprentissage"
              description="Recenser les formations sur les bases “Offre des Carif-Oref” de chaque région"
              href="https://catalogue-apprentissage.intercariforef.org/"
            />
            <LienUtile
              title="Connaître l’OPCO d’un SIRET"
              description="Associer l’OPCO de rattachement pour une entreprise grâce à son numéro SIRET"
              href="https://quel-est-mon-opco.francecompetences.fr/"
            />
          </Box>
        </Container>
      </Box>
    </SimplePage>
  );
};

export default OrganismesFormationPage;

function ERPTag({ children }: { children: string }) {
  return (
    <Tag size="lg" borderRadius="1em" py={2} px={3}>
      <TagLeftIcon as={CheckCircleIcon} />
      <Text fontWeight="bold">{children}</Text>
    </Tag>
  );
}

interface LienUtileProps {
  title: string;
  description: string;
  href: string;
  isDownloadLink?: boolean;
}

function LienUtile(props: LienUtileProps) {
  return (
    <HStack color="#3A3A3A" borderBottom="2px solid #ECEAE3" p={4} alignItems="baseline">
      <Box fontSize="lg" fontWeight="bold">
        {props.title}
      </Box>
      <Box flex="1" fontSize="sm">
        {props.description}
      </Box>
      <Link color="bluefrance" borderBottom="1px" _hover={{ textDecoration: "none" }} href={props.href} isExternal>
        {props.isDownloadLink ? (
          <>
            <DownloadLine mr={2} /> Télécharger
          </>
        ) : (
          <>
            <ExternalLinkIcon mr={2} /> Consulter
          </>
        )}
      </Link>
    </HStack>
  );
}
