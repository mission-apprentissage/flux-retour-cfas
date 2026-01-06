import { Box, Container, Heading, ListItem, Text, UnorderedList, Link as ChakraLink } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";
import { SUPPORT_PAGE_ACCUEIL } from "shared";

import { PRODUCT_NAME } from "@/common/constants/product";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { BaseAccordionGroup } from "@/components/BaseAccordionGroup/BaseAccordionGroup";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Link from "@/components/Links/Link";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export default function CommentFonctionneLeTdb() {
  const title = "Comment fonctionne le tableau de bord ?";

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Box w="100%" pt={[4, 6]} px={[1, 1, 6, 8]}>
        <Container maxW="xl">
          <Breadcrumb pages={[{ title: "Questions & réponses", path: "/questions-reponses" }, { title }]} />
          <Heading textStyle="h2" color="grey.800" mt={5}>
            Une question ? Quelques éléments de réponse.
          </Heading>
          <Box marginTop="2w">
            <Link href="/questions-reponses" isUnderlined>
              <Box as="i" className="ri-arrow-left-line" /> Revenir à la page principale
            </Link>
          </Box>

          <Section paddingY="4w">
            <Heading as="h2" fontSize="28px">
              Comment fonctionne le {PRODUCT_NAME} ?
            </Heading>
            <BaseAccordionGroup
              AccordionItemsDetailList={[
                {
                  title: "Fonctionnement général du tableau de bord de l’apprentissage",
                  content: (
                    <Box>
                      <Text>
                        Le tableau de bord permet de visualiser en temps réel la situation de l’apprentissage sur un
                        territoire grâce à l’agrégation quotidienne de données des CFA (centres de formation de
                        l’apprentissage, qui sont en charge de transmission des contrats à l’OPCO) et auprès des OF
                        (organisme de formation, qui assurent dans leurs locaux les formations en apprentissage).
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Comment sont collectées les données ?",
                  content: (
                    <Box>
                      <Text>
                        Pour simplifier les démarches de collecte de données, qui étaient auparavant effectuées par
                        chacune des administrations (Académie, DREETS, etc), le tableau de bord agrège les données
                        depuis les ERP des établissements de formation. les données utiles directement via l’ERP de
                        l’établissement.
                        <br />
                        <br />
                        L’ERP est le logiciel utilisé par les établissements pour effectuer le suivi de leurs effectifs
                        d’apprenties et d’apprentis.
                        <br />
                        <br />
                        L’équipe du tableau de bord travaille à une solution pour que les établissements non équipés
                        d’un ERP interfaçable, puissent déposer les données utiles. Cette solution sera disponible
                        gratuitement sur le site du tableau de bord, au quatrième trimestre 2022.
                        <br />
                        <br />
                        Pour en savoir plus, consultez{" "}
                        <Link href="/organisme-formation/transmettre" color="bluefrance" isUnderlined>
                          Comment transmettre les données de mon organisme au tableau de bord de l’apprentissage ?
                          <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Quelles données sont collectées ?",
                  content: (
                    <Box>
                      <Text>
                        Nous collectons les données permettant d’identifier une apprenante ou un apprenant, ces données
                        personnelle ne sont pas restituées dans le tableau de bord.
                        <br />
                        <br />
                        Les données collectées sont liées à l’organisme, à la formation, et au statut de l’apprenant
                        (stagiaire de la formation professionnelle, apprentie ou apprenti, en rupture de contrat, en
                        abandon) afin de donner une vision globale de l’apprentissage à un instant donné.
                        <br />
                        <br />
                        Pour en savoir plus, consultez le détail sur la rubrique{" "}
                        <Link href="/comprendre-les-donnees" color="bluefrance" isUnderlined>
                          Comprendre les données <Box as="i" className="ri-links-line" />
                        </Link>
                        <br />
                        <br />
                        L’AIPD (Analyse d’Impact Relative à la Protection des Données) est disponible sur simple demande
                        à l’équipe du tableau de bord :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isExternal
                          isUnderlined
                        >
                          contactez-nous
                        </Link>
                        .
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Que recouvrent les chiffres clefs de l’apprentissage ?",
                  content: (
                    <Box>
                      <Text>
                        L’équipe du tableau de bord récolte des données permettant d’identifier, de fiabiliser et de
                        contrôler les données concernant les apprenantes et apprenants, les formations, les contrats et
                        les organismes de formation.
                        <br />
                        <br />
                        Aucune donnée n’est modifiée ou retraitée. Elles permettent d’identifier le nombre d’
                        “apprentis” (avec formation et contrat), de stagiaires de la formation professionnelle ou
                        “inscrits sans contrat” (inscrits en formation mais sans aucun contrat pour cette formation), de
                        “rupturants” (inscrits en formation avec un contrat rompu en attente d’un nouveau contrat),
                        “abandons” (ayant quitté la formation et l’employeur).
                        <br />
                        <br />
                        Pour en savoir plus, consulter la rubrique{" "}
                        <Link href="/comprendre-les-donnees" color="bluefrance" isUnderlined>
                          Comprendre les données <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Que recouvrent les chiffres clefs de l’apprentissage ?",
                  content: (
                    <Box>
                      <Text>
                        L’équipe du tableau de bord récolte des données permettant d’identifier, de fiabiliser et de
                        contrôler les données concernant les apprenantes et apprenants, les formations, les contrats et
                        les organismes de formation.
                        <br />
                        <br />
                        Aucune donnée n’est modifiée ou retraitée. Elles permettent d’identifier le nombre d’
                        “apprentis” (avec formation et contrat), de stagiaires de la formation professionnelle ou
                        “inscrits sans contrat” (inscrits en formation mais sans aucun contrat pour cette formation), de
                        “rupturants” (inscrits en formation avec un contrat rompu en attente d’un nouveau contrat),
                        “abandons” (ayant quitté la formation et l’employeur).
                        <br />
                        <br />
                        Pour en savoir plus, consulter la rubrique{" "}
                        <Link href="/comprendre-les-donnees" color="bluefrance" isUnderlined>
                          Comprendre les données <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Comment se construit le tableau de bord ? Puis-je y participer ?",
                  content: (
                    <Box>
                      <Text>
                        Le tableau de bord est un produit de la Mission Nationale pour le développement de
                        l’apprentissage, qui est incubée au sein de beta.gouv.
                        <br />
                        <br />
                        L’équipe du tableau de bord est organisée selon les principes de l’Agilité, elle fait évoluer le
                        produit tableau de bord en fonction des besoins des utilisateurs par cycles courts, elle délivre
                        de la valeur ou de nouvelles fonctionnalités à chaque itération. Cela permet de rester aligné
                        avec les besoins réels de visibilité sur les chiffres clés de l’apprentissage, des usages des
                        organismes de formation et la capacité de développement.
                        <br />
                        <br />
                        Cette méthodologie permet aussi d&apos;inclure tout au long du processus celles et ceux qui sont
                        concernés, que ce soit les organismes de formation ou les institutions (DREETS, Académies, etc).
                        Aussi si vous avez des retours à faire concernant le {PRODUCT_NAME} , l’équipe est à votre
                        écoute,
                        <br />
                        n’hésitez pas à nous contacter :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isUnderlined
                          isExternal
                        >
                          contactez-nous
                        </Link>
                        .
                      </Text>
                    </Box>
                  ),
                },
              ]}
            />
            <Heading marginTop="4w" as="h3" fontSize="beta" color="#000091">
              Si vous êtes organisme de formation (CFA ou UFA) :
            </Heading>
            <BaseAccordionGroup
              AccordionItemsDetailList={[
                {
                  title: "Comment transmettre les données de mon organisme au tableau de bord de l’apprentissage ?",
                  content: (
                    <Box>
                      <UnorderedList marginLeft="3w">
                        <ListItem>
                          Si vous utilisez les ERP suivants : Gesti, Ymag, SC Form, Formasup, FCA Manager ou Auriga, un
                          simple paramétrage suffit pour vous brancher au tableau de bord. La démarche n’est à faire
                          qu’une seule fois et est estimée à 10 minutes. Pour ce faire, [sélectionner l’ERP que vous
                          utilisez] et téléchargez le pas à pas correspondant :{" "}
                          <Link href="/organisme-formation/transmettre" color="bluefrance" isUnderlined>
                            Comment transmettre les données de mon organisme au tableau de bord de l’apprentissage ?
                            <Box as="i" className="ri-links-line" />
                          </Link>
                        </ListItem>
                        <ListItem>
                          Si vous utilisez les ERP suivants : CNAM (Gessic@), Alcuin Software, Hyperplanning,
                          Valsoftware, Agate Les travaux de développement sont en cours, vous pourrez prochainement
                          transmettre directement via votre ERP, n’hésitez pas à nous transmettre vos coordonnées pour
                          que nous vous tenions informés dès que cette fonctionnalité sera disponible :{" "}
                          <Link
                            href={SUPPORT_PAGE_ACCUEIL}
                            color="bluefrance"
                            whiteSpace="nowrap"
                            isExternal
                            isUnderlined
                          >
                            contactez-nous
                          </Link>
                          .
                        </ListItem>
                        <ListItem>
                          Si vous n’utilisez aucun de ces logiciels, nous travaillons à une solution gratuite et simple
                          pour transmettre vos données et répondre à l’obligation légale de données de la visibilité aux
                          acteurs publics, celle-ci vous sera proposée dès le quatrième trimestre 2022. Nous avons
                          besoin d’organismes pour tester cette solution, pour vous inscrire ou simplement pour être
                          informé de l’ouverture de ce service, n’hésitez pas à nous contacter :{" "}
                          <Link
                            href={SUPPORT_PAGE_ACCUEIL}
                            color="bluefrance"
                            whiteSpace="nowrap"
                            isExternal
                            isUnderlined
                          >
                            contactez-nous
                          </Link>
                        </ListItem>
                      </UnorderedList>
                    </Box>
                  ),
                },
                {
                  title:
                    "Comment paramétrer mon logiciel de gestion pour qu’il transmette automatiquement au tableau de bord ? Combien de temps cela prend-t-il ?",
                  content: (
                    <Box>
                      <Text>
                        <Link href="/organisme-formation/transmettre" color="bluefrance" isUnderlined>
                          Consultez le pas à pas pour vous accompagner dans le paramétrage de votre ERP.
                          <Box as="i" className="ri-links-line" />
                        </Link>
                        <br />
                        <br />
                        Si vous avez un ERP interfaçé avec le tableau de bord, le paramétrage prend une dizaine de
                        minutes, vous n’avez pas à renouveler l’opération, sauf si vous changez d’UAI, de SIRET ou
                        d’ERP. Pour en savoir plus, consultez{" "}
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Dois-je informer les apprenantes et les apprenants que je transmets ces données ?",
                  content: (
                    <Box>
                      <Text>
                        Les données personnelles ne sont jamais exposées sur le tableau de bord et seules les
                        institutions publiques ont accès aux données. Dans le cadre de la mission publique que vous
                        exercez en administrant la formation en apprentissage, vous avez une obligation légale de donner
                        de la visibilité aux administrations concernées.
                        <br />
                        <br />
                        Il n’est nullement nécessaire de demander un consentement supplémentaire à vos apprenants et
                        apprenantes dans ce cadre. Aucune donnée personnelle n’est rendue publique.
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Qu’est-ce qu’un UAI ? Comment retrouver l’UAI de votre organisme ?",
                  content: (
                    <Box>
                      <Text>
                        L’UAI (unité administrative immatriculée) est le code d’immatriculation qu’utilise l’Éducation
                        Nationale pour enregistrer un organisme dans le Répertoire National des Etablissements (RNE).
                        Elle est composée de sept chiffres et une lettre.
                        <br />
                        <br />
                        Si vous avez des doutes ou des questions sur les UAI, consultez le référentiel national de
                        l’apprentissage :{" "}
                        <Link
                          href="https://referentiel.apprentissage.beta.gouv.fr/"
                          color="bluefrance"
                          isUnderlined
                          isExternal
                        >
                          https://referentiel.apprentissage.beta.gouv.fr <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "J’ai plusieurs UAI, laquelle renseigner ?",
                  content: (
                    <Box>
                      <Text>
                        Renseigner l’UAI de votre établissement.
                        <br />
                        <br />
                        Si vous êtes organisme responsable remplissez votre UAI.
                        <br />
                        <br />
                        Si vous êtes un organisme formateur renseignez l’UAI formateur, grâce au référentiel nous
                        pourrons retrouver vos liens avec les autres organismes.
                        <br />
                        <br />
                        Si vous avez des doutes ou des questions sur les UAI, consultez le référentiel national de
                        l’apprentissage :{" "}
                        <Link
                          href="https://referentiel.apprentissage.beta.gouv.fr/"
                          color="bluefrance"
                          isUnderlined
                          isExternal
                        >
                          https://referentiel.apprentissage.beta.gouv.fr <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Mes données peuvent-elles être consultées par d’autres organismes de formation ?",
                  content: (
                    <Box>
                      <Text>
                        Non !
                        <br />
                        Vos données ne peuvent être consultées que par votre organisme et par les administrations
                        publiques dans le cadre de la politique de l’apprentissage.
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Quelles institutions ont accès aux données du tableau de bord ?",
                  content: (
                    <Box>
                      <Text>
                        Des institutions qui pilotent l&apos;apprentissage nationalement ou territorialement comme la
                        DREETS et l&apos;Académie par exemple.
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Comment sont utilisées les données des apprenantes et apprenants ?",
                  content: (
                    <Box>
                      <Text>
                        Les données personnelles ne sont pas exploitées sauf dans le cadre d’une convention avec une
                        administration publique locale pour mettre en place un accompagnement des jeunes en situation de
                        décrochage.
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Est-ce que les données de votre organisme s’affichent sur le tableau de bord ?",
                  content: (
                    <Box>
                      <Text>
                        Les données de votre organisme s’affichent si vous avez autorisé votre ERP (ou logiciel de
                        gestion) à transmettre vos données au tableau de bord de l’apprentissage ou si vous avez
                        transmis via le service partage simplifié.
                        <br />
                        <br />
                        Pour en savoir plus consulter{" "}
                        <Link href="/organisme-formation/transmettre" color="bluefrance" isUnderlined>
                          Comment transmettre les données de mon organisme au tableau de bord de l’apprentissage ?
                          <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Puis-je télécharger les données affichées pour les vérifier ?",
                  content: (
                    <Box>
                      <Text>
                        Toutes les données que vous transmettez sont accessibles via votre URL privée. Vous avez
                        également la possibilité de télécharger ces données en fichier XLS.
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Comment puis-je participer à l’amélioration du tableau de bord ?",
                  content: (
                    <Box>
                      <Text>
                        Nous avons actuellement plusieurs travaux et recherches en cours afin d’améliorer le tableau de
                        bord et les fonctionnalités à disposition. Si vous souhaitez y participer ou nous faire un
                        retour, vous pouvez nous contacter :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isUnderlined
                          isExternal
                        >
                          contactez-nous
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Quelles sont les données affichées ?",
                  content: (
                    <Box>
                      <Text>
                        Les données affichées sont celles transmises par votre établissement via votre ERP ou via
                        Partage Simplifié.
                        <br />
                        <br />
                        Ces données ne sont pas transformées, elles sont agrégées afin d’identifier le nombre
                        d’apprentis par niveau et code diplôme, les inscrits sans contrats, les rupturants et les
                        abandons.
                        <br />
                        <br />
                        Pour plus d’informations, consultez la rubrique{" "}
                        <Link href="/comprendre-les-donnees" color="bluefrance" isUnderlined>
                          Comprendre les données <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Comment consulter ses données sur le tableau de bord ?",
                  content: (
                    <Box>
                      <Text>
                        Vous pouvez consultez vos données via une URL privée dont le lien se trouve directement dans
                        votre ERP. Pour les utilisateurs de Partage Simplifié (le service du tableau de bord vous
                        permettant de transmettre vos données sans utiliser un ERP) cette URL vous sera communiquée
                        après la première transmission d’un fichier.
                        <br />
                        <br />
                        Si toutefois vous n’aviez pas reçu ou n’aviez pas accès à cette URL, vous pouvez en faire la
                        demande en contactant l’équipe du tableau de bord :{" "}
                        <Link
                          href={SUPPORT_PAGE_ACCUEIL}
                          color="bluefrance"
                          whiteSpace="nowrap"
                          isExternal
                          isUnderlined
                        >
                          contactez-nous
                        </Link>{" "}
                        en précisant l’UAI de votre établissement et l’adresse courriel enregistrée auprès de nos
                        services.
                      </Text>
                    </Box>
                  ),
                },
              ]}
            />
            <Heading marginTop="4w" as="h3" fontSize="beta" color="#000091">
              Si vous êtes une institution :
            </Heading>
            <BaseAccordionGroup
              AccordionItemsDetailList={[
                {
                  title: "Quelles sont les données affichées dans le tableau de bord ?",
                  content: (
                    <Box>
                      <Text>
                        Aucune donnée n’est modifiée ou retraitée. Elles permettent d’identifier le nombre d’
                        “apprentis” (avec formation et contrat), de stagiaires de la formation professionnelle ou
                        “inscrits sans contrat” (inscrits en formation mais sans aucun contrat pour cette formation), de
                        “rupturants” (inscrits en formation avec un contrat rompu en attente d’un nouveau contrat),
                        “abandons” (ayant quitté la formation et l’employeur).
                        <br />
                        <br />
                        Pour en savoir plus, consulter la rubrique{" "}
                        <Link href="/comprendre-les-donnees" color="bluefrance" isUnderlined>
                          Comprendre les données <Box as="i" className="ri-links-line" />
                        </Link>
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Puis-je télécharger les données affichées pour les vérifier ?",
                  content: (
                    <Box>
                      <Text>
                        Toutes les données auxquelles vous avez accès sur le tableau de bord sont téléchargeables en XLS
                        afin d’en faciliter le traitement.
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Qui sont les utilisateurs du tableau de bord de l’apprentissage",
                  content: (
                    <Box>
                      Nous avons à ce jour 4 types d’utilisateurs :
                      <UnorderedList marginLeft="3w">
                        <ListItem>
                          Les organismes de formation, qui fournissent les chiffres clés de l’apprentissage et peuvent
                          consulter les données de leur propre organisme;
                        </ListItem>
                        <ListItem>
                          Les réseaux d’organismes de formation constitués, comme par exemple les CMA, les CCI, les MFR
                          ou bien encore Excellence pro ou CGE (conférence des grandes écoles);
                        </ListItem>
                        <ListItem>
                          Les utilisateurs pilotes : DREETS, DGEFP, Académies, acteurs locaux et nationaux de
                          l&apos;apprentissage;
                        </ListItem>
                        <ListItem>
                          L’équipe du tableau de bord, dont les membres sont des utilisateurs administrateurs afin de
                          faire évoluer la plateforme et de vous accompagner dans son utilisation.
                        </ListItem>
                      </UnorderedList>
                    </Box>
                  ),
                },
                {
                  title: "J’ai entendu parler d’expérimentation, de quoi s’agit-il ?",
                  content: (
                    <Box>
                      <Text>
                        L’équipe du tableau de bord travaille par courtes itérations pour fournir régulièrement aux
                        utilisateurs de nouvelles fonctionnalités. Cela permet également de définir les usages réels du
                        produit. À ce jour, outre les chiffres clés de l’apprentissage, le tableau de bord est en
                        capacité de fournir aux institutions publiques un certain nombre de données sur l’apprentissage.
                        Plusieurs régions ont entamé des expérimentations afin d’accompagner les jeunes en situation de
                        décrochage scolaire à partir des données fournie par le {PRODUCT_NAME} .
                      </Text>
                    </Box>
                  ),
                },
                {
                  title: "Comment puis-je participer à l’amélioration du tableau de bord ?",
                  content: (
                    <Box>
                      <Text>
                        Le tableau de bord est dans un processus d’amélioration continue. Nous menons des travaux de
                        fiabilisation des données et et travaillons en collaboration avec les pilotes de l’apprentissage
                        pour nous accompagner dans cette démarche : redressement de données, lien avec les organismes de
                        formation qui ne transmettent pas encore leurs données au tableau de bord, suggestion
                        d’amélioration, etc.
                        <br />
                        <br />
                        En parallèle, l’équipe tableau de bord développe actuellement une interface pour vous permettre
                        de nous remonter facilement vos demandes d’évolutions, corrections. Grâce à votre expertise de
                        terrain, vous pourrez ainsi directement nous accompagner à la fiabilisation de la donnée.
                      </Text>
                    </Box>
                  ),
                },
              ]}
            />
            <Box marginTop="4w" marginBottom="4w">
              <ChakraLink
                fontSize="delta"
                borderBottom="1px solid"
                _hover={{ textDecoration: "none" }}
                onClick={() => scrollToTop()}
              >
                <Box as="i" className="ri-arrow-up-fill" /> Haut de page
              </ChakraLink>
            </Box>
          </Section>
        </Container>
      </Box>
    </Page>
  );
}
