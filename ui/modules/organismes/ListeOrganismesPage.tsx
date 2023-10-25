import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Box,
  Container,
  HStack,
  Heading,
  ListItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import { _get } from "@/common/httpClient";
import { OrganisationType, getOrganisationLabel } from "@/common/internal/Organisation";
import { Organisme } from "@/common/internal/Organisme";
import { normalize } from "@/common/utils/stringUtils";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import useAuth from "@/hooks/useAuth";

import OrganismesACompleterPanelContent from "./tabs/OrganismesACompleterPanelContent";
import OrganismesFermesSansTransmissionOuInconnusPanelContent from "./tabs/OrganismesFermesSansTransmissionOuInconnusPanelContent";
import OrganismesFiablesPanelContent from "./tabs/OrganismesFiablesPanelContent";

export type OrganismeNormalized = Organisme & {
  normalizedName: string;
  normalizedUai: string;
  normalizedCommune: string;
};

// L’ordre est celui des tabs
const tabs = [
  {
    key: "fiables",
    route: "/organismes",
    index: 0,
  },
  {
    key: "a-completer",
    route: "/organismes/a-completer",
    index: 1,
  },
  {
    key: "fermesSansTransmission-inconnus",
    route: "/organismes/fermesSansTransmission-inconnus",
    index: 2,
  },
] as const;

interface ListeOrganismesPageProps {
  organismes: Organisme[];
  modePublique: boolean;
  activeTab: (typeof tabs)[number]["key"];
}

function ListeOrganismesPage(props: ListeOrganismesPageProps) {
  const router = useRouter();
  const { auth, organisationType } = useAuth();

  const title = `${props.modePublique ? "Ses" : "Mes"} organismes${
    props.activeTab === "a-completer" ? " non fiables" : ""
  }`;

  const { organismesFiables, organismesACompleter, organismesFermesSansTransmissionOuInconnus, nbOrganismesFermes } =
    useMemo(() => {
      const organismesFiables: OrganismeNormalized[] = [];
      const organismesACompleter: OrganismeNormalized[] = [];
      const organismesFermesSansTransmissionOuInconnus: OrganismeNormalized[] = [];
      let nbOrganismesFermes = 0;
      (props.organismes || []).forEach((organisme: OrganismeNormalized) => {
        // We need to memorize organismes with normalized names to be avoid running the normalization on each keystroke.
        organisme.normalizedName = normalize(organisme.enseigne ?? organisme.raison_sociale ?? "");
        organisme.normalizedUai = normalize(organisme.uai ?? "");
        organisme.normalizedCommune = normalize(organisme.adresse?.commune ?? "");

        if (organisme.fiabilisation_statut === "FIABLE" && !organisme.ferme && organisme.nature !== "inconnue") {
          organismesFiables.push(organisme);
        } else if (
          // Organismes à masquer :
          // organismes fermés et ne transmettant pas
          // organismes inconnus (sans raison sociale ni enseigne) et absents du référentiel ou fermé
          (organisme.ferme && !organisme.last_transmission_date) ||
          (!organisme.enseigne &&
            !organisme.raison_sociale &&
            (organisme.est_dans_le_referentiel === "absent" || organisme.ferme))
        ) {
          nbOrganismesFermes++;
          organismesFermesSansTransmissionOuInconnus.push(organisme);
        } else {
          organismesACompleter.push(organisme);
          if (organisme.ferme) {
            nbOrganismesFermes++;
          }
        }
      });

      return {
        organismesFiables,
        organismesACompleter,
        organismesFermesSansTransmissionOuInconnus,
        nbOrganismesFermes,
      };
    }, [props.organismes]);

  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          {props.modePublique ? "Ses organismes" : getHeaderTitleFromOrganisationType(organisationType)}
        </Heading>

        <Text>Retrouvez ci-dessous&nbsp;:</Text>
        <UnorderedList styleType="'- '">
          <ListItem>
            les <strong>{organismesFiables.length}</strong> établissements <strong>fiables</strong>{" "}
            {props.modePublique ? "rattachés à cet organisme" : getTextContextFromOrganisationType(organisationType)} et
            la nature de chacun (inclus les prépa-apprentissage, CFA académiques, d’entreprise, etc.)
          </ListItem>
          {organismesACompleter.length !== 0 && (
            <ListItem>
              les <strong>{organismesACompleter.length}</strong> établissements <strong>non-fiabilisés</strong>
              {nbOrganismesFermes > 0 && (
                <>
                  {" "}
                  dont <strong>{nbOrganismesFermes}</strong> établissement
                  {nbOrganismesFermes > 1 ? "s" : ""}{" "}
                  <strong>
                    fermé
                    {nbOrganismesFermes > 1 ? "s" : ""}
                  </strong>
                  .
                </>
              )}
            </ListItem>
          )}
        </UnorderedList>
        <Text fontStyle="italic">Sources : Catalogue et Référentiel de l’apprentissage</Text>

        <HStack justifyContent="space-between">
          <Box />
          <Link
            href={`mailto:${CONTACT_ADDRESS}?subject=Anomalie TDB [${getOrganisationLabel(auth.organisation)}]`}
            target="_blank"
            rel="noopener noreferrer"
            color="action-high-blue-france"
            borderBottom="1px"
            _hover={{ textDecoration: "none" }}
          >
            <ArrowForwardIcon mr={2} />
            Signaler une anomalie
          </Link>
        </HStack>

        {/* Si pas d'organismes non fiables alors on affiche pas les onglets et juste une seule liste */}
        {organismesACompleter.length === 0 && organismesFermesSansTransmissionOuInconnus.length === 0 ? (
          <OrganismesFiablesPanelContent organismes={organismesFiables} />
        ) : (
          <Tabs
            isLazy
            lazyBehavior="keepMounted"
            index={tabs.find((tab) => tab.key === props.activeTab)?.index}
            onChange={(index) => {
              router.push(
                {
                  pathname: `${props.modePublique ? "/organismes/[organismeId]" : ""}${tabs[index]?.route}`,
                  query: {
                    ...router.query,
                  },
                },
                undefined,
                {
                  shallow: true,
                }
              );
            }}
            mt="12"
          >
            <TabList>
              <Tab fontWeight="bold">Organismes fiables ({organismesFiables.length})</Tab>
              <Tab fontWeight="bold">
                <HStack>
                  <i className="ri-alarm-warning-fill"></i>
                  <Text>OFA : corrections attendues ({organismesACompleter.length})</Text>
                </HStack>
              </Tab>
              {organisationType === "ADMINISTRATEUR" && (
                <Tab fontWeight="bold">
                  <HStack>
                    <i className="ri-close-circle-fill"></i>
                    <Text>
                      OFA : fermés ne transmettant pas ou inconnus ({organismesFermesSansTransmissionOuInconnus.length})
                    </Text>
                  </HStack>
                </Tab>
              )}
            </TabList>
            <TabPanels>
              <TabPanel>
                <OrganismesFiablesPanelContent organismes={organismesFiables} />
              </TabPanel>
              <TabPanel>
                <OrganismesACompleterPanelContent organismes={organismesACompleter} />
              </TabPanel>
              {organisationType === "ADMINISTRATEUR" && (
                <TabPanel>
                  <OrganismesFermesSansTransmissionOuInconnusPanelContent
                    organismes={organismesFermesSansTransmissionOuInconnus}
                  />
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        )}
      </Container>
    </SimplePage>
  );
}

export default ListeOrganismesPage;

function getHeaderTitleFromOrganisationType(type: OrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION":
      return "Mes organismes";

    case "TETE_DE_RESEAU":
      return "Les organismes de mon réseau";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
      return "Les organismes de mon territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return "Tous les organismes";

    default:
      throw new Error(`Type ’${type}’ inconnu`);
  }
}

function getTextContextFromOrganisationType(type: OrganisationType) {
  switch (type) {
    case "ORGANISME_FORMATION":
      return "rattachés à votre organisme";

    case "TETE_DE_RESEAU":
      return "de votre réseau";

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
    case "CARIF_OREF_REGIONAL":
    case "DDETS":
    case "ACADEMIE":
      return "de votre territoire";

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "CARIF_OREF_NATIONAL":
    case "ADMINISTRATEUR":
      return "de l'ensemble du territoire";

    default:
      throw new Error(`Type ’${type}’ inconnu`);
  }
}
