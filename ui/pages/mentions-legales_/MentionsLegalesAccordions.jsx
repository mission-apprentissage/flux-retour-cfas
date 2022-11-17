import { Box, Heading, Link, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

import { CONTACT_ADDRESS, PRODUCT_NAME } from "../../common/constants/product";
import { BaseAccordionGroup } from "../../components/BaseAccordionGroup/BaseAccordionGroup";

// prettier-ignore
const MentionsLegalesAccordions = () => (
  <BaseAccordionGroup
    AccordionItemsDetailList={[
      {
        title: "Mentions légales obligatoires",
        content: (
          <Box>
            <Box>
              <Heading as="h2" fontSize="22px">
                Identification de l’éditeur
              </Heading>
              <Text marginTop="1v">
                Ce site est édité par la Mission interministérielle de l’apprentissage <br />
                Située à l’adresse chez beta.gouv <br />
                Adresse : 20, avenue de Ségur - 75007 Paris.
              </Text>
            </Box>
            <Box marginTop="1w">
              <Heading as="h2" fontSize="22px">
                Directeur de la publication
              </Heading>
              <Text marginTop="1v">
                Guillaume Houzel, Chargé de mission nationale interministérielle pour faciliter les entrées en
                apprentissage
              </Text>
            </Box>
            <Box marginTop="1w">
              <Heading as="h2" fontSize="22px">
                Prestataire d’hébergement
              </Heading>
              <Text marginTop="1v">
                L’hébergement est assuré par OVH, situé à l’adresse suivante : <br />
                2 rue Kellermann
                <br />
                59100 Roubaix
                <br />
                Standard : 09.72.10.07 <br />
                <br />
                La conception et la réalisation du site sont effectuée par La Mission Interministérielle pour
                l’Apprentissage, située à l’adresse suivante : <br />
                Beta.gouv
                <br />
                20 avenue de Ségur
                <br />
                75007 Paris
              </Text>
            </Box>
            <Box marginTop="1w">
              <Heading as="h2" fontSize="22px">
                Traitement des données à caractère personnel
              </Heading>
              <Text marginTop="1v">
                Le traitement concourt à la coordination des acteurs de l’apprentissage par la mise en visibilité
                des évolutions des effectifs sur les formations en apprentissage. Ainsi, tous les acteurs de
                l’apprentissage réunis au sein du Service Public de l’Emploi et/ou de l’Orientation, les participants
                au CREFOP disposent de données actualisées qui leur permettent de construire des plans
                d’action visant à développer le nombre de jeunes en formation en apprentissage.<br /> 
                Le traitement de collecte des données relatives aux candidats à l’apprentissage et aux apprentis
                s’inscrit dans une mission d’intérêt public (article 6, alinéa e/ du Règlement général sur la
                protection des données), décrite dans le cadre de la mission Houzel. Cette mission Houzel fait
                l’objet de deux lettres en date du 10 septembre 2019 puis du 25 février 2020, mais aussi de deux
                décisions du gouvernement en date du 26 novembre 2019 et du 15 octobre 2020.
                <br />
                La licéité du traitement est donc celle de l’article 6-1 e): la mission d’intérêt public.
                <br />
                <br />
                <Link as={NavLink} to="/donnees-personnelles" color="bluefrance" textDecoration="underLine">
                  Pour en savoir plus <Box as="i" className="ri--link-line" />
                </Link>
              </Text>
            </Box>
          </Box>
        ),
      },
      {
        title: "Logiciels utilisés",
        content: (
          <Box>
            <Heading as="h2" fontSize="22px">
              Messagerie du support
            </Heading>
            <Text marginTop="1v">
              La gestion du chat du support est réalisée avec le logiciel Crisp de la société Crisp
              <br />
              <br />
              Le suivi et l’analyse est effectué avec le logiciel SAAS Plausible, de la société Plausible Analytics.
            </Text>
          </Box>
        ),
      },
      {
        title: "Liens hypertextes (responsabilité)",
        content: (
          <Text>
            Cfas.Apprentissage.beta.gouv.fr propose des liens vers d&apos;autres sites officiels (gouvernement,
            institutions, organismes publics, etc.). Nous indiquons systématiquement vers quel site nous
            vous proposons d&apos;aller. Cependant, ces pages web dont les adresses sont régulièrement
            vérifiées ne font pas partie du portail : elles n&apos;engagent pas la responsabilité de la Mission
            Nationale pour l’Apprentissage.
          </Text>
        ),
      },
      {
        title: "Propriété intellectuelle",
        content: (
          <Box>
            <Heading as="h2" fontSize="22px">
              Établir un lien
            </Heading>
            <Text marginTop="1v">
              Tout site public ou privé est autorisé à établir, sans autorisation préalable, un lien vers les
              informations diffusées sur service-public.fr. En revanche, les pages du portail ne doivent pas être
              imbriquées à l&apos;intérieur des pages d&apos;un autre site et le {PRODUCT_NAME} ne
              peut être utilisé à des fins commerciales.
            </Text>
            <Heading as="h2" fontSize="22px" marginTop="1w">
              Illustrations
            </Heading>
            <Text marginTop="1v">
              Pour en savoir plus, se référer au{" "}
              <Link
                href="https://gouvfr.atlassian.net/wiki/spaces/DB/overview"
                color="bluefrance"
                textDecoration="underLine"
              >
                Design System de l’État <Box as="i" className="ri--link-line" />
              </Link>
            </Text>
            <Heading as="h2" fontSize="22px" marginTop="1w">
              Accessibilité
            </Heading>
            <Text marginTop="1v">
              L&apos;initiative internationale pour l&apos;accessibilité du Web (Web Accessiblility Initiative) définit
              l&apos;accessibilité du Web comme suit :
              <br />
              <br />
              L&apos;accessibilité du Web signifie que les personnes en situation de handicap peuvent utiliser le Web.
              <br />
              Plus précisément, qu&apos;elles peuvent percevoir, comprendre, naviguer
              et interagir avec le Web, et qu&apos;elles peuvent contribuer sur le Web.
              <br />
              L&apos;accessibilité du Web bénéficie aussi à d&apos;autres, notamment les
              personnes âgées dont les capacités changent avec l&apos;âge.
              <br />
              L&apos;accessibilité du Web comprend tous les handicaps qui affectent l&apos;accès au Web, ce qui inclut
              les handicaps visuels, auditifs, physiques, de paroles, cognitives et neurologiques.
              <br />
              <br />
              L&apos;article 47 de la loi n° 2005-102 du 11 février 2005 pour l&apos;égalité des droits et des chances,
              la participation et la citoyenneté des personnes handicapées fait de l&apos;accessibilité une exigence pour tous les services
              de communication publique en ligne de l&apos;État, les collectivités territoriales et les établissements
              publics qui en dépendent.
              <br />
              <br />
              Il stipule que les informations diffusées par ces services doivent être
              accessibles à tous. Le référentiel général d&apos;accessibilité pour les administrations (RGAA) rendra
              progressivement accessible l&apos;ensemble des informations fournies par ces services.
              <br />
              <br />
              Le site du Tableau de bord est en cours d&apos;optimisation afin de le rendre conforme au{" "}
              <Link
                href="https://www.numerique.gouv.fr/publications/rgaa-accessibilite"
                color="bluefrance"
                textDecoration="underLine"
              >
                RGAA
                <Box as="i" className="ri--link-line" />
              </Link>
              .
              <br /> La déclaration de conformité sera publiée ultérieurement.
            </Text>
          </Box>
        ),
      },
      {
        title: "Plus d’infos ?",
        content: (
          <Box>
            <Heading as="h2" fontSize="22px">
              Conception et gestion
            </Heading>
            <Text marginTop="1v">
              Ce site est développé en méthode agile, avec le principe d’amélioration continue.
              <br />
              De nouvelles fonctionnalités seront ajoutées prochainement
            </Text>
            <Heading as="h2" fontSize="22px" marginTop="1w">
              Sécurité
            </Heading>
            <Text marginTop="1v">
              Le site est protégé par un certificat électronique, matérialisé pour la grande majorité des navigateurs
              par un cadenas. Cette protection participe à la confidentialité des échanges. En aucun cas les services
              associés ne seront à l’origine d’envoi de courriels pour demander la saisie d’informations personnelles
            </Text>
          </Box>
        ),
      },
      {
        title: "Contact",
        content: (
          <Box>
            {" "}
            <Text>
              L’équipe du tableau de bord peut être contactée directement à :{" "}
              <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                {CONTACT_ADDRESS}
              </Link>
            </Text>
          </Box>
        ),
      },
    ]}
    TextColor="bluefrance"
  />
);

export default MentionsLegalesAccordions;
